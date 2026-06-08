'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SaveButton } from './save-button'
import { ContactSellerModal } from './contact-seller-modal'
import { formatPriceFull } from '@/lib/format'
import type { Property } from '@/types/property'

export function PropertyActions({ property }: { property: Property }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const isRent = property.listing_type === 'rent'

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      try { await navigator.share({ title: property.title, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <>
      {/* Desktop sidebar card */}
      <div className="sticky top-24 hidden rounded-3xl border border-border bg-card p-6 shadow-soft lg:block">
        <p className="text-sm text-muted-foreground">{isRent ? 'Monthly rent' : 'Asking price'}</p>
        <p className="mt-1 font-display text-3xl font-semibold text-primary">
          {formatPriceFull(property.price)}{isRent && <span className="text-base font-normal text-muted-foreground"> /mo</span>}
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 font-display font-semibold text-primary">
            {(property.profiles?.full_name ?? 'S').charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{property.profiles?.full_name ?? 'Private seller'}</p>
            <p className="text-xs capitalize text-muted-foreground">{property.profiles?.verification_level ?? 'member'} seller</p>
          </div>
        </div>

        <Button className="mt-4 w-full" size="lg" onClick={() => setOpen(true)}>Contact seller</Button>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={share}>
            {copied ? <><Check /> Copied</> : <><Share2 /> Share</>}
          </Button>
          <SaveButton id={property.id} variant="inline" />
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 lg:hidden">
        <div className="glass-strong mx-3 flex items-center gap-3 rounded-2xl border border-border p-3 shadow-lift">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground">{isRent ? 'Rent' : 'Price'}</p>
            <p className="truncate font-display text-lg font-semibold text-primary">{formatPriceFull(property.price)}</p>
          </div>
          <SaveButton id={property.id} variant="inline" />
          <Button className="flex-1" onClick={() => setOpen(true)}>Contact</Button>
        </div>
      </div>

      <ContactSellerModal property={property} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
