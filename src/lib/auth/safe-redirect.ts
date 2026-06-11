/**
 * Open-redirect protection: only same-origin paths are allowed as post-auth
 * destinations. Anything absolute ("https://evil.site"), protocol-relative
 * ("//evil.site"), or malformed falls back to a safe internal route.
 */
export function safeInternalPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback
  let v = raw.trim()
  try { v = decodeURIComponent(v) } catch { return fallback }
  if (!v.startsWith('/')) return fallback
  if (v.startsWith('//') || v.includes('://') || v.includes('\\') || v.includes('\n') || v.includes('\r')) return fallback
  return v
}
