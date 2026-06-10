import type { Metadata } from 'next'
import { Mail, MessageCircle, ShieldAlert } from 'lucide-react'
import { PageShell } from '@/components/common/page-shell'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with the ${SITE.name} team — support, feedback, partnerships, or reporting a listing.`,
  alternates: { canonical: '/contact' },
  openGraph: { title: `Contact · ${SITE.name}`, description: 'Support, feedback, partnerships, or reporting a listing.', url: '/contact' },
}

const CHANNELS = [
  { icon: Mail, title: 'General & support', body: 'Questions, account help, or feedback on the product.', detail: 'hello@estata.lk' },
  { icon: ShieldAlert, title: 'Report a listing', body: 'Spotted something suspicious or inaccurate? Include the listing link.', detail: 'report@estata.lk' },
  { icon: MessageCircle, title: 'Partnerships & press', body: 'Agencies, developers, and media inquiries.', detail: 'partners@estata.lk' },
]

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Talk to us"
      intro="We read everything. For questions about a specific property, contact the seller directly from the listing page — for everything else, these channels reach the team."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((c) => (
          <div key={c.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><c.icon className="size-5" /></span>
            <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            <a href={`mailto:${c.detail}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">{c.detail}</a>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Note: these inboxes route to the founding team while the platform is young, so replies are personal but may take a day or two.
      </p>
    </PageShell>
  )
}
