-- =====================================================================
-- Estata — PHASE 2 SETUP (maps & smart search)
-- Run AFTER schema.sql and supabase-setup.sql, in the Supabase SQL Editor.
-- =====================================================================

-- Speeds up the map's bounding-box queries (browse map + search-as-I-move).
create index if not exists idx_properties_lat_lng
  on public.properties (latitude, longitude)
  where latitude is not null and longitude is not null;

-- =====================================================================
-- END PHASE 2 SETUP
-- =====================================================================
