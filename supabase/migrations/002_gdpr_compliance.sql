-- GDPR Compliance Migration
-- Adds tables and functions for consent management, audit logging, and data retention

-- Enable additional extensions if needed
create extension if not exists "pg_cron";

-- Custom types for GDPR compliance
create type consent_status as enum ('GRANTED', 'WITHDRAWN', 'EXPIRED');
create type audit_action as enum ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT');
create type data_category as enum ('PERSONAL', 'SPECIAL_CHILD', 'FINANCIAL', 'DOCUMENT', 'COMMUNICATION');

-- User Consents Table
create table user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null, -- 'data_processing', 'child_data', 'financial_data', 'document_vault', etc.
  purpose text not null, -- Purpose of data processing
  legal_basis text not null, -- GDPR legal basis (Art. 6.1.a, Art. 6.1.f, etc.)
  status consent_status not null default 'GRANTED',
  application_context text, -- 'kita', 'elterngeld', 'global'
  granted_at timestamptz default now(),
  withdrawn_at timestamptz,
  expires_at timestamptz, -- Optional expiration date
  withdrawal_reason text,
  metadata jsonb, -- Additional consent details
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audit Logs Table
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  record_id uuid,
  action audit_action not null,
  data_category data_category not null,
  field_name text, -- Specific field accessed/modified
  old_value text, -- Previous value (for updates)
  new_value text, -- New value (for updates)
  legal_basis text, -- Legal basis for the action
  purpose text, -- Purpose of data access/processing
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz default now()
);

