-- =====================================================================
-- Estata — BACKEND SETUP (run AFTER schema.sql)
-- Adds the storage bucket + policies and the RPCs the app calls.
-- Run in: Supabase Dashboard → SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. STORAGE BUCKET for property images
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

-- Public read; authenticated upload; owners delete their own objects.
-- (Supabase sets storage.objects.owner = auth.uid() on authenticated upload.)
drop policy if exists "Public read property images" on storage.objects;
create policy "Public read property images"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "Authenticated upload property images" on storage.objects;
create policy "Authenticated upload property images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images');

drop policy if exists "Owners update their objects" on storage.objects;
create policy "Owners update their objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and owner = auth.uid());

drop policy if exists "Owners delete their objects" on storage.objects;
create policy "Owners delete their objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and owner = auth.uid());

-- ---------------------------------------------------------------------
-- 2. Atomic contact-count increment (called when a lead is submitted).
--    Security definer so a non-owner inquirer can bump the counter
--    without holding update rights on the row.
-- ---------------------------------------------------------------------
create or replace function public.increment_contact_count(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.properties set contact_count = contact_count + 1 where id = p_id;
$$;

grant execute on function public.increment_contact_count(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Seller dashboard stats for the signed-in user.
--    Security definer so saved/lead counts across the owner's listings
--    are accurate even though RLS hides other users' saves.
-- ---------------------------------------------------------------------
create or replace function public.get_seller_stats()
returns table (
  total_views     int,
  total_saved     int,
  total_leads     int,
  active_listings int
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce((select sum(view_count) from public.properties where owner_id = auth.uid()), 0)::int,
    (select count(*) from public.saved_properties s
       join public.properties p on p.id = s.property_id
      where p.owner_id = auth.uid())::int,
    (select count(*) from public.property_inquiries i
       join public.properties p on p.id = i.property_id
      where p.owner_id = auth.uid())::int,
    (select count(*) from public.properties
      where owner_id = auth.uid() and status = 'active')::int;
$$;

grant execute on function public.get_seller_stats() to authenticated;

-- =====================================================================
-- END BACKEND SETUP
-- =====================================================================
