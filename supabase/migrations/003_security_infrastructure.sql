-- Security Infrastructure Migration
-- Adds session management, role-based access controls, and enhanced security features

-- Enable additional extensions for security
create extension if not exists "pgcrypto";

-- Custom types for security and access control
create type user_role as enum ('USER', 'ADMIN', 'DATA_PROTECTION_OFFICER', 'AUDITOR');
create type access_level as enum ('READ', 'WRITE', 'DELETE', 'ADMIN');
create type login_method as enum ('EMAIL', 'SOCIAL', 'MFA');

-- User Sessions Table for session management
create table user_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  last_activity timestamptz default now(),
  expires_at timestamptz not null,
  ip_address inet,
  user_agent text,
  is_active boolean default true,
  login_method login_method default 'EMAIL',
  security_score integer default 100, -- Security score based on various factors
  location_country text, -- Detected country from IP
  device_fingerprint text, -- Device identification hash
  created_at_insert timestamptz default now(),
  updated_at timestamptz default now()
);

-- User Roles and Permissions
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role user_role not null default 'USER',
  granted_by uuid references auth.users(id),
  granted_at timestamptz default now(),
  expires_at timestamptz, -- Optional role expiration
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Data Access Permissions (fine-grained permissions)
create table data_access_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null,
  access_level access_level not null,
  data_category data_category not null,
  conditions jsonb, -- Additional conditions for access (e.g., own data only)
  granted_by uuid references auth.users(id),
  legal_basis text not null,
  purpose text not null,
  granted_at timestamptz default now(),
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Security Incidents Table
create table security_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_type text not null, -- 'failed_login', 'session_hijack', 'data_breach', etc.
  severity text not null, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  user_id uuid references auth.users(id),
  session_id text references user_sessions(session_id),
  ip_address inet,
  user_agent text,
  description text not null,
  details jsonb,
  resolved boolean default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Breach Notification Log (GDPR Article 33/34 compliance)
