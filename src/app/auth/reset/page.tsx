'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell } from '@/components/auth/auth-shell'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'
import { useToast } from '@/components/providers/toast-provider'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // The reset email routes through /auth/callback, which creates a recovery
  // session before landing here. No session means the link expired or was
  // opened in a different browser.
  useEffect(() => {
    if (!supabaseEnabled) { setHasSession(false); return }
    createClient().auth.getSession().then(({ data }) => setHasSession(!!data.session))
  }, [])

  async function save(formData: FormData) {
    if (!supabaseEnabled) return
    const password = String(formData.get('password'))
    const confirm = String(formData.get('confirm'))
    if (password.length < 8) return setNotice('Password must be at least 8 characters.')
    if (password !== confirm) return setNotice('Passwords do not match.')
    setLoading(true); setNotice(null)
    const { error } = await createClient().auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setNotice(
        /same password|different from the old/i.test(error.message)
          ? 'New password must be different from your old one.'
          : error.message,
      )
      return
    }
    toast({ title: 'Password updated', description: "You're signed in.", variant: 'success' })
    router.push('/dashboard'); router.refresh()
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Almost done — set a new password for your account.">
      {hasSession === false ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-secondary p-4 text-sm">
            <p className="font-medium">This link has expired</p>
            <p className="mt-1 text-muted-foreground">
              Reset links are single-use and must be opened in the same browser where you requested them.
              Request a fresh one below.
            </p>
          </div>
          <Link href="/auth/forgot" className="block">
            <Button className="h-12 w-full">Request a new link</Button>
          </Link>
        </div>
      ) : (
        <form action={save} className="space-y-3">
          {notice && <p className="rounded-2xl bg-secondary p-3 text-sm">{notice}</p>}
          <Input name="password" type="password" placeholder="New password (min 8 characters)" autoComplete="new-password" required className="h-12" />
          <Input name="confirm" type="password" placeholder="Confirm new password" autoComplete="new-password" required className="h-12" />
          <Button type="submit" className="h-12 w-full" disabled={loading || hasSession === null}>
            {loading ? 'Saving…' : 'Save new password'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
