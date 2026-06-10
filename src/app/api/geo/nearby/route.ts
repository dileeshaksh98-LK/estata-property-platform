import { NextResponse } from 'next/server'
import { isInLK, isValidCoord } from '@/lib/geo'
import { allow, cached, clientIp, store, OSM_HEADERS } from '@/lib/server/geo-proxy'

export interface NearbyPlace { category: 'school' | 'hospital' | 'supermarket' | 'transport'; name: string; distanceM: number }

const RADIUS = 2500 // metres

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Real nearby schools/hospitals/supermarkets/transport from OpenStreetMap. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const lat = Number(sp.get('lat')), lng = Number(sp.get('lng'))
  if (!isValidCoord(lat, lng) || !isInLK(lat, lng)) return NextResponse.json({ places: [] })
  if (!allow(clientIp(req), 10)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const key = `n:${lat.toFixed(3)},${lng.toFixed(3)}` // ~110m grid: shared cache for the area
  const hit = cached<NearbyPlace[]>(key, 7 * 24 * 60 * 60 * 1000)
  if (hit) return NextResponse.json({ places: hit })

  const query = `[out:json][timeout:8];(
    node(around:${RADIUS},${lat},${lng})[amenity=school];
    node(around:${RADIUS},${lat},${lng})[amenity~"hospital|clinic"];
    node(around:${RADIUS},${lat},${lng})[shop~"supermarket|convenience"];
    node(around:${RADIUS},${lat},${lng})[railway=station];
    node(around:${RADIUS},${lat},${lng})[highway=bus_stop][name];
  );out body 60;`

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { ...OSM_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) return NextResponse.json({ places: [] })
    const json = await res.json()

    const places: NearbyPlace[] = []
    for (const el of json.elements ?? []) {
      const name = el.tags?.name
      if (!name || typeof el.lat !== 'number') continue
      const t = el.tags
      const category: NearbyPlace['category'] | null =
        t.amenity === 'school' ? 'school'
        : t.amenity === 'hospital' || t.amenity === 'clinic' ? 'hospital'
        : t.shop ? 'supermarket'
        : t.railway === 'station' || t.highway === 'bus_stop' ? 'transport'
        : null
      if (!category) continue
      places.push({ category, name, distanceM: Math.round(haversine(lat, lng, el.lat, el.lon)) })
    }

    // Closest of each category first, max 2 per category
    places.sort((a, b) => a.distanceM - b.distanceM)
    const byCat = new Map<string, number>()
    const trimmed = places.filter((p) => {
      const c = byCat.get(p.category) ?? 0
      if (c >= 2) return false
      byCat.set(p.category, c + 1)
      return true
    })

    store(key, trimmed)
    return NextResponse.json({ places: trimmed })
  } catch {
    return NextResponse.json({ places: [] })
  }
}
