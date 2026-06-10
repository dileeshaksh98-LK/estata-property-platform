'use client'

import { useEffect, useState } from 'react'
import { MailWarning } from 'lucide-react'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'
import { useToast } from '@/components/providers/toast-provider'

/**
 * Gentle, non-blocking nudge shown only when the signed-in user's email is
 * unconfirmed. With "Confirm email" disabled in Supabase, users are confirmed
 * at signup and this renders nothing — it activates automatically if email
 * confirmation is re-enabled later.
 */
export function EmailVerifyBanner() {
  const [email, setEmail] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!supabaseEnabled) return
    createClient().auth.getUser().then(({ data }) => {
      const u = data.user
      if (u && !u.email_confirmed_at && u.email) setEmail(u.email)
    })
  }, [])

  if (!email) return null

  async function resend() {
    setSending(true)
    const { error } = await createClient().auth.resend({ type: 'signup', email: email! })
    setSending(false)
    if (error) toast({ title: 'Could not send verification email', description: error.message, variant: 'error' })
    else toast({ title: 'Verification email sent', description: `Check ${email} for the confirmation link.`, variant: 'success' })
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
      <MailWarning className="size-5 shrink-0 text-accent" />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium">Your email isn't verified yet.</span>{' '}
        <span className="text-muted-foreground">Verifying helps buyers trust your listings.</span>
      </p>
      <button onClick={resend} disabled={sending} className="text-sm font-semibold text-accent hover:underline disabled:opacity-50">
        {sending ? 'Sending…' : 'Resend email'}
      </button>
    </div>
  )
}
