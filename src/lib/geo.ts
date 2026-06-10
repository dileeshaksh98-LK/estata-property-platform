/** Geo helpers shared by map components and API routes. */

export interface GeoPoint { lat: number; lng: number }
export interface BBox { minLng: number; minLat: number; maxLng: number; maxLat: number }

/** Rough bounding box of Sri Lanka — used to bias/validate geocoding. */
export const LK_BOUNDS: BBox = { minLng: 79.4, minLat: 5.7, maxLng: 82.1, maxLat: 10.1 }
export const LK_CENTER: GeoPoint = { lat: 7.8731, lng: 80.7718 }

export function isInLK(lat: number, lng: number): boolean {
  return lat >= LK_BOUNDS.minLat - 0.5 && lat <= LK_BOUNDS.maxLat + 0.5 &&
         lng >= LK_BOUNDS.minLng - 0.5 && lng <= LK_BOUNDS.maxLng + 0.5
}

export function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return typeof lat === 'number' && typeof lng === 'number' &&
         Number.isFinite(lat) && Number.isFinite(lng) &&
         Math.abs(lat) <= 90 && Math.abs(lng as number) <= 180
}

/** "minLng,minLat,maxLng,maxLat" <-> BBox (URL param format). */
export function parseBBox(raw: string | undefined | null): BBox | null {
  if (!raw) return null
  const parts = raw.split(',').map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null
  const [minLng, minLat, maxLng, maxLat] = parts
  if (minLat >= maxLat || minLng >= maxLng) return null
  return { minLng, minLat, maxLng, maxLat }
}
export function bboxToString(b: BBox): string {
  const r = (n: number) => Math.round(n * 1e5) / 1e5
  return `${r(b.minLng)},${r(b.minLat)},${r(b.maxLng)},${r(b.maxLat)}`
}
