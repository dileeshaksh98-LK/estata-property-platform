import { NextResponse } from 'next/server'
import { LK_BOUNDS, LK_CENTER } from '@/lib/geo'
import { allow, cached, clientIp, store, OSM_HEADERS } from '@/lib/server/geo-proxy'

export interface GeoSuggestion {
  label: string
  city: string | null
  district: string | null
  lat: number
  lng: number
}

/** Location autocomplete proxied through Photon (OSM), biased to Sri Lanka. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ results: [] })
  if (!allow(clientIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const key = `s:${q.toLowerCase()}`
  const hit = cached<GeoSuggestion[]>(key, 24 * 60 * 60 * 1000)
  if (hit) return NextResponse.json({ results: hit })

  const url = new URL('https://photon.komoot.io/api')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lang', 'en')
  url.searchParams.set('lat', String(LK_CENTER.lat))
  url.searchParams.set('lon', String(LK_CENTER.lng))
  url.searchParams.set('bbox', `${LK_BOUNDS.minLng},${LK_BOUNDS.minLat},${LK_BOUNDS.maxLng},${LK_BOUNDS.maxLat}`)

  try {
    const res = await fetch(url, { headers: OSM_HEADERS, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return NextResponse.json({ results: [] })
    const json = await res.json()
    const results: GeoSuggestion[] = (json.features ?? [])
      .map((f: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }) => {
        const p = f.properties
        const name = p.name ?? p.street ?? p.city ?? ''
        const parts = [name, p.city && p.city !== name ? p.city : null, p.state].filter(Boolean)
        return {
          label: parts.join(', '),
          city: p.city ?? p.name ?? null,
          district: p.county ?? p.state ?? null,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }
      })
      .filter((r: GeoSuggestion) => r.label)
    store(key, results)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
