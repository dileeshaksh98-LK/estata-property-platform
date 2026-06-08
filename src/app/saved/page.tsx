'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useSavedProperties } from '@/hooks/use-saved-properties'
import { createClient } from '@/lib/supabase/client'
import { PropertyCard } from '@/components/property/property-card'
import { PropertyGridSkeleton } from '@/components/property/property-card-skeleton'
import { EmptyState } from '@/components/common/empty-state'
import type { Property } from '@/types/property'

export default function SavedPage() {
  const { ids, ready, count } = useSavedProperties()
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    const idList = [...ids]
    if (idList.length === 0) { setItems([]); setLoading(false); return }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('*, property_images(id, url, is_primary, sort_order)')
        .in('id', idList)
        .eq('status', 'active')
      if (!cancelled) {
        setItems((data ?? []) as unknown as Property[])
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [ids, ready])

  return (
    <div className="container pt-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent"><Heart className="size-6" /></span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Saved properties</h1>
          <p className="text-muted-foreground">{count} {count === 1 ? 'home' : 'homes'} saved</p>
        </div>
      </header>

      {!ready || loading ? (
        <PropertyGridSkeleton count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved properties yet"
          description="Tap the heart on any listing to keep it here. Saves sync to your account once you sign in."
          action={{ label: 'Browse properties', href: '/properties' }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  )
}
