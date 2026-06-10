'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import type { GeoSuggestion } from '@/app/api/geo/search/route'

export function LocationAutocomplete({
  placeholder = 'Search a town or area…', onSelect, initialValue = '',
}: { placeholder?: string; onSelect: (s: GeoSuggestion) => void; initialValue?: string }) {
  const [value, setValue] = useState(initialValue)
  const [results, setResults] = useState<GeoSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const debounced = useDebounce(value, 350)
  const picked = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (picked.current) { picked.current = false; return }
    const q = debounced.trim()
    if (q.length < 2) { setResults([]); setOpen(false); return }
    let cancelled = false
    setLoading(true)
    fetch(`/api/geo/search?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((j) => { if (!cancelled) { setResults(j.results ?? []); setOpen(true); setHighlight(-1) } })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debounced])

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function choose(s: GeoSuggestion) {
    picked.current = true
    setValue(s.label)
    setOpen(false)
    onSelect(s)
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
          className="pl-9" role="combobox" aria-expanded={open} aria-autocomplete="list" aria-controls="loc-listbox"
          onKeyDown={(e) => {
            if (!open || !results.length) return
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)) }
            else if (e.key === 'Enter' && highlight >= 0) { e.preventDefault(); choose(results[highlight]) }
            else if (e.key === 'Escape') setOpen(false)
          }}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <ul id="loc-listbox" role="listbox" className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lng}-${i}`} role="option" aria-selected={i === highlight}>
              <button
                type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(r)} onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm ${i === highlight ? 'bg-secondary' : ''}`}
              >
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-1">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
