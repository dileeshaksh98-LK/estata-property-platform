'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startConversation } from '@/lib/actions/messages'

export function MessageSellerButton({ propertyId, className }: { propertyId: string; className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function start() {
    setLoading(true)
    const res = await startConversation(propertyId)
    setLoading(false)
    if (res.ok) {
      if (res.data) router.push(`/dashboard/messages/${res.data.id}`)
      return
    }
    if (res.error?.toLowerCase().includes('sign in')) {
      router.push(`/auth/login?redirect=/properties`)
    } else if (res.error?.toLowerCase().includes('own listing')) {
      // Owner viewing their own listing — send them to their inbox instead.
      router.push('/dashboard/messages')
    }
  }

  return (
    <Button variant="outline" className={className} disabled={loading} onClick={start}>
      <MessageSquare /> {loading ? 'Opening…' : 'Message on Estata'}
    </Button>
  )
}
