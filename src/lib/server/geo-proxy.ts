import 'server-only'

/**
 * In-memory cache + per-IP throttle for geocoding proxies. Serverless note:
 * each instance has its own memory, so this is best-effort protection that
 * keeps us a polite citizen of the free OSM services — not a hard guarantee.
 */
const cache = new Map<string, { at: number; data: unknown }>()
const hits = new Map<string, { count: number; windowStart: number }>()

export function cached<T>(key: string, ttlMs: number): T | null {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T
  return null
}
export function store(key: string, data: unknown) {
  if (cache.size > 500) cache.delete(cache.keys().next().value!)
  cache.set(key, { at: Date.now(), data })
}

/** true = allowed; false = over limit (default 30 req / minute / IP). */
export function allow(ip: string, limit = 30): boolean {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.windowStart > 60_000) { hits.set(ip, { count: 1, windowStart: now }); return true }
  h.count += 1
  return h.count <= limit
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export const OSM_HEADERS = {
  'User-Agent': 'Estata-Property-Platform/1.0 (https://estata-property-platform.vercel.app)',
  'Accept': 'application/json',
}
