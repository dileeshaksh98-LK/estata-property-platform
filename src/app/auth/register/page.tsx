'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, GoogleIcon } from '@/components/auth/auth-shell'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'
import { SITE } from '@/lib/constants'

const PERKS = ['Free property listings', 'Save & compare homes', 'Direct chat with sellers']

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function notConfigured() { setNotice('Add your Supabase keys to .env.local to enable sign-up.') }

  async function google() {
    if (!supabaseEnabled) return notConfigured()
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
  }

  async function register(formData: FormData) {
    setNotice(null)
    const name = String(formData.get('name')).trim()
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))
    if (name.length < 2) return setNotice('Please enter your full name.')
    if (password.length < 8) return setNotice('Password must be at least 8 characters.')
    if (!supabaseEnabled) return notConfigured()

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    setLoading(false)
    if (error) return setNotice(error.message)
    // If email confirmation is disabled, a session is returned immediately.
    if (data.session) { router.push('/dashboard'); router.refresh() }
    else setNotice('Check your inbox to confirm your email, then sign in.')
  }

  return (
    <AuthShell title="Create your account" subtitle={`Join ${SITE.name} — it only takes a minute.`}>
      <ul className="mb-5 space-y-2">
        {PERKS.map((p) => (
          <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-3" /></span>{p}
          </li>
        ))}
      </ul>

      <Button variant="outline" className="w-full" onClick={google}><GoogleIcon /> Sign up with Google</Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" /></div>

      <form action={register} className="space-y-3">
        <Input name="name" placeholder="Full name" required />
        <Input name="email" type="email" placeholder="Email address" required />
        <Input name="password" type="password" placeholder="Password (min 8 characters)" required />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</Button>
      </form>

      {notice && <p className="mt-4 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">{notice}</p>}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}
