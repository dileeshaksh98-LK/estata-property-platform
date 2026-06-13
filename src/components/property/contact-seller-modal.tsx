'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, MessageCircle, Phone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendInquiry } from '@/lib/actions/inquiries'
import { whatsappLink } from '@/lib/format'
import type { Property } from '@/types/property'

export function ContactSellerModal({
  property, open, onClose,
}: { property: Property; open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const openedAt = useRef<number>(0)

  const seller = property.profiles
  // Per-listing contact (set when posting on a seller's behalf) takes priority;
  // otherwise fall back to the poster's profile number.
  const phone = (property.contact_phone?.trim() || seller?.phone?.trim()) || null
  const wa = whatsappLink(property.contact_whatsapp || property.contact_phone || seller?.whatsapp || seller?.phone)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) openedAt.current = Date.now()
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleSubmit(formData: FormData) {
    setError(null)
    const name = String(formData.get('name') || '').trim()
    const message = String(formData.get('message') || '').trim()
    if (name.length < 2) return setError('Please enter your name.')
    if (message.length < 8) return setError('Please write a slightly longer message.')
    // Anti-spam: submissions faster than 2s after opening are almost certainly bots.
    if (Date.now() - openedAt.current < 2000) return setError('Please take a moment before sending.')

    startTransition(async () => {
      const res = await sendInquiry({
        property_id: property.id,
        name,
        email: String(formData.get('email') || ''),
        phone: String(formData.get('phone') || ''),
        message,
        company: String(formData.get('company') || ''), // honeypot
      })
      if (res.ok) setSent(true)
      else setError(res.error)
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0.5, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-md rounded-t-4xl border border-border bg-card p-6 shadow-lift sm:rounded-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full hover:bg-secondary"><X className="size-5" /></button>

            {sent ? (
              <div className="py-8 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Check className="size-8" /></div>
                <h3 className="mt-5 font-display text-xl font-semibold">Message sent</h3>
                <p className="mt-2 text-sm text-muted-foreground">{seller?.full_name ?? 'The seller'} will get back to you soon.</p>
                <Button className="mt-6 w-full" onClick={onClose}>Done</Button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl font-semibold">Contact {seller?.full_name ?? 'seller'}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">About: {property.title}</p>

                {(phone || wa) && (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {phone && <Button asChild variant="outline"><a href={`tel:${phone}`}><Phone /> Call</a></Button>}
                      {wa && (
                        <Button asChild variant="outline" className="text-[#25D366]">
                          <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a>
                        </Button>
                      )}
                    </div>
                    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="h-px flex-1 bg-border" /> or send a message <span className="h-px flex-1 bg-border" />
                    </div>
                  </>
                )}
                {!phone && !wa && <div className="mt-4" />}

                <form action={handleSubmit} className="space-y-3">
                  <Input name="name" placeholder="Your name" required />
                  <div className="grid grid-cols-2 gap-3">
                    <Input name="phone" type="tel" placeholder="Phone" />
                    <Input name="email" type="email" placeholder="Email" />
                  </div>
                  <textarea
                    name="message" rows={3}
                    defaultValue={`Hi, I'm interested in "${property.title}". Is it still available?`}
                    className="w-full rounded-xl border border-input bg-card p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {/* Honeypot — visually hidden, ignored by humans */}
                  <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Sending…' : 'Send message'}</Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
