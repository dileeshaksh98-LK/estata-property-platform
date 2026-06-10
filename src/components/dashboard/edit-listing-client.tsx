'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import {
  AlertCircle, ArrowLeft, ArrowUp, Check, ImagePlus, Loader2, Star, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { editProperty } from '@/lib/actions/properties'
import { uploadPropertyImage, validateImage } from '@/lib/storage/upload'
import { useToast } from '@/components/providers/toast-provider'
import { PinPickerLoader } from '@/components/map/pin-picker-loader'
import { LocationAutocomplete } from '@/components/search/location-autocomplete'
import { PROPERTY_TYPES, DISTRICTS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ListingType, Property, PropertyType } from '@/types/property'

interface EditImage {
  key: string            // local list key
  id?: string            // present = existing DB row
  url: string
  storage_path?: string | null
  status: 'done' | 'uploading' | 'error'
  progress: number
  error?: string
}

const STATUSES = [
  { value: 'active', label: 'Active', hint: 'Visible to buyers' },
  { value: 'sold', label: 'Sold', hint: 'Hidden from search' },
  { value: 'rented', label: 'Rented', hint: 'Hidden from search' },
  { value: 'draft', label: 'Draft', hint: 'Only you can see it' },
] as const

export function EditListingClient({ property }: { property: Property }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const [f, setF] = useState({
    title: property.title,
    description: property.description ?? '',
    property_type: property.property_type as PropertyType,
    listing_type: property.listing_type as ListingType,
    price: String(property.price),
    district: property.district ?? '',
    city: property.city ?? '',
    address: property.address ?? '',
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : '',
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : '',
    parking: property.parking != null ? String(property.parking) : '',
    land_size: property.land_size != null ? String(property.land_size) : '',
    year_built: property.year_built != null ? String(property.year_built) : '',
    status: property.status as 'active' | 'sold' | 'rented' | 'draft',
    latitude: property.latitude,
    longitude: property.longitude,
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  const [images, setImages] = useState<EditImage[]>(
    (property.property_images ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((i) => ({ key: i.id, id: i.id, url: i.url, storage_path: i.storage_path, status: 'done' as const, progress: 100 })),
  )
  const patchImage = (key: string, patch: Partial<EditImage>) =>
    setImages((arr) => arr.map((im) => (im.key === key ? { ...im, ...patch } : im)))
  const uploading = images.some((i) => i.status === 'uploading')
  const doneImages = images.filter((i) => i.status === 'done')

  function addFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => {
      const err = validateImage(file)
      const key = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      if (err) { setImages((a) => [...a, { key, url: preview, status: 'error', progress: 0, error: err }]); return }
      setImages((a) => [...a, { key, url: preview, status: 'uploading', progress: 0 }])
      uploadPropertyImage(file, (p) => patchImage(key, { progress: p }))
        .then((res) => patchImage(key, { status: 'done', progress: 100, url: res.url, storage_path: res.storage_path }))
        .catch((e: Error) => patchImage(key, { status: 'error', error: e.message }))
    })
  }

  const remove = (key: string) => setImages((a) => a.filter((i) => i.key !== key))
  const makeCover = (key: string) => setImages((a) => {
    const target = a.find((i) => i.key === key)
    return target ? [target, ...a.filter((i) => i.key !== key)] : a
  })
  const moveUp = (key: string) => setImages((a) => {
    const idx = a.findIndex((i) => i.key === key)
    if (idx <= 0) return a
    const next = a.slice(); [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    return next
  })

  function save() {
    if (uploading) { toast({ title: 'Please wait for uploads to finish', variant: 'info' }); return }
    if (doneImages.length === 0) { toast({ title: 'Keep at least one photo', variant: 'error' }); return }
    startTransition(async () => {
      const res = await editProperty({
        id: property.id,
        title: f.title,
        description: f.description,
        property_type: f.property_type,
        listing_type: f.listing_type,
        price: Number(f.price),
        district: f.district,
        city: f.city,
        address: f.address,
        latitude: f.latitude,
        longitude: f.longitude,
        land_size: f.land_size ? Number(f.land_size) : null,
        bedrooms: f.bedrooms ? Number(f.bedrooms) : null,
        bathrooms: f.bathrooms ? Number(f.bathrooms) : null,
        parking: f.parking ? Number(f.parking) : null,
        year_built: f.year_built ? Number(f.year_built) : null,
        status: f.status,
        images: doneImages.map((im) => ({ id: im.id, url: im.url, storage_path: im.storage_path ?? null })),
      })
      if (res.ok) {
        toast({ title: 'Listing updated', variant: 'success' })
        router.push('/dashboard')
        router.refresh()
      } else {
        toast({ title: 'Could not save changes', description: res.error, variant: 'error' })
      }
    })
  }

  const showRooms = f.property_type === 'house' || f.property_type === 'apartment'

  return (
    <div className="container max-w-3xl pt-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">Edit listing</h1>
      <p className="mt-1 line-clamp-1 text-muted-foreground">{property.title}</p>

      <div className="mt-8 space-y-8 rounded-4xl border border-border bg-card p-6 shadow-soft md:p-8">
        {/* Status */}
        <Group label="Listing status">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUSES.map((s) => (
              <button key={s.value} type="button" onClick={() => set('status', s.value)}
                className={cn('rounded-xl border px-3 py-3 text-left text-sm transition-colors', f.status === s.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary')}>
                <span className="font-semibold">{s.label}</span>
                <span className="block text-xs text-muted-foreground">{s.hint}</span>
              </button>
            ))}
          </div>
        </Group>

        {/* Basics */}
        <Group label="Property type">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROPERTY_TYPES.map((t) => (
              <button key={t.value} type="button" onClick={() => set('property_type', t.value)}
                className={cn('flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors', f.property_type === t.value ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary')}>
                <t.icon className="size-5" /> {t.label}
              </button>
            ))}
          </div>
        </Group>
        <div className="grid gap-4 sm:grid-cols-2">
          <Group label="Listing type">
            <div className="inline-flex w-full rounded-2xl bg-secondary p-1">
              {(['sale', 'rent'] as ListingType[]).map((l) => (
                <button key={l} type="button" onClick={() => set('listing_type', l)}
                  className={cn('flex-1 rounded-xl px-6 py-2 text-sm font-semibold transition-colors', f.listing_type === l ? 'bg-card shadow-soft' : 'text-muted-foreground')}>
                  {l === 'sale' ? 'For Sale' : 'For Rent'}
                </button>
              ))}
            </div>
          </Group>
          <Group label={`Price (LKR)${f.listing_type === 'rent' ? ' / month' : ''}`}>
            <Input type="number" value={f.price} onChange={(e) => set('price', e.target.value)} />
          </Group>
        </div>
        <Group label="Title"><Input value={f.title} onChange={(e) => set('title', e.target.value)} /></Group>
        <Group label="Description">
          <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={4}
            className="w-full rounded-xl border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </Group>

        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Group label="District">
            <select value={f.district} onChange={(e) => set('district', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm">
              <option value="">Select district</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Group>
          <Group label="City / Area"><Input value={f.city} onChange={(e) => set('city', e.target.value)} /></Group>
        </div>
        <Group label="Address (optional)"><Input value={f.address} onChange={(e) => set('address', e.target.value)} /></Group>
        <Group label="Find your area">
          <LocationAutocomplete onSelect={(s) => {
            set('latitude', s.lat); set('longitude', s.lng)
            if (s.city && !f.city) set('city', s.city)
            if (s.district) set('district', s.district)
          }} />
        </Group>
        <Group label="Pin the exact location">
          <PinPickerLoader
            value={f.latitude != null && f.longitude != null ? { lat: f.latitude, lng: f.longitude } : null}
            onChange={(p, rev) => {
              set('latitude', p.lat); set('longitude', p.lng)
              if (rev) {
                if (rev.city && !f.city) set('city', rev.city)
                if (rev.district) set('district', rev.district)
              }
            }}
          />
        </Group>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {showRooms && <>
            <Group label="Bedrooms"><Input type="number" value={f.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} /></Group>
            <Group label="Bathrooms"><Input type="number" value={f.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} /></Group>
          </>}
          <Group label="Parking"><Input type="number" value={f.parking} onChange={(e) => set('parking', e.target.value)} /></Group>
          <Group label="Land (perch)"><Input type="number" value={f.land_size} onChange={(e) => set('land_size', e.target.value)} /></Group>
        </div>

        {/* Photos */}
        <Group label="Photos">
          <p className="mb-3 text-xs text-muted-foreground">First photo is the cover. Use ★ to make a photo the cover, ↑ to reorder.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <div key={img.key} className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
                <Image src={img.url} alt="" fill sizes="120px" className={cn('object-cover', img.status !== 'done' && 'opacity-60')} unoptimized={img.url.startsWith('blob:')} />
                {i === 0 && img.status === 'done' && <Badge variant="featured" className="absolute left-1.5 top-1.5">Cover</Badge>}
                {img.status === 'uploading' && (
                  <div className="absolute inset-0 grid place-items-center bg-black/30">
                    <div className="w-3/4">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/40"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${img.progress}%` }} /></div>
                    </div>
                  </div>
                )}
                {img.status === 'error' && (
                  <div className="absolute inset-0 grid place-items-center bg-destructive/80 p-2 text-center text-[10px] text-white"><span><AlertCircle className="mx-auto mb-1 size-4" />{img.error}</span></div>
                )}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    {i > 0 && img.status === 'done' && (
                      <>
                        <button type="button" onClick={() => makeCover(img.key)} aria-label="Make cover photo" className="grid size-7 place-items-center rounded-full bg-black/60 text-white"><Star className="size-3.5" /></button>
                        <button type="button" onClick={() => moveUp(img.key)} aria-label="Move photo earlier" className="grid size-7 place-items-center rounded-full bg-black/60 text-white"><ArrowUp className="size-3.5" /></button>
                      </>
                    )}
                  </div>
                  <button type="button" onClick={() => remove(img.key)} aria-label="Remove photo" className="grid size-7 place-items-center rounded-full bg-black/60 text-white"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => inputRef.current?.click()} className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:bg-secondary/50" aria-label="Add photos">
              <ImagePlus className="size-6" />
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        </Group>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" asChild><Link href="/dashboard">Cancel</Link></Button>
          <Button variant="accent" onClick={save} disabled={pending || uploading}>
            {pending ? <><Loader2 className="animate-spin" /> Saving…</> : <>Save changes <Check /></>}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-2 text-sm font-semibold">{label}</p>{children}</div>
}