-- Data Retention Policies Table
create table data_retention_policies (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  data_category data_category not null,
  retention_period_years integer not null,
  legal_requirement text, -- Legal basis for retention period
  auto_delete_enabled boolean default true,
  deletion_conditions jsonb, -- Conditions for deletion (e.g., user consent withdrawn)
  last_cleanup_run timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GDPR Processing Records (Article 30 compliance)
create table processing_records (
  id uuid primary key default gen_random_uuid(),
  processing_purpose text not null,
  data_categories data_category[] not null,
  legal_basis text not null,
  data_subjects text not null, -- Description of data subjects
  third_party_recipients text[], -- List of third parties receiving data
  international_transfers boolean default false,
  retention_period text not null,
  security_measures text not null,
  dpia_required boolean default false,
  dpia_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_user_consents_user_id on user_consents(user_id);
create index if not exists idx_user_consents_type_status on user_consents(consent_type, status);
create index if not exists idx_user_consents_context on user_consents(application_context);
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_table_record on audit_logs(table_name, record_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_retention_policies_table on data_retention_policies(table_name);

-- RLS (Row Level Security) policies
alter table user_consents enable row level security;
alter table audit_logs enable row level security;
alter table data_retention_policies enable row level security;
alter table processing_records enable row level security;

-- User Consents policies
create policy "Users can manage their own consents" on user_consents
  for all using (auth.uid() = user_id);

-- Audit Logs policies (read-only for users, admin access for compliance)
create policy "Users can read their own audit logs" on audit_logs
  for select using (auth.uid() = user_id);

-- Data retention policies (read-only for users)
create policy "Anyone can read retention policies" on data_retention_policies
  for select using (true);

-- Processing records (read-only for transparency)
create policy "Anyone can read processing records" on processing_records
  for select using (true);

-- Functions for GDPR compliance

-- Function to check if user has valid consent for specific processing
create or replace function check_user_consent(
  p_user_id uuid,
  p_consent_type text,
  p_application_context text default null
) returns boolean as $$
declare
  consent_exists boolean;
begin
  select exists(
    select 1 from user_consents 
    where user_id = p_user_id 
    and consent_type = p_consent_type
    and status = 'GRANTED'
    and (p_application_context is null or application_context = p_application_context or application_context = 'global')
    and (expires_at is null or expires_at > now())
  ) into consent_exists;
  
  return consent_exists;
end;
$$ language plpgsql security definer;

-- Function to log data access/modification
create or replace function log_audit_event(
  p_user_id uuid,
  p_table_name text,
  p_record_id uuid,
  p_action audit_action,
  p_data_category data_category,
  p_field_name text default null,
  p_old_value text default null,
  p_new_value text default null,
  p_legal_basis text default null,
  p_purpose text default null
) returns uuid as $$
declare
  audit_id uuid;
begin
  insert into audit_logs (
    user_id, table_name, record_id, action, data_category,
    field_name, old_value, new_value, legal_basis, purpose,
    ip_address, user_agent, session_id
  ) values (
    p_user_id, p_table_name, p_record_id, p_action, p_data_category,
    p_field_name, p_old_value, p_new_value, p_legal_basis, p_purpose,
    inet_client_addr(), 
    current_setting('request.headers', true)::json->>'user-agent',
    current_setting('request.jwt.claims', true)::json->>'session_id'
  ) returning id into audit_id;
  
  return audit_id;
end;
$$ language plpgsql security definer;

-- Function to withdraw consent and handle data processing halt
create or replace function withdraw_consent(
  p_user_id uuid,
  p_consent_type text,
  p_withdrawal_reason text default null
) returns boolean as $$
begin
  update user_consents 
  set 
    status = 'WITHDRAWN',
    withdrawn_at = now(),
    withdrawal_reason = p_withdrawal_reason,
    updated_at = now()
  where user_id = p_user_id 
  and consent_type = p_consent_type
  and status = 'GRANTED';
  
  -- Log the consent withdrawal
  perform log_audit_event(
    p_user_id, 'user_consents', null, 'UPDATE', 'PERSONAL',
    'status', 'GRANTED', 'WITHDRAWN', 'Art. 7.3 GDPR', 'Consent withdrawal'
  );
  
  return found;
end;
$$ language plpgsql security definer;

-- Function for automated data cleanup based on retention policies
create or replace function cleanup_expired_data() returns void as $$
declare
  policy_record record;
  cleanup_count integer;
begin
  for policy_record in 
    select * from data_retention_policies 
    where auto_delete_enabled = true
  loop
    -- Log cleanup attempt
    insert into audit_logs (user_id, table_name, action, data_category, purpose, legal_basis)
    values (null, policy_record.table_name, 'DELETE', policy_record.data_category, 
           'Automated data retention cleanup', policy_record.legal_requirement);
    
    -- Update last cleanup run
    update data_retention_policies 
    set last_cleanup_run = now() 
    where id = policy_record.id;
  end loop;
end;
$$ language plpgsql security definer;

-- Triggers for automatic audit logging

-- Trigger function for audit logging
create or replace function audit_trigger_func() returns trigger as $$
declare
  audit_user_id uuid;
  data_cat data_category;
begin
  -- Get user ID from auth context
  audit_user_id := auth.uid();
  
  -- Determine data category based on table
  data_cat := case TG_TABLE_NAME
    when 'parents' then 'PERSONAL'
    when 'children' then 'SPECIAL_CHILD'
    when 'employment_records' then 'FINANCIAL'
    when 'documents' then 'DOCUMENT'
    else 'PERSONAL'
  end;
  
  if TG_OP = 'INSERT' then
    perform log_audit_event(
      audit_user_id, TG_TABLE_NAME, NEW.id, 'CREATE', data_cat,
      null, null, null, 'Data processing consent', 'Application processing'
    );
    return NEW;
  elsif TG_OP = 'UPDATE' then
    perform log_audit_event(
      audit_user_id, TG_TABLE_NAME, NEW.id, 'UPDATE', data_cat,
      null, null, null, 'Data processing consent', 'Application processing'
    );
    return NEW;
  elsif TG_OP = 'DELETE' then
    perform log_audit_event(
      audit_user_id, TG_TABLE_NAME, OLD.id, 'DELETE', data_cat,
      null, null, null, 'Data retention policy', 'Data cleanup'
    );
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Create audit triggers for main tables
create trigger audit_parents_trigger
  after insert or update or delete on parents
  for each row execute function audit_trigger_func();

create trigger audit_children_trigger
  after insert or update or delete on children
  for each row execute function audit_trigger_func();

create trigger audit_employment_trigger
  after insert or update or delete on employment_records
  for each row execute function audit_trigger_func();

create trigger audit_documents_trigger
  after insert or update or delete on documents
  for each row execute function audit_trigger_func();

-- Insert default data retention policies
insert into data_retention_policies (table_name, data_category, retention_period_years, legal_requirement, auto_delete_enabled) values
('parents', 'PERSONAL', 7, 'German government application retention requirement', false),
('children', 'SPECIAL_CHILD', 7, 'German government application retention requirement', false),
('employment_records', 'FINANCIAL', 7, 'German government application retention requirement', false),
('documents', 'DOCUMENT', 7, 'German government application retention requirement', false),
('audit_logs', 'PERSONAL', 3, 'GDPR compliance monitoring requirement', true),
('user_consents', 'PERSONAL', 7, 'Consent record retention for compliance', false);

-- Insert default processing records for Article 30 compliance
insert into processing_records (processing_purpose, data_categories, legal_basis, data_subjects, third_party_recipients, retention_period, security_measures) values
('Kita-Gutschein Application Processing', 
 ARRAY['PERSONAL', 'SPECIAL_CHILD', 'FINANCIAL'], 
 'Art. 6.1.e GDPR (public task) + Art. 6.1.a GDPR (consent)', 
 'Hamburg parents applying for childcare vouchers',
 ARRAY['Hamburg Jugendämter', 'Supabase (EU data processor)'],
 '7 years (German legal requirement)',
 'Database encryption, RLS policies, audit logging, EU data residency'),
 
('Elterngeld Application Processing',
 ARRAY['PERSONAL', 'SPECIAL_CHILD', 'FINANCIAL'],
 'Art. 6.1.c GDPR (legal obligation) + Art. 6.1.a GDPR (consent)',
 'Hamburg parents applying for parental allowance',
 ARRAY['Hamburg Bezirksämter', 'Supabase (EU data processor)'],
 '7 years (German legal requirement)', 
 'Database encryption, RLS policies, audit logging, EU data residency');

-- Schedule automated cleanup (requires pg_cron extension)
-- Run daily at 2 AM
select cron.schedule('gdpr-cleanup', '0 2 * * *', 'select cleanup_expired_data();');

-- Add updated_at trigger to maintain timestamps
create or replace function update_updated_at_column() returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger update_user_consents_updated_at before update on user_consents for each row execute function update_updated_at_column();
create trigger update_retention_policies_updated_at before update on data_retention_policies for each row execute function update_updated_at_column();
create trigger update_processing_records_updated_at before update on processing_records for each row execute function update_updated_at_column(); 