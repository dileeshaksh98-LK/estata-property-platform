'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import type { GeoSuggestion } from '@/app/api/geo/search/route'
import { Button } from '@/components/ui/button'
import { PROPERTY_TYPES, DISTRICTS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ListingType, PropertyType } from '@/types/property'

export function SearchBar({ variant = 'hero' }: { variant?: 'hero' | 'compact' }) {
  const router = useRouter()
  const [listing, setListing] = useState<ListingType>('sale')
  const [type, setType] = useState<PropertyType | ''>('')
  const [district, setDistrict] = useState('')
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const debounced = useDebounce(q, 350)
  const picked = useRef(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (picked.current) { picked.current = false; return }
    const query = debounced.trim()
    if (query.length < 2) { setSuggestions([]); setOpen(false); return }
    let cancelled = false
    fetch(`/api/geo/search?q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((j) => { if (!cancelled) { setSuggestions(j.results ?? []); setOpen((j.results ?? []).length > 0); setHighlight(-1) } })
      .catch(() => {})
    return () => { cancelled = true }
  }, [debounced])

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function goNear(sug: GeoSuggestion) {
    picked.current = true
    setOpen(false)
    setQ(sug.label)
    const params = new URLSearchParams()
    params.set('listing', listing)
    if (type) params.set('type', type)
    params.set('near', `${sug.lat.toFixed(5)},${sug.lng.toFixed(5)}`)
    params.set('radius', '5')
    params.set('loc', sug.label)
    router.push(`/properties?${params.toString()}`)
  }

  function submit() {
    const params = new URLSearchParams()
    params.set('listing', listing)
    if (type) params.set('type', type)
    if (district) params.set('district', district)
    if (q.trim()) params.set('q', q.trim())
    router.push(`/properties?${params.toString()}`)
  }

  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-card/80 p-2 shadow-lift backdrop-blur-xl',
        variant === 'hero' ? 'glass-strong' : '',
      )}
    >
      {/* Buy / Rent toggle */}
      <div className="mb-2 inline-flex rounded-2xl bg-secondary p-1">
        {(['sale', 'rent'] as ListingType[]).map((l) => (
          <button
            key={l}
            onClick={() => setListing(l)}
            className={cn(
              'rounded-xl px-5 py-1.5 text-sm font-semibold transition-colors',
              listing === l ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground',
            )}
          >
            {l === 'sale' ? 'Buy' : 'Rent'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div ref={boxRef} className="relative flex-1">
          <div className="flex items-center gap-2 rounded-2xl bg-background px-4 md:bg-transparent">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              role="combobox" aria-expanded={open} aria-autocomplete="list" aria-controls="hero-loc-listbox"
              onKeyDown={(e) => {
                if (open && suggestions.length) {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)); return }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); return }
                  if (e.key === 'Enter' && highlight >= 0) { e.preventDefault(); goNear(suggestions[highlight]); return }
                  if (e.key === 'Escape') { setOpen(false); return }
                }
                if (e.key === 'Enter') submit()
              }}
              placeholder="Search by area, city or keyword…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {open && suggestions.length > 0 && (
            <ul id="hero-loc-listbox" role="listbox" className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-lift">
              {suggestions.map((sug, i) => (
                <li key={`${sug.lat}-${sug.lng}-${i}`} role="option" aria-selected={i === highlight}>
                  <button
                    type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => goNear(sug)} onMouseEnter={() => setHighlight(i)}
                    className={cn('flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm', i === highlight && 'bg-secondary')}
                  >
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-1">{sug.label}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">within 5 km</span>
                  </button>
                </li>
              ))}
              <li className="border-t border-border">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setOpen(false); submit() }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-muted-foreground">
                  <Search className="size-4 shrink-0" /> Search listings for “{q.trim()}”
                </button>
              </li>
            </ul>
          )}
        </div>

        <div className="hidden h-8 w-px bg-border md:block" />

        <select
          value={type}
          onChange={(e) => setType(e.target.value as PropertyType)}
          className="h-12 rounded-2xl bg-background px-4 text-sm outline-none md:bg-transparent"
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="h-12 rounded-2xl bg-background px-4 text-sm outline-none md:bg-transparent"
        >
          <option value="">Any district</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <Button size="lg" className="h-12 md:h-12" onClick={submit}>
          <Search className="-ml-1" /> Search
        </Button>
      </div>
    </div>
  )
}