create table breach_notifications (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references security_incidents(id),
  notification_type text not null, -- 'SUPERVISORY_AUTHORITY', 'DATA_SUBJECT'
  recipient text not null, -- Authority/individual notified
  notification_method text not null, -- 'EMAIL', 'PORTAL', 'PHONE'
  sent_at timestamptz,
  content text,
  response_received boolean default false,
  response_content text,
  follow_up_required boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance and security
create index if not exists idx_user_sessions_user_id on user_sessions(user_id);
create index if not exists idx_user_sessions_session_id on user_sessions(session_id);
create index if not exists idx_user_sessions_active on user_sessions(is_active, expires_at);
create index if not exists idx_user_sessions_activity on user_sessions(last_activity);
create index if not exists idx_user_sessions_ip on user_sessions(ip_address);

create index if not exists idx_user_roles_user_id on user_roles(user_id);
create index if not exists idx_user_roles_role on user_roles(role, is_active);
create index if not exists idx_user_roles_expires on user_roles(expires_at);

create index if not exists idx_data_access_user_table on data_access_permissions(user_id, table_name);
create index if not exists idx_data_access_level on data_access_permissions(access_level, is_active);

create index if not exists idx_security_incidents_type on security_incidents(incident_type, severity);
create index if not exists idx_security_incidents_user on security_incidents(user_id, created_at);
create index if not exists idx_security_incidents_resolved on security_incidents(resolved, created_at);

-- RLS (Row Level Security) policies
alter table user_sessions enable row level security;
alter table user_roles enable row level security;
alter table data_access_permissions enable row level security;
alter table security_incidents enable row level security;
alter table breach_notifications enable row level security;

-- User Sessions policies
create policy "Users can view their own sessions" on user_sessions
  for select using (auth.uid() = user_id);

create policy "Users can update their own sessions" on user_sessions
  for update using (auth.uid() = user_id);

-- User Roles policies  
create policy "Users can view their own roles" on user_roles
  for select using (auth.uid() = user_id);

create policy "Admins can manage all roles" on user_roles
  for all using (
    exists (
      select 1 from user_roles ur 
      where ur.user_id = auth.uid() 
      and ur.role in ('ADMIN', 'DATA_PROTECTION_OFFICER') 
      and ur.is_active = true
    )
  );

-- Data Access Permissions policies
create policy "Users can view their own permissions" on data_access_permissions
  for select using (auth.uid() = user_id);

create policy "Admins can manage all permissions" on data_access_permissions
  for all using (
    exists (
      select 1 from user_roles ur 
      where ur.user_id = auth.uid() 
      and ur.role in ('ADMIN', 'DATA_PROTECTION_OFFICER') 
      and ur.is_active = true
    )
  );

-- Security Incidents policies
create policy "Users can view incidents related to them" on security_incidents
  for select using (auth.uid() = user_id);

create policy "Security staff can view all incidents" on security_incidents
  for select using (
    exists (
      select 1 from user_roles ur 
      where ur.user_id = auth.uid() 
      and ur.role in ('ADMIN', 'DATA_PROTECTION_OFFICER', 'AUDITOR') 
      and ur.is_active = true
    )
  );

-- Breach Notifications policies (admin/DPO only)
create policy "DPO can manage breach notifications" on breach_notifications
  for all using (
    exists (
      select 1 from user_roles ur 
      where ur.user_id = auth.uid() 
      and ur.role in ('ADMIN', 'DATA_PROTECTION_OFFICER') 
      and ur.is_active = true
    )
  );

-- Security Functions

-- Function to check user role
create or replace function check_user_role(
  p_user_id uuid,
  p_required_role user_role
) returns boolean as $$
declare
  has_role boolean;
begin
  select exists(
    select 1 from user_roles 
    where user_id = p_user_id 
    and role = p_required_role
    and is_active = true
    and (expires_at is null or expires_at > now())
  ) into has_role;
  
  return has_role;
end;
$$ language plpgsql security definer;

-- Function to check data access permission
create or replace function check_data_access(
  p_user_id uuid,
  p_table_name text,
  p_access_level access_level,
  p_data_category data_category
) returns boolean as $$
declare
  has_permission boolean;
begin
  -- Check if user has specific permission
  select exists(
    select 1 from data_access_permissions 
    where user_id = p_user_id 
    and table_name = p_table_name
    and access_level >= p_access_level
    and data_category = p_data_category
    and is_active = true
    and (expires_at is null or expires_at > now())
  ) into has_permission;
  
  -- If no specific permission, check if user has admin role
  if not has_permission then
    select check_user_role(p_user_id, 'ADMIN') into has_permission;
  end if;
  
  return has_permission;
end;
$$ language plpgsql security definer;

-- Function to log security incident
create or replace function log_security_incident(
  p_incident_type text,
  p_severity text,
  p_user_id uuid default null,
  p_session_id text default null,
  p_description text default '',
  p_details jsonb default null
) returns uuid as $$
declare
  incident_id uuid;
begin
  insert into security_incidents (
    incident_type, severity, user_id, session_id, 
    description, details, ip_address, user_agent
  ) values (
    p_incident_type, p_severity, p_user_id, p_session_id,
    p_description, p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  ) returning id into incident_id;
  
  -- Auto-escalate critical incidents
  if p_severity = 'CRITICAL' then
    -- Log as audit event for immediate attention
    perform log_audit_event(
      p_user_id, 'security_incidents', incident_id, 'CREATE', 'PERSONAL',
      'severity', null, p_severity, 'GDPR compliance', 'Critical security incident'
    );
  end if;
  
  return incident_id;
end;
$$ language plpgsql security definer;

-- Function to clean up expired sessions
create or replace function cleanup_expired_sessions() returns integer as $$
declare
  cleanup_count integer;
begin
  -- Mark expired sessions as inactive
  update user_sessions 
  set is_active = false, updated_at = now()
  where (expires_at < now() or last_activity < now() - interval '8 hours')
  and is_active = true;
  
  get diagnostics cleanup_count = row_count;
  
  -- Log cleanup activity
  if cleanup_count > 0 then
    perform log_audit_event(
      null, 'user_sessions', null, 'DELETE', 'PERSONAL',
      'expired_sessions', null, cleanup_count::text, 
      'Data retention policy', 'Automated session cleanup'
    );
  end if;
  
  return cleanup_count;
end;
$$ language plpgsql security definer;

-- Function to detect suspicious login patterns
create or replace function detect_suspicious_login(
  p_user_id uuid,
  p_ip_address inet,
  p_user_agent text
) returns boolean as $$
declare
  recent_sessions_count integer;
  different_locations_count integer;
  is_suspicious boolean := false;
begin
  -- Check for multiple login attempts from different IPs in short time
  select count(*) into recent_sessions_count
  from user_sessions 
  where user_id = p_user_id 
  and created_at > now() - interval '1 hour'
  and ip_address != p_ip_address;
  
  -- Check for logins from multiple countries in short time
  select count(distinct location_country) into different_locations_count
  from user_sessions 
  where user_id = p_user_id 
  and created_at > now() - interval '6 hours'
  and location_country is not null;
  
  -- Mark as suspicious if conditions met
  if recent_sessions_count > 3 or different_locations_count > 2 then
    is_suspicious := true;
    
    -- Log security incident
    perform log_security_incident(
      'suspicious_login', 'MEDIUM', p_user_id, null,
      format('Suspicious login pattern detected: %s sessions from different IPs, %s different countries', 
             recent_sessions_count, different_locations_count),
      jsonb_build_object(
        'ip_address', p_ip_address,
        'user_agent', p_user_agent,
        'recent_sessions', recent_sessions_count,
        'different_locations', different_locations_count
      )
    );
  end if;
  
  return is_suspicious;
end;
$$ language plpgsql security definer;

-- Enhanced audit trigger with security checks
create or replace function enhanced_audit_trigger_func() returns trigger as $$
declare
  audit_user_id uuid;
  data_cat data_category;
  has_permission boolean;
  incident_id uuid;
begin
  -- Get user ID from auth context
  audit_user_id := auth.uid();
  
  -- Determine data category based on table
  data_cat := case TG_TABLE_NAME
    when 'parents' then 'PERSONAL'
    when 'children' then 'SPECIAL_CHILD'
    when 'employment_records' then 'FINANCIAL'
    when 'documents' then 'DOCUMENT'
    when 'user_consents' then 'PERSONAL'
    else 'PERSONAL'
  end;
  
  -- Check permissions for sensitive operations
  if TG_OP in ('UPDATE', 'DELETE') and audit_user_id is not null then
    select check_data_access(
      audit_user_id, TG_TABLE_NAME, 
      case TG_OP when 'DELETE' then 'DELETE' else 'WRITE' end::access_level,
      data_cat
    ) into has_permission;
    
    if not has_permission then
      -- Log unauthorized access attempt
      select log_security_incident(
        'unauthorized_access', 'HIGH', audit_user_id, null,
        format('Unauthorized %s attempt on %s', TG_OP, TG_TABLE_NAME),
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP, 'data_category', data_cat)
      ) into incident_id;
      
      raise exception 'Unauthorized access: insufficient permissions for % on %', TG_OP, TG_TABLE_NAME;
    end if;
  end if;
  
  -- Standard audit logging
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

