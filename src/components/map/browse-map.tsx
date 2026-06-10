'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Supercluster from 'supercluster'
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { BaseMap, clusterIcon, priceIcon } from './map-base'
import { bboxToString, LK_CENTER } from '@/lib/geo'
import { formatPrice } from '@/lib/format'
import type { MapMarkerData } from '@/types/property'

const FIT_LK = { center: LK_CENTER, zoom: 8 }

function Clusters({ markers }: { markers: MapMarkerData[] }) {
  const map = useMap()
  const [, force] = useState(0)
  useMapEvents({ moveend: () => force((n) => n + 1), zoomend: () => force((n) => n + 1) })

  const index = useMemo(() => {
    const sc = new Supercluster<{ m: MapMarkerData }, { m?: MapMarkerData }>({ radius: 64, maxZoom: 17 })
    sc.load(markers.map((m) => ({
      type: 'Feature' as const,
      properties: { m },
      geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
    })))
    return sc
  }, [markers])

  const b = map.getBounds()
  const clusters = index.getClusters(
    [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
    Math.round(map.getZoom()),
  )

  return (
    <>
      {clusters.map((c) => {
        const [lng, lat] = c.geometry.coordinates
        const props = c.properties as { cluster?: boolean; point_count?: number; cluster_id?: number; m?: MapMarkerData }
        if (props.cluster) {
          const count = props.point_count ?? 0
          const id = props.cluster_id ?? 0
          return (
            <Marker
              key={`c-${id}`} position={[lat, lng]} icon={clusterIcon(count)} keyboard alt={`${count} properties — zoom in`}
              eventHandlers={{ click: () => map.flyTo([lat, lng], Math.min(index.getClusterExpansionZoom(id), 17), { duration: 0.5 }) }}
            />
          )
        }
        const m = props.m!
        return (
          <Marker key={m.id} position={[lat, lng]} icon={priceIcon(formatPrice(m.price), false)} keyboard alt={m.title}>
            <Popup minWidth={200}>
              <Link href={`/properties/${m.slug}`} className="block">
                {m.cover && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={m.cover} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />
                )}
                <p className="line-clamp-2 text-sm font-semibold">{m.title}</p>
                <p className="mt-0.5 text-sm text-emerald-800">{formatPrice(m.price)}</p>
              </Link>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

function MoveSync({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useMapEvents({
    moveend(e) {
      if (!enabled) return
      if (timer.current) clearTimeout(timer.current)
      const map = e.target
      timer.current = setTimeout(() => {
        const b = map.getBounds()
        const next = new URLSearchParams(params.toString())
        next.set('bbox', bboxToString({ minLng: b.getWest(), minLat: b.getSouth(), maxLng: b.getEast(), maxLat: b.getNorth() }))
        next.set('view', 'map')
        next.delete('page')
        router.replace(`/properties?${next.toString()}`, { scroll: false })
      }, 450)
    },
  })
  return null
}

export default function BrowseMap({ markers }: { markers: MapMarkerData[] }) {
  const [syncOn, setSyncOn] = useState(true)

  const center = useCallback(() => {
    if (!markers.length) return FIT_LK
    const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length
    const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length
    return { center: { lat, lng }, zoom: 12 }
  }, [markers])()

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border">
      <BaseMap center={center.center} zoom={center.zoom}>
        <Clusters markers={markers} />
        <MoveSync enabled={syncOn} />
      </BaseMap>
      <label className="absolute left-3 top-3 z-[1000] flex cursor-pointer items-center gap-2 rounded-full bg-card px-3.5 py-2 text-xs font-semibold shadow-lift">
        <input type="checkbox" checked={syncOn} onChange={(e) => setSyncOn(e.target.checked)} className="size-3.5 accent-current" />
        Search as I move the map
      </label>
      {markers.length === 0 && (
        <p className="absolute inset-x-0 bottom-4 z-[1000] mx-auto w-fit rounded-full bg-card/95 px-4 py-2 text-xs text-muted-foreground shadow-soft">
          No mapped listings in this area — listings without a pin still appear in the list
        </p>
      )}
    </div>
  )
}
