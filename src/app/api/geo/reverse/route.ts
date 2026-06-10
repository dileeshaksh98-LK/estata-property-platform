import { NextResponse } from 'next/server'
import { isInLK, isValidCoord } from '@/lib/geo'
import { allow, cached, clientIp, store, OSM_HEADERS } from '@/lib/server/geo-proxy'

export interface ReverseResult {
  address: string | null
  city: string | null
  district: string | null
}

/** Pin-drop -> address details, proxied through Nominatim with caching. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const lat = Number(sp.get('lat')), lng = Number(sp.get('lng'))
  if (!isValidCoord(lat, lng) || !isInLK(lat, lng)) {
    return NextResponse.json({ error: 'Coordinates outside supported area' }, { status: 400 })
  }
  if (!allow(clientIp(req), 15)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const key = `r:${lat.toFixed(4)},${lng.toFixed(4)}` // ~11m grid — plenty for autofill
  const hit = cached<ReverseResult>(key, 7 * 24 * 60 * 60 * 1000)
  if (hit) return NextResponse.json(hit)

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('zoom', '16')

  try {
    const res = await fetch(url, { headers: OSM_HEADERS, signal: AbortSignal.timeout(6000) })
    if (!res.ok) return NextResponse.json({ address: null, city: null, district: null })
    const json = await res.json()
    const a = json.address ?? {}
    const out: ReverseResult = {
      address: [a.house_number, a.road].filter(Boolean).join(' ') || null,
      city: a.city ?? a.town ?? a.village ?? a.suburb ?? null,
      // Nominatim returns LK districts as "X District" — strip the suffix to match our list
      district: (a.state_district ?? a.county ?? '').replace(/\s*District$/i, '') || null,
    }
    store(key, out)
    return NextResponse.json(out)
  } catch {
    return NextResponse.json({ address: null, city: null, district: null })
  }
}
