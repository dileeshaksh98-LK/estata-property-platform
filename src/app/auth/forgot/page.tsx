'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell } from '@/components/auth/auth-shell'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function send(formData: FormData) {
    if (!supabaseEnabled) { setNotice('Authentication is not configured.'); return }
    const email = String(formData.get('email')).trim()
    setLoading(true); setNotice(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    })
    setLoading(false)
    // Always show the sent state — avoids confirming which emails have accounts.
    if (error && !/rate limit/i.test(error.message)) console.error(error.message)
    if (error && /rate limit/i.test(error.message)) { setNotice('Too many attempts — please try again in a few minutes.'); return }
    setSentTo(email)
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      {notice && <p className="mb-4 rounded-2xl bg-secondary p-3 text-sm">{notice}</p>}
      {sentTo ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-secondary p-4 text-sm">
            <p className="font-medium">Check your inbox ✉️</p>
            <p className="mt-1 text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, a password-reset
              link is on its way. Open it <span className="font-medium text-foreground">on this device</span>.
            </p>
          </div>
          <Button variant="outline" className="h-12 w-full" disabled={loading}
            onClick={() => { const fd = new FormData(); fd.set('email', sentTo); send(fd) }}>
            {loading ? 'Sending…' : 'Resend email'}
          </Button>
          <Link href="/auth/login" className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form action={send} className="space-y-3">
          <Input name="email" type="email" placeholder="Email address" autoComplete="email" required className="h-12" />
          <Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? 'Sending…' : 'Email me a reset link'}</Button>
          <Link href="/auth/login" className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  )
}
