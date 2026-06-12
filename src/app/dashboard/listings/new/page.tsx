'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, UploadCloud, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PropertyCard } from '@/components/property/property-card'
import { createProperty } from '@/lib/actions/properties'
import { uploadPropertyImage, validateImage } from '@/lib/storage/upload'
import { PinPickerLoader } from '@/components/map/pin-picker-loader'
import { LocationAutocomplete } from '@/components/search/location-autocomplete'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'
import { PROPERTY_TYPES, DISTRICTS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ListingType, Property, PropertyType } from '@/types/property'

const STEPS = ['Basics', 'Location', 'Details', 'Photos', 'Review'] as const
const AMENITIES = ['Air conditioning', 'Parking', 'Garden', 'Swimming pool', 'Solar power', 'Security', 'Furnished', 'Gym', 'Water supply', 'Backup generator', 'CCTV', 'Balcony']

interface ImageItem {
  id: string
  preview: string
  progress: number
  status: 'uploading' | 'done' | 'error'
  url?: string
  storage_path?: string
  error?: string
}

interface FormState {
  property_type: PropertyType
  listing_type: ListingType
  title: string
  description: string
  district: string
  city: string
  address: string
  price: string
  negotiable: boolean
  bedrooms: string
  bathrooms: string
  parking: string
  land_size: string
  amenities: string[]
  images: ImageItem[]
  latitude: number | null
  longitude: number | null
  contact_phone: string
  contact_whatsapp: string
}