-- Replace existing audit triggers with enhanced version
drop trigger if exists audit_parents_trigger on parents;
drop trigger if exists audit_children_trigger on children;
drop trigger if exists audit_employment_trigger on employment_records;
drop trigger if exists audit_documents_trigger on documents;

create trigger enhanced_audit_parents_trigger
  before insert or update or delete on parents
  for each row execute function enhanced_audit_trigger_func();

create trigger enhanced_audit_children_trigger
  before insert or update or delete on children
  for each row execute function enhanced_audit_trigger_func();

create trigger enhanced_audit_employment_trigger
  before insert or update or delete on employment_records
  for each row execute function enhanced_audit_trigger_func();

create trigger enhanced_audit_documents_trigger
  before insert or update or delete on documents
  for each row execute function enhanced_audit_trigger_func();

-- Triggers for maintaining timestamps
create trigger update_user_sessions_updated_at 
  before update on user_sessions 
  for each row execute function update_updated_at_column();

create trigger update_user_roles_updated_at 
  before update on user_roles 
  for each row execute function update_updated_at_column();

create trigger update_data_access_permissions_updated_at 
  before update on data_access_permissions 
  for each row execute function update_updated_at_column();

create trigger update_breach_notifications_updated_at 
  before update on breach_notifications 
  for each row execute function update_updated_at_column();

-- Scheduled jobs for security maintenance
-- Clean up expired sessions daily at 3 AM
select cron.schedule('security-session-cleanup', '0 3 * * *', 'select cleanup_expired_sessions();');

-- Review and escalate unresolved high/critical incidents daily at 9 AM
select cron.schedule('security-incident-review', '0 9 * * *', $$
  insert into audit_logs (table_name, action, data_category, purpose, legal_basis)
  select 'security_incidents', 'READ', 'PERSONAL', 'Security incident review', 'GDPR compliance'
  from security_incidents 
  where resolved = false 
  and severity in ('HIGH', 'CRITICAL') 
  and created_at < now() - interval '1 day'
  group by severity
  having count(*) > 0;
$$);

-- Insert default admin role for first user (will need to be assigned manually)
-- Note: This creates a placeholder - actual admin assignment should be done manually for security

-- Insert default data access permissions structure
insert into data_access_permissions (user_id, table_name, access_level, data_category, legal_basis, purpose, granted_by) 
select 
  u.id,
  t.table_name,
  'READ'::access_level,
  t.data_category,
  'Art. 6.1.a GDPR (Consent)',
  'Standard user data access',
  u.id
from auth.users u, (
  values 
    ('parents', 'PERSONAL'::data_category),
    ('children', 'SPECIAL_CHILD'::data_category),
    ('employment_records', 'FINANCIAL'::data_category),
    ('documents', 'DOCUMENT'::data_category),
    ('user_consents', 'PERSONAL'::data_category)
) as t(table_name, data_category)
where not exists (
  select 1 from data_access_permissions dap 
  where dap.user_id = u.id and dap.table_name = t.table_name
);

-- Insert default user roles (all users get USER role by default)
insert into user_roles (user_id, role, granted_by)
select id, 'USER'::user_role, id
from auth.users
where not exists (
  select 1 from user_roles ur where ur.user_id = auth.users.id
); 