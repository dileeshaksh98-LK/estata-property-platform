'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { ReactNode } from 'react'
import { LK_CENTER } from '@/lib/geo'

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Styled div-icon pin (avoids Leaflet's bundler-broken default marker images). */
export function pinIcon(opts?: { active?: boolean }) {
  return L.divIcon({
    className: '',
    html: `<div class="estata-pin${opts?.active ? ' estata-pin--active' : ''}"></div>`,
    iconSize: [26, 36],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  })
}

export function priceIcon(label: string, active = false) {
  return L.divIcon({
    className: '',
    html: `<div class="estata-price-pin${active ? ' estata-price-pin--active' : ''}">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [30, 16],
    popupAnchor: [0, -14],
  })
}

export function clusterIcon(count: number) {
  const size = count >= 50 ? 46 : count >= 10 ? 40 : 34
  return L.divIcon({
    className: '',
    html: `<div class="estata-cluster" style="width:${size}px;height:${size}px">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function BaseMap({
  center = LK_CENTER, zoom = 13, className, children, scrollWheelZoom = true,
}: { center?: { lat: number; lng: number }; zoom?: number; className?: string; children?: ReactNode; scrollWheelZoom?: boolean }) {
  return (
    <MapContainer
      center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={scrollWheelZoom}
      className={className} style={{ height: '100%', width: '100%' }}
      attributionControl
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {children}
    </MapContainer>
  )
}
