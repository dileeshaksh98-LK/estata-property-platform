'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PROPERTY_TYPES, DISTRICTS, SORT_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ListingType, PropertyType } from '@/types/property'

const PRICE_STEPS = [0, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000]
const fmt = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n === 0 ? 'Any' : `${n / 1000}K`)

function FilterControls({ onApply }: { onApply?: () => void }) {
  const router = useRouter()
  const params = useSearchParams()

  const set = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString())
    value ? next.set(key, value) : next.delete(key)
    next.delete('page')
    router.push(`/properties?${next.toString()}`)
    onApply?.()
  }

  const current = (k: string) => params.get(k) ?? ''

  return (
    <div className="space-y-7">
      <FilterGroup label="Listing">
        <div className="inline-flex w-full rounded-2xl bg-secondary p-1">
          {([['', 'All'], ['sale', 'Buy'], ['rent', 'Rent']] as [string, string][]).map(([v, l]) => (
            <button
              key={l}
              onClick={() => set('listing', v as ListingType)}
              className={cn(
                'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                current('listing') === v ? 'bg-card shadow-soft' : 'text-muted-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Property type">
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map((t) => {
            const active = current('type') === t.value
            return (
              <button
                key={t.value}
                onClick={() => set('type', active ? undefined : t.value)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary',
                )}
              >
                <t.icon className="size-4" /> {t.label}
              </button>
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup label="District">
        <select
          value={current('district')}
          onChange={(e) => set('district', e.target.value || undefined)}
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        >
          <option value="">All districts</option>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </FilterGroup>

      <FilterGroup label="Price range (LKR)">
        <div className="flex items-center gap-2">
          <select value={current('minPrice')} onChange={(e) => set('minPrice', e.target.value || undefined)} className="h-11 flex-1 rounded-xl border border-input bg-card px-3 text-sm">
            {PRICE_STEPS.map((p) => <option key={p} value={p || ''}>{`Min ${fmt(p)}`}</option>)}
          </select>
          <span className="text-muted-foreground">–</span>
          <select value={current('maxPrice')} onChange={(e) => set('maxPrice', e.target.value || undefined)} className="h-11 flex-1 rounded-xl border border-input bg-card px-3 text-sm">
            <option value="">Max Any</option>
            {PRICE_STEPS.slice(1).map((p) => <option key={p} value={p}>{`Max ${fmt(p)}`}</option>)}
          </select>
        </div>
      </FilterGroup>

      <FilterGroup label="Bedrooms">
        <div className="flex gap-2">
          {['1', '2', '3', '4', '5'].map((b) => {
            const active = current('beds') === b
            return (
              <button
                key={b}
                onClick={() => set('beds', active ? undefined : b)}
                className={cn(
                  'h-11 flex-1 rounded-xl border text-sm font-medium transition-colors',
                  active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary',
                )}
              >
                {b}+
              </button>
            )
          })}
        </div>
      </FilterGroup>

      <Button variant="ghost" className="w-full" onClick={() => { router.push('/properties'); onApply?.() }}>
        Clear all filters
      </Button>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold">{label}</p>
      {children}
    </div>
  )
}

/* Desktop sidebar */
export function FilterSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-semibold">
          <SlidersHorizontal className="size-4" /> Filters
        </h2>
        <FilterControls />
      </div>
    </aside>
  )
}

/* Mobile drawer trigger + sheet */
export function FilterDrawer() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" /> Filters
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-4xl border-t border-border bg-card p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Filters</h2>
                <button onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-secondary">
                  <X className="size-5" />
                </button>
              </div>
              <FilterControls onApply={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function SortSelect() {
  const router = useRouter()
  const params = useSearchParams()
  return (
    <select
      value={params.get('sort') ?? 'newest'}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString())
        next.set('sort', e.target.value)
        router.push(`/properties?${next.toString()}`)
      }}
      className="h-9 rounded-full border border-border bg-card px-4 text-sm font-medium"
      aria-label="Sort listings"
    >
      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
