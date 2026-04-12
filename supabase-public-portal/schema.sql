-- ============================================================
-- HYDROGES — Complete Supabase Database Schema
-- All 4 tables used by HYDROGES + the public portal
--
-- Run this ONCE in your Supabase project's SQL Editor.
-- It is safe to re-run (uses CREATE TABLE IF NOT EXISTS).
-- ============================================================


-- ============================================================
-- TABLE 1: users
-- HYDROGES internal staff accounts
-- Access: HYDROGES backend only (service_role key)
--         Public portal has NO access to this table
-- ============================================================
create table if not exists users (
  id               bigserial primary key,
  name             text not null,
  email            text not null unique,
  department       text not null,
  avatar_initials  text not null,
  login_id         text unique,
  password_hash    text,
  password_salt    text,
  company_number   text not null default '0125.6910.0681',
  role             text not null default 'Employé',
  signature_image  text,
  created_at       timestamptz not null default now()
);


-- ============================================================
-- TABLE 2: documents
-- Internal document exchange between HYDROGES staff
-- Access: HYDROGES backend only (service_role key)
--         Public portal has NO access to this table
-- ============================================================
create table if not exists documents (
  id               bigserial primary key,
  title            text not null,
  content          text not null,
  status           text not null default 'draft',
  -- status values: draft | sent | scheduled | outbox | pending | signed
  sender_id        bigint not null references users(id),
  sender_name      text not null,
  recipient_id     bigint not null references users(id),
  recipient_name   text not null,
  recipient_email  text not null,
  scheduled_at     timestamptz,
  signed_at        timestamptz,
  signature_data   text,
  signature_x      real,
  signature_y      real,
  file_type        text not null default 'PDF',
  file_size        text not null default '0 KB',
  category         text not null default 'Général',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);


-- ============================================================
-- TABLE 3: claims
-- Citizen complaints submitted from the public portal
-- Access: Public can INSERT | HYDROGES staff can SELECT + UPDATE
-- ============================================================
create table if not exists claims (
  id               bigserial primary key,
  first_name       text not null,
  last_name        text not null,
  wilaya           text not null,
  commune          text not null,
  complaint        text not null,
  attachment_url   text,
  attachment_name  text,
  status           text not null default 'pending',
  -- status values: pending | reviewed | closed
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);


-- ============================================================
-- TABLE 4: market
-- Project offers submitted from the public portal
-- Access: Public can INSERT | HYDROGES staff can SELECT + UPDATE
-- ============================================================
create table if not exists market (
  id                   bigserial primary key,
  first_name           text not null,
  last_name            text not null,
  email                text not null,
  phone                text not null,
  wilaya               text not null,
  commune              text not null,
  project_title        text not null,
  project_type         text not null,
  project_description  text not null,
  budget               text,
  attachment_url       text,
  attachment_name      text,
  status               text not null default 'pending',
  -- status values: pending | reviewed | accepted | rejected
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);


-- ============================================================
-- AUTO-UPDATE updated_at ON CHANGES
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_updated_at on documents;
create trigger documents_updated_at
  before update on documents
  for each row execute procedure set_updated_at();

drop trigger if exists claims_updated_at on claims;
create trigger claims_updated_at
  before update on claims
  for each row execute procedure set_updated_at();

drop trigger if exists market_updated_at on market;
create trigger market_updated_at
  before update on market
  for each row execute procedure set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table users     enable row level security;
alter table documents enable row level security;
alter table claims    enable row level security;
alter table market    enable row level security;


-- ── users ────────────────────────────────────────────────────
-- Only the HYDROGES backend (service_role) can access this table.
-- The service_role key bypasses RLS entirely — no policies needed.
-- We still enable RLS so that anon / public users get zero access.
-- (No policies = no access for anon or authenticated roles)


-- ── documents ────────────────────────────────────────────────
-- Same as users: internal only, accessed via service_role.
-- No public-facing policies.


-- ── claims ───────────────────────────────────────────────────
-- Public (anon) can submit claims
create policy "Public can submit claims"
  on claims for insert
  to anon
  with check (true);

-- HYDROGES staff (authenticated via service_role) can read all claims
create policy "Staff can read claims"
  on claims for select
  to authenticated
  using (true);

-- HYDROGES staff can update claim status / notes
create policy "Staff can update claims"
  on claims for update
  to authenticated
  using (true);


-- ── market ───────────────────────────────────────────────────
-- Public (anon) can submit project offers
create policy "Public can submit market offers"
  on market for insert
  to anon
  with check (true);

-- HYDROGES staff can read all offers
create policy "Staff can read market offers"
  on market for select
  to authenticated
  using (true);

-- HYDROGES staff can update offer status / notes
create policy "Staff can update market offers"
  on market for update
  to authenticated
  using (true);


-- ============================================================
-- STORAGE BUCKET FOR ATTACHMENTS
-- Run these after creating the bucket in the Supabase Dashboard:
--   Dashboard > Storage > New Bucket > name: "attachments" > Public: ON
-- Then uncomment and run the lines below:
-- ============================================================
--
-- insert into storage.buckets (id, name, public)
-- values ('attachments', 'attachments', true)
-- on conflict (id) do nothing;
--
-- create policy "Public can upload attachments"
--   on storage.objects for insert
--   to anon
--   with check (bucket_id = 'attachments');
--
-- create policy "Public can read attachments"
--   on storage.objects for select
--   to anon
--   using (bucket_id = 'attachments');
--
-- create policy "Staff can delete attachments"
--   on storage.objects for delete
--   to authenticated
--   using (bucket_id = 'attachments');


-- ============================================================
-- SUMMARY OF TABLES
-- ============================================================
--
--  Table       | Who writes         | Who reads/updates
--  ------------|--------------------|---------------------------------
--  users       | HYDROGES backend   | HYDROGES backend (service_role)
--  documents   | HYDROGES backend   | HYDROGES backend (service_role)
--  claims      | Public portal (anon INSERT) | HYDROGES backend (service_role)
--  market      | Public portal (anon INSERT) | HYDROGES backend (service_role)
--
-- Keys to use:
--   HYDROGES backend  → SUPABASE_SERVICE_KEY  (bypasses RLS, full access)
--   Public portal     → SUPABASE_ANON_KEY     (INSERT only on claims + market)
--
-- ============================================================
