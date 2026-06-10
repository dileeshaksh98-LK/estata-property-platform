'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Hospital, ShoppingBag, Train } from 'lucide-react'
import type { NearbyPlace } from '@/app/api/geo/nearby/route'

const META = {
  school: { icon: GraduationCap, label: 'School' },
  hospital: { icon: Hospital, label: 'Health' },
  supermarket: { icon: ShoppingBag, label: 'Shopping' },
  transport: { icon: Train, label: 'Transport' },
} as const

function fmt(m: number) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m` }

/** Real nearby amenities from OpenStreetMap. Renders nothing when unavailable. */
export function NearbyPlaces({ lat, lng }: { lat: number; lng: number }) {
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/geo/nearby?lat=${lat}&lng=${lng}`)
      .then((r) => (r.ok ? r.json() : { places: [] }))
      .then((j) => { if (!cancelled) setPlaces(j.places ?? []) })
      .catch(() => { if (!cancelled) setPlaces([]) })
    return () => { cancelled = true }
  }, [lat, lng])

  if (!places || places.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold">What’s nearby</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {places.map((p, i) => {
          const m = META[p.category]
          return (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <m.icon className="size-5 text-primary" />
              <p className="mt-2 line-clamp-1 text-sm font-medium" title={p.name}>{p.name}</p>
              <p className="text-xs text-muted-foreground">{m.label} · {fmt(p.distanceM)}</p>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Distances are straight-line, from OpenStreetMap data.</p>
    </section>
  )
}
