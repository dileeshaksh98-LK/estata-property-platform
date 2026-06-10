import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Heart, MessageCircle, UploadCloud, BarChart3, BadgeCheck } from 'lucide-react'
import { PageShell, Section } from '@/components/common/page-shell'
import { Button } from '@/components/ui/button'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'How it works',
  description: `How to buy, rent, or sell property on ${SITE.name} — from search to handshake.`,
  alternates: { canonical: '/how-it-works' },
  openGraph: { title: `How it works · ${SITE.name}`, description: 'From search to handshake, in a few simple steps.', url: '/how-it-works' },
}

const BUYER_STEPS = [
  { icon: Search, title: 'Search & filter', body: 'Filter by district, type, price, and bedrooms — or search in plain words. Every listing shows real details and photos.' },
  { icon: Heart, title: 'Save & compare', body: 'Tap the heart to shortlist homes. Your saves sync to your account so they follow you across devices.' },
  { icon: MessageCircle, title: 'Contact the seller', body: 'Message, call, or WhatsApp the seller directly from the listing. No middlemen, no hidden fees.' },
]

const SELLER_STEPS = [
  { icon: UploadCloud, title: 'Post in minutes', body: 'A guided five-step form: details, location, photos with live upload progress, and a preview of your card before publishing. Free.' },
  { icon: BarChart3, title: 'Track interest', body: 'Your dashboard shows views, saves, and leads in real time, with every inquiry collected in one inbox.' },
  { icon: BadgeCheck, title: 'Close with confidence', body: 'Respond to serious buyers fast, mark the listing sold when done, and boost visibility anytime.' },
]

function Steps({ steps }: { steps: typeof BUYER_STEPS }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon className="size-5" /></span>
            <span className="font-display text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
        </li>
      ))}
    </ol>
  )
}

export default function HowItWorksPage() {
  return (
    <PageShell
      eyebrow="How it works"
      title="From search to handshake"
      intro={`${SITE.name} connects buyers and sellers directly. Here's the whole journey — whichever side you're on.`}
    >
      <Section title="For buyers & renters"><Steps steps={BUYER_STEPS} /></Section>
      <Section title="For sellers"><Steps steps={SELLER_STEPS} /></Section>
      <Section title="What it costs">
        <p>
          Browsing, saving, contacting sellers, and posting listings are all <strong className="text-foreground">free</strong>.
          Optional paid boosts that raise a listing's visibility are coming later — they'll always be clearly labelled,
          and boosted listings will never pretend to be organic results.
        </p>
      </Section>
      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href="/properties">Start browsing</Link></Button>
        <Button asChild variant="accent"><Link href="/dashboard/listings/new">Post your property</Link></Button>
      </div>
    </PageShell>
  )
}
