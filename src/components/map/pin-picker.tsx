'use client'

import { useState } from 'react'
import { Marker, useMapEvents, useMap } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'
import { BaseMap, pinIcon } from './map-base'
import { LK_CENTER, isInLK } from '@/lib/geo'
import type { ReverseResult } from '@/app/api/geo/reverse/route'

export interface PinValue { lat: number; lng: number }

function ClickCatcher({ onPick }: { onPick: (p: PinValue) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

function FlyTo({ point }: { point: PinValue | null }) {
  const map = useMap()
  if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 15), { duration: 0.6 })
  return null
}

export default function PinPicker({
  value, onChange, flyTo,
}: {
  value: PinValue | null
  onChange: (p: PinValue, reverse: ReverseResult | null) => void
  /** External point (e.g. from autocomplete) the map should fly to. */
  flyTo?: PinValue | null
}) {
  const [locating, setLocating] = useState(false)

  async function pick(p: PinValue) {
    if (!isInLK(p.lat, p.lng)) return
    let reverse: ReverseResult | null = null
    try {
      const res = await fetch(`/api/geo/reverse?lat=${p.lat}&lng=${p.lng}`)
      if (res.ok) reverse = await res.json()
    } catch { /* autofill is best-effort */ }
    onChange(p, reverse)
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); pick({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="relative h-72 overflow-hidden rounded-3xl border border-border">
      <BaseMap center={value ?? LK_CENTER} zoom={value ? 15 : 8}>
        <ClickCatcher onPick={pick} />
        <FlyTo point={flyTo ?? value} />
        {value && (
          <Marker
            position={[value.lat, value.lng]} icon={pinIcon({ active: true })} draggable keyboard alt="Property location pin"
            eventHandlers={{ dragend: (e) => pick(e.target.getLatLng()) }}
          />
        )}
      </BaseMap>
      <button
        type="button" onClick={useMyLocation}
        className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-xs font-semibold shadow-lift hover:bg-secondary"
        aria-label="Use my current location"
      >
        <LocateFixed className="size-4 text-accent" /> {locating ? 'Locating…' : 'Use my location'}
      </button>
      <p className="absolute bottom-3 left-3 z-[1000] rounded-full bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-soft backdrop-blur">
        {value ? 'Drag the pin to adjust' : 'Tap the map to drop a pin'}
      </p>
    </div>
  )
}
