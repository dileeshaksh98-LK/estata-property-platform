import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell, Section } from '@/components/common/page-shell'
import { Button } from '@/components/ui/button'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Careers',
  description: `Interested in building the future of Sri Lankan real estate? Learn about working with ${SITE.name}.`,
  alternates: { canonical: '/careers' },
  openGraph: { title: `Careers · ${SITE.name}`, description: 'Help build the future of Sri Lankan real estate.', url: '/careers' },
}

export default function CareersPage() {
  return (
    <PageShell
      eyebrow="Careers"
      title="Build the future of Sri Lankan real estate"
      intro={`${SITE.name} is in its early days — which means small team, big surface area, and work that ships to real users the same week.`}
    >
      <Section title="Open roles">
        <p>
          We don't have open positions right now. As the platform grows we expect to need engineers,
          designers, and people who deeply understand the Sri Lankan property market.
        </p>
      </Section>
      <Section title="Think you'd be a fit anyway?">
        <p>
          Strong early-stage teams are built from people who reach out before a job ad exists. If our mission
          resonates, introduce yourself — tell us what you'd want to own and show us something you've built.
        </p>
      </Section>
      <Button asChild><Link href="/contact">Introduce yourself</Link></Button>
    </PageShell>
  )
}