const initial: FormState = {
  property_type: 'house', listing_type: 'sale', title: '', description: '',
  district: '', city: '', address: '', price: '', negotiable: false, bedrooms: '', bathrooms: '',
  parking: '', land_size: '', amenities: [], images: [],
  latitude: null, longitude: null, contact_phone: '', contact_whatsapp: '',
}

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initial)

  // Pre-fill contact details from the seller profile
  useEffect(() => {
    if (!supabaseEnabled) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: prof } = await supabase.from('profiles').select('phone, whatsapp').eq('id', data.user.id).maybeSingle()
      if (prof) setForm((f) => ({ ...f, contact_phone: f.contact_phone || prof.phone || '', contact_whatsapp: f.contact_whatsapp || prof.whatsapp || '' }))
    })
  }, [])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const patchImage = (id: string, patch: Partial<ImageItem>) =>
    setForm((f) => ({ ...f, images: f.images.map((im) => (im.id === id ? { ...im, ...patch } : im)) }))

  const uploading = form.images.some((i) => i.status === 'uploading')
  const doneImages = form.images.filter((i) => i.status === 'done' && i.url)

  function validate(): boolean {
    setError(null)
    if (step === 0 && form.title.trim().length < 6) { setError('Give your listing a descriptive title (at least 6 characters).'); return false }
    if (step === 1 && !form.district) { setError('Please choose a district.'); return false }
    if (step === 2 && (!form.price || Number(form.price) <= 0)) { setError('Please enter a valid price.'); return false }
    if (step === 3) {
      if (uploading) { setError('Please wait for uploads to finish.'); return false }
      if (doneImages.length === 0) { setError('Add at least one photo.'); return false }
    }
    return true
  }
  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, STEPS.length - 1)) }
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const validationError = validateImage(file)
      const id = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      if (validationError) {
        setForm((f) => ({ ...f, images: [...f.images, { id, preview, progress: 0, status: 'error', error: validationError }] }))
        return
      }
      setForm((f) => ({ ...f, images: [...f.images, { id, preview, progress: 0, status: 'uploading' }] }))
      uploadPropertyImage(file, (p) => patchImage(id, { progress: p }))
        .then((res) => patchImage(id, { status: 'done', progress: 100, url: res.url, storage_path: res.storage_path }))
        .catch((err: Error) => patchImage(id, { status: 'error', error: err.message }))
    })
  }, [])

  function publish() {
    if (!validate()) return
    setError(null)
    startTransition(async () => {
      const res = await createProperty({
        title: form.title,
        description: form.description,
        property_type: form.property_type,
        listing_type: form.listing_type,
        price: Number(form.price),
        negotiable: form.negotiable,
        amenities: form.amenities,
        district: form.district,
        city: form.city,
        address: form.address,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        parking: form.parking ? Number(form.parking) : null,
        land_size: form.land_size ? Number(form.land_size) : null,
        latitude: form.latitude,
        longitude: form.longitude,
        contact_phone: form.contact_phone,
        contact_whatsapp: form.contact_whatsapp,
        status: 'active',
        images: doneImages.map((im, i) => ({ url: im.url!, storage_path: im.storage_path, is_primary: i === 0, sort_order: i })),
      })
      if (res.ok) {
        if (res.data) router.push(`/properties/${res.data.slug}`)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="container max-w-3xl pt-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Post your property</h1>
      <p className="mt-1 text-muted-foreground">Listing is free. Add boosts later to reach more buyers.</p>

      <ol className="mt-7 flex items-center">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span className={cn('grid size-9 place-items-center rounded-full text-sm font-semibold transition-colors', i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-secondary text-muted-foreground')}>
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn('text-[11px] font-medium', i === step ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className={cn('mx-2 h-0.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-border')} />}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-4xl border border-border bg-card p-6 shadow-soft md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            {step === 0 && <Basics form={form} set={set} />}
            {step === 1 && <Location form={form} set={set} />}
            {step === 2 && <Details form={form} set={set} />}
            {step === 3 && <Photos form={form} addFiles={addFiles} onRemove={(id) => set('images', form.images.filter((x) => x.id !== id))} />}
            {step === 4 && <Review form={form} doneImages={doneImages} />}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0 || pending}><ArrowLeft /> Back</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={uploading && step === 3}>Continue <ArrowRight /></Button>
          ) : (
            <Button variant="accent" onClick={publish} disabled={pending}>
              {pending ? <><Loader2 className="animate-spin" /> Publishing…</> : <>Publish listing <Check /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

type StepProps = { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }

function Basics({ form, set }: StepProps) {
  return (
    <div className="space-y-6">
      <Group label="What are you listing?">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PROPERTY_TYPES.map((t) => (
            <Choice key={t.value} active={form.property_type === t.value} onClick={() => set('property_type', t.value)}><t.icon className="size-5" /> {t.label}</Choice>
          ))}
        </div>
      </Group>
      <Group label="Listing type">
        <div className="inline-flex w-full rounded-2xl bg-secondary p-1 sm:w-auto">
          {(['sale', 'rent'] as ListingType[]).map((l) => (
            <button key={l} onClick={() => set('listing_type', l)} className={cn('flex-1 rounded-xl px-6 py-2 text-sm font-semibold transition-colors sm:flex-none', form.listing_type === l ? 'bg-card shadow-soft' : 'text-muted-foreground')}>{l === 'sale' ? 'For Sale' : 'For Rent'}</button>
          ))}
        </div>
      </Group>
      <Group label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Modern 3-bedroom house in Nugegoda" /></Group>
      <Group label="Description">
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Describe the property, its condition, and what makes it special…" className="w-full rounded-xl border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </Group>
    </div>
  )
}

function Location({ form, set }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Group label="District">
          <select value={form.district} onChange={(e) => set('district', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm">
            <option value="">Select district</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Group>
        <Group label="City / Area"><Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Nugegoda" /></Group>
      </div>
      <Group label="Address (optional)"><Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" /></Group>
      <Group label="Find your area">
        <LocationAutocomplete
          placeholder="Search a town, area, or landmark…"
          onSelect={(s) => {
            set('latitude', s.lat); set('longitude', s.lng)
            if (s.city && !form.city) set('city', s.city)
            if (s.district) set('district', s.district)
          }}
        />
      </Group>
      <Group label="Pin the exact location">
        <PinPickerLoader
          value={form.latitude != null && form.longitude != null ? { lat: form.latitude, lng: form.longitude } : null}
          onChange={(p, rev) => {
            set('latitude', p.lat); set('longitude', p.lng)
            if (rev) {
              if (rev.city && !form.city) set('city', rev.city)
              if (rev.district) set('district', rev.district)
              if (rev.address && !form.address) set('address', rev.address)
            }
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">Optional but recommended — pinned listings appear on the map and show nearby schools and amenities.</p>
      </Group>
    </div>
  )
}

function Details({ form, set }: StepProps) {
  const toggleAmenity = (a: string) => set('amenities', form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a])
  const showRooms = form.property_type === 'house' || form.property_type === 'apartment'
  return (
    <div className="space-y-6">
      <Group label={`Price (LKR)${form.listing_type === 'rent' ? ' / month' : ''}`}>
        <Input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="e.g. 45000000" />
        <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.negotiable}
            onChange={(e) => set('negotiable', e.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          Price is negotiable
        </label>
      </Group>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {showRooms && <>
          <Group label="Bedrooms"><Input type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} placeholder="0" /></Group>
          <Group label="Bathrooms"><Input type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} placeholder="0" /></Group>
        </>}
        <Group label="Parking"><Input type="number" value={form.parking} onChange={(e) => set('parking', e.target.value)} placeholder="0" /></Group>
        <Group label="Land (perch)"><Input type="number" value={form.land_size} onChange={(e) => set('land_size', e.target.value)} placeholder="0" /></Group>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Group label="Contact phone"><Input type="tel" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="07X XXX XXXX" /></Group>
        <Group label="WhatsApp (optional)"><Input type="tel" value={form.contact_whatsapp} onChange={(e) => set('contact_whatsapp', e.target.value)} placeholder="Same as phone if empty" /></Group>
      </div>
      <Group label="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const active = form.amenities.includes(a)
            return <button key={a} onClick={() => toggleAmenity(a)} className={cn('rounded-full border px-3.5 py-1.5 text-sm transition-colors', active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary')}>{active && <Check className="mr-1 inline size-3.5" />}{a}</button>
          })}
        </div>
      </Group>
    </div>
  )
}

function Photos({ form, addFiles, onRemove }: { form: FormState; addFiles: (f: FileList | null) => void; onRemove: (id: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={cn('flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-colors', drag ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50')}
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><UploadCloud className="size-7" /></span>
        <p className="mt-4 font-medium">Drag &amp; drop photos here</p>
        <p className="text-sm text-muted-foreground">or click to browse · JPG, PNG, WebP up to 10MB each</p>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      {form.images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {form.images.map((img, i) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
              <Image src={img.preview} alt="" fill sizes="120px" className={cn('object-cover transition-opacity', img.status !== 'done' && 'opacity-60')} />
              {i === 0 && img.status === 'done' && <Badge variant="featured" className="absolute left-1.5 top-1.5">Cover</Badge>}

              {img.status === 'uploading' && (
                <div className="absolute inset-0 grid place-items-center bg-black/30">
                  <div className="w-3/4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/40">
                      <div className="h-full rounded-full bg-white transition-all" style={{ width: `${img.progress}%` }} />
                    </div>
                    <p className="mt-1 text-center text-[10px] font-medium text-white">{img.progress}%</p>
                  </div>
                </div>
              )}
              {img.status === 'done' && (
                <span className="absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span>
              )}
              {img.status === 'error' && (
                <div className="absolute inset-0 grid place-items-center bg-destructive/80 p-2 text-center text-[10px] text-white"><span><AlertCircle className="mx-auto mb-1 size-4" />{img.error}</span></div>
              )}

              <button onClick={() => onRemove(img.id)} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="Remove"><X className="size-4" /></button>
            </div>
          ))}
          <button onClick={() => inputRef.current?.click()} className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:bg-secondary/50"><ImagePlus className="size-6" /></button>
        </div>
      )}
    </div>
  )
}

function Review({ form, doneImages }: { form: FormState; doneImages: ImageItem[] }) {
  const preview: Property = {
    id: 'preview', owner_id: 'me', slug: '#', title: form.title || 'Your listing title',
    description: form.description, property_type: form.property_type, listing_type: form.listing_type,
    status: 'draft', price: Number(form.price) || 0, price_per_unit: false, negotiable: form.negotiable, amenities: form.amenities, currency: 'LKR',
    address: form.address, city: form.city || 'Your city', district: form.district || 'District', province: null,
    latitude: null, longitude: null, land_size: Number(form.land_size) || null, land_size_unit: 'perch',
    building_sqft: null, bedrooms: Number(form.bedrooms) || null, bathrooms: Number(form.bathrooms) || null,
    parking: Number(form.parking) || null, year_built: null, is_featured: false, view_count: 0, contact_count: 0,
    created_at: new Date().toISOString(),
    property_images: doneImages.map((im, i) => ({ id: im.id, url: im.url!, is_primary: i === 0, sort_order: i })),
  }
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Here’s how your listing will appear in search results:</p>
      <div className="mx-auto max-w-sm"><PropertyCard property={preview} /></div>
      {form.amenities.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Amenities</p>
          <div className="flex flex-wrap gap-2">{form.amenities.map((a) => <Badge key={a}>{a}</Badge>)}</div>
        </div>
      )}
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-2 text-sm font-semibold">{label}</p>{children}</div>
}
function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn('flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors', active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary')}>{children}</button>
}
