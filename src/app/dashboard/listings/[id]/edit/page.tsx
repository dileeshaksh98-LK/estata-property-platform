import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getOwnerPropertyById } from '@/lib/db/properties.repo'
import { EditListingClient } from '@/components/dashboard/edit-listing-client'

export const metadata: Metadata = { title: 'Edit listing', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await getOwnerPropertyById(id)
  if (!property) notFound()
  return <EditListingClient property={property} />
}
