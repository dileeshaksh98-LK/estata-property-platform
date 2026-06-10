import type { Metadata } from 'next'
import { PageShell, Section } from '@/components/common/page-shell'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms that govern your use of ${SITE.name}.`,
  alternates: { canonical: '/terms' },
  openGraph: { title: `Terms of Service · ${SITE.name}`, url: '/terms' },
}

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of Service"
      intro={`These terms govern your use of ${SITE.name}. By creating an account or posting a listing, you agree to them. Last updated: June 2026.`}
    >
      <Section title="What we are (and aren't)">
        <p>{SITE.name} is a venue that connects property buyers, renters, and sellers. We are <strong className="text-foreground">not</strong> a party to any transaction, we don't hold funds, and we don't act as a broker, agent, or legal adviser. All negotiations, payments, viewings, and agreements happen directly between users.</p>
      </Section>
      <Section title="Your account">
        <p>You're responsible for the accuracy of your account details and for keeping your sign-in method secure. You must be at least 18 to use the platform. We may suspend accounts that violate these terms or applicable law.</p>
      </Section>
      <Section title="Listing rules">
        <p>You may only list property you own or are legally authorised to offer. Listings must be accurate — real photos of the actual property, truthful pricing, and a genuine location. Prohibited: duplicate listings, misleading details, properties you have no right to sell or rent, and any unlawful content. We may edit, hide, or remove listings that break these rules, and repeat violations may lead to account suspension.</p>
      </Section>
      <Section title="Buyer responsibilities">
        <p>Do your own due diligence. Verify ownership, inspect documents (deeds, approvals, survey plans), visit the property in person, and engage a licensed lawyer or surveyor before paying anything. Never transfer money to someone you haven't verified.</p>
      </Section>
      <Section title="Fees">
        <p>Posting and browsing are free today. If we introduce paid features (such as listing boosts), pricing will be shown clearly before you commit, and paid placement will always be labelled.</p>
      </Section>
      <Section title="Liability">
        <p>The platform is provided "as is." To the maximum extent permitted by Sri Lankan law, {SITE.name} is not liable for the conduct of users, the accuracy of listings, or losses arising from transactions between users. Nothing in these terms excludes liability that cannot lawfully be excluded.</p>
      </Section>
      <Section title="Disputes & governing law">
        <p>These terms are governed by the laws of Sri Lanka. Disputes between users should be resolved between the parties; disputes with {SITE.name} should first be raised with us at <a className="text-primary hover:underline" href="mailto:hello@estata.lk">hello@estata.lk</a>.</p>
      </Section>
      <Section title="Changes">
        <p>We may update these terms as the platform evolves. Material changes will be reflected in the date above; continued use after changes means acceptance.</p>
      </Section>
    </PageShell>
  )
}
