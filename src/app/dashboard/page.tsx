import type { Metadata } from 'next'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { getOwnerProperties } from '@/lib/db/properties.repo'
import { getOwnerInquiries } from '@/lib/db/inquiries.repo'
import { getSellerStats } from '@/lib/db/analytics.repo'
import { getCurrentProfile } from '@/lib/db/profiles.repo'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [stats, listings, leads, profile] = await Promise.all([
    getSellerStats(),
    getOwnerProperties(),
    getOwnerInquiries(),
    getCurrentProfile(),
  ])
  return <DashboardClient stats={stats} listings={listings} leads={leads} profile={profile} />
}
