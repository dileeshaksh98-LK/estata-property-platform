'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
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
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-background px-4 md:bg-transparent">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Search by area, city or keyword…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
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
