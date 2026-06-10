'use client'

import { Marker, Popup } from 'react-leaflet'
import { BaseMap, pinIcon } from './map-base'

export default function DetailMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  return (
    <div className="h-72 overflow-hidden rounded-3xl border border-border" role="img" aria-label={`Map showing the location of ${title}`}>
      <BaseMap center={{ lat, lng }} zoom={15} scrollWheelZoom={false}>
        <Marker position={[lat, lng]} icon={pinIcon({ active: true })} keyboard alt={title}>
          <Popup>{title}</Popup>
        </Marker>
      </BaseMap>
    </div>
  )
}
