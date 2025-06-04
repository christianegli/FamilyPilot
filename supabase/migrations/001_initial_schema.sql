-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Custom types
create type employment_type as enum ('ANGESTELLT', 'SELBSTSTAENDIG', 'ARBEITSLOS', 'BEAMTER', 'SONSTIGES');
create type document_type as enum ('GEHALTSNACHWEIS','GEBURTSURKUNDE','MIETVERTRAG','KRANKENKASSENBESCHEINIGUNG','SONSTIGES');
create type event_type as enum ('SUBMITTED', 'RECEIPT', 'ERROR', 'STATUS_CHANGE');
create type benefit_type as enum ('KITA', 'ELTERNGELD', 'ELTERNGELD_PLUS');

-- Parents table
create table parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  geburtsdatum date not null,
  staatsangehoerigkeit text default 'deutsch',
  strasse text,
  hausnummer text,
  plz text,
  ort text default 'Hamburg',
  email text,
  telefon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint valid_plz check (plz ~ '^\d{5}$')
);

-- Children table
create table children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  vorname text not null,
  nachname text not null,
  geburtsdatum date not null,
  geburtsort text default 'Hamburg',
  geburtsurkunde_file_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Employment records
create table employment_records (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  arbeitgeber text,
  beschaeftigung_typ employment_type not null default 'ANGESTELLT',
  start_datum date,
  end_datum date,
  netto_monat_einkommen numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_parent_id uuid references parents(id) on delete cascade,
  type document_type,
  file_name text not null,
  mime_type text not null,
  file_size bigint,
  storage_path text not null,
  extracted_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Events table for tracking submissions
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references parents(id) on delete cascade,
  type event_type not null,
  benefit benefit_type not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- Hamburg Jugendämter routing table
create table amtsbezirke (
  plz text primary key,
  amt_name text not null,
  street text not null,
  zip_city text not null,
  email text,
  fax text,
  accepts_email boolean default false,
  accepts_demail boolean default false,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_parents_user_id on parents(user_id);
create index if not exists idx_children_parent_id on children(parent_id);
create index if not exists idx_empl_parent_id on employment_records(parent_id);
create index if not exists idx_docs_owner on documents(owner_parent_id);
create index if not exists idx_events_user_id on events(user_id);
create index if not exists idx_events_parent_id on events(parent_id);

-- RLS (Row Level Security) policies
alter table parents enable row level security;
alter table children enable row level security;
alter table employment_records enable row level security;
alter table documents enable row level security;
alter table events enable row level security;

-- Parents policies
create policy "Users can only see their own parent records" on parents
  for all using (auth.uid() = user_id);

-- Children policies  
create policy "Users can only see children of their parent records" on children
  for all using (
    exists (
      select 1 from parents 
      where parents.id = children.parent_id 
      and parents.user_id = auth.uid()
    )
  );

-- Employment records policies
create policy "Users can only see employment records of their parent records" on employment_records
  for all using (
    exists (
      select 1 from parents 
      where parents.id = employment_records.parent_id 
      and parents.user_id = auth.uid()
    )
  );

-- Documents policies
create policy "Users can only see documents of their parent records" on documents
  for all using (
    exists (
      select 1 from parents 
      where parents.id = documents.owner_parent_id 
      and parents.user_id = auth.uid()
    )
  );

-- Events policies
create policy "Users can only see their own events" on events
  for all using (auth.uid() = user_id);

-- Public read access for amtsbezirke (routing table)
create policy "Anyone can read amtsbezirke" on amtsbezirke
  for select using (true); 