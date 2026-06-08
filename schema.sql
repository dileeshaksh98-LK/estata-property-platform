-- =====================================================================
-- Sri Lankan Property Platform — PHASE 1 FOUNDATION SCHEMA
-- Target: Supabase (PostgreSQL 15+)
-- Run in: Supabase Dashboard → SQL Editor (or as a migration)
-- =====================================================================

-- ----------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- fuzzy / trigram text search
-- Phase 2 (radius search & maps) will add: create extension postgis;

-- ----------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------
create type user_role          as enum ('user', 'seller', 'agent', 'admin');
create type property_type       as enum ('land', 'house', 'apartment', 'commercial');
create type listing_type        as enum ('sale', 'rent');
create type listing_status      as enum ('draft', 'pending', 'active', 'sold', 'rented', 'expired');
create type verification_level  as enum ('none', 'email', 'verified', 'premium');
create type land_size_unit      as enum ('perch', 'acre', 'sqft');

-- ======================================================================
-- 1. PROFILES  (extends auth.users)
-- ======================================================================
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  avatar_url         text,
  phone              text,
  whatsapp           text,
  role               user_role          not null default 'user',
  verification_level verification_level not null default 'none',
  bio                text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing user profile, 1:1 with auth.users.';

-- ======================================================================
-- 2. DISTRICTS  (reference data for filters; Sri Lanka has 25 districts)
-- ======================================================================
create table public.districts (
  id        serial primary key,
  name      text not null unique,
  province  text not null
);

insert into public.districts (name, province) values
  ('Colombo','Western'),('Gampaha','Western'),('Kalutara','Western'),
  ('Kandy','Central'),('Matale','Central'),('Nuwara Eliya','Central'),
  ('Galle','Southern'),('Matara','Southern'),('Hambantota','Southern'),
  ('Jaffna','Northern'),('Kilinochchi','Northern'),('Mannar','Northern'),
  ('Vavuniya','Northern'),('Mullaitivu','Northern'),
  ('Batticaloa','Eastern'),('Ampara','Eastern'),('Trincomalee','Eastern'),
  ('Kurunegala','North Western'),('Puttalam','North Western'),
  ('Anuradhapura','North Central'),('Polonnaruwa','North Central'),
  ('Badulla','Uva'),('Monaragala','Uva'),
  ('Ratnapura','Sabaragamuwa'),('Kegalle','Sabaragamuwa');

-- ======================================================================
-- 3. PROPERTIES
-- ======================================================================
create table public.properties (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,

  -- core
  title           text not null,
  slug            text not null unique,
  description     text,
  property_type   property_type  not null,
  listing_type    listing_type   not null,
  status          listing_status not null default 'draft',

  -- pricing (LKR is the base currency)
  price           numeric(14,2) not null,
  price_per_unit  boolean not null default false,  -- e.g. price per perch
  currency        text not null default 'LKR',

  -- location
  address         text,
  city            text,
  district        text,        -- denormalised for fast filtering
  province        text,
  postal_code     text,
  latitude        double precision,
  longitude       double precision,

  -- attributes
  land_size       numeric(10,2),
  land_size_unit  land_size_unit default 'perch',
  building_sqft   numeric(10,2),
  bedrooms        smallint,
  bathrooms       smallint,
  parking         smallint,
  year_built      smallint,

  -- engagement & monetisation (revenue hooks used heavily in Phase 8)
  is_featured     boolean not null default false,
  featured_until  timestamptz,
  view_count      integer not null default 0,
  contact_count   integer not null default 0,

  -- search
  search_vector   tsvector,

  -- audit
  published_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes ---------------------------------------------------------------
create index idx_properties_status        on public.properties (status);
create index idx_properties_filter        on public.properties (status, property_type, listing_type);
create index idx_properties_district      on public.properties (district);
create index idx_properties_city          on public.properties (city);
create index idx_properties_price         on public.properties (price);
create index idx_properties_owner         on public.properties (owner_id);
create index idx_properties_featured      on public.properties (is_featured, featured_until);
create index idx_properties_created       on public.properties (created_at desc);
create index idx_properties_geo           on public.properties (latitude, longitude);
create index idx_properties_search        on public.properties using gin (search_vector);
create index idx_properties_title_trgm    on public.properties using gin (title gin_trgm_ops);

-- ======================================================================
-- 4. PROPERTY IMAGES
-- ======================================================================
create table public.property_images (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  url          text not null,
  storage_path text,                 -- path in Supabase Storage for deletion
  is_primary   boolean not null default false,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now()
);
create index idx_property_images_property on public.property_images (property_id, sort_order);

-- ======================================================================
-- 5. SAVED PROPERTIES (favourites)
-- ======================================================================
create table public.saved_properties (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, property_id)
);
create index idx_saved_user on public.saved_properties (user_id);

-- ======================================================================
-- 6. PROPERTY INQUIRIES (contact-seller leads)
-- ======================================================================
create table public.property_inquiries (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  sender_id    uuid references public.profiles(id) on delete set null,  -- null = guest
  name         text not null,
  email        text,
  phone        text,
  message      text not null,
  created_at   timestamptz not null default now()
);
create index idx_inquiries_property on public.property_inquiries (property_id);
create index idx_inquiries_sender   on public.property_inquiries (sender_id);

-- ======================================================================
-- TRIGGERS & FUNCTIONS
-- ======================================================================

-- 7a. Auto-create a profile row when a new auth user signs up ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7b. Keep updated_at fresh --------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_properties_updated
  before update on public.properties
  for each row execute function public.set_updated_at();

-- 7c. Maintain the full-text search vector -----------------------------
create or replace function public.properties_search_vector()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.city,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.district,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.description,'')), 'C');
  return new;
end;
$$;

create trigger trg_properties_search
  before insert or update on public.properties
  for each row execute function public.properties_search_vector();

-- 7d. Atomic view-count increment (call via RPC from the app) ----------
create or replace function public.increment_view_count(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.properties set view_count = view_count + 1 where id = p_id;
$$;

-- ======================================================================
-- ROW LEVEL SECURITY
-- ======================================================================
alter table public.profiles           enable row level security;
alter table public.properties         enable row level security;
alter table public.property_images    enable row level security;
alter table public.saved_properties   enable row level security;
alter table public.property_inquiries enable row level security;

-- PROFILES -------------------------------------------------------------
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- PROPERTIES -----------------------------------------------------------
create policy "Active listings are public"
  on public.properties for select
  using (status = 'active' or auth.uid() = owner_id);

create policy "Owners can insert their listings"
  on public.properties for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their listings"
  on public.properties for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their listings"
  on public.properties for delete
  using (auth.uid() = owner_id);

-- PROPERTY IMAGES ------------------------------------------------------
create policy "Images of visible listings are public"
  on public.property_images for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.status = 'active' or p.owner_id = auth.uid())
    )
  );

create policy "Owners manage their listing images"
  on public.property_images for all
  using (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  );

-- SAVED PROPERTIES -----------------------------------------------------
create policy "Users manage their own saves"
  on public.saved_properties for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- PROPERTY INQUIRIES ---------------------------------------------------
create policy "Anyone can send an inquiry"
  on public.property_inquiries for insert
  with check (true);

create policy "Listing owner or sender can read inquiries"
  on public.property_inquiries for select
  using (
    sender_id = auth.uid()
    or exists (select 1 from public.properties p
               where p.id = property_id and p.owner_id = auth.uid())
  );

-- ======================================================================
-- STORAGE  (run after creating a public bucket named 'property-images')
-- Dashboard → Storage → New bucket → name: property-images, Public: ON
-- ======================================================================
-- Allow authenticated users to upload, and anyone to read:
--
-- create policy "Public read property images"
--   on storage.objects for select
--   using (bucket_id = 'property-images');
--
-- create policy "Authenticated upload property images"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'property-images');
--
-- create policy "Owners delete their objects"
--   on storage.objects for delete to authenticated
--   using (bucket_id = 'property-images' and owner = auth.uid());
-- ======================================================================
-- END PHASE 1 SCHEMA
-- ======================================================================
