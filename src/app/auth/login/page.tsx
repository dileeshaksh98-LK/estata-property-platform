'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, GoogleIcon } from '@/components/auth/auth-shell'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'
import { safeInternalPath } from '@/lib/auth/safe-redirect'
import { useToast } from '@/components/providers/toast-provider'
import { SITE } from '@/lib/constants'

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const redirectTo = safeInternalPath(params.get('redirect'))
  const prefillEmail = params.get('email') ?? ''
  const justRegistered = params.get('registered') === '1'
  const initialError = params.get('error') ? 'Sign-in failed. Please try again.' : null
  const passwordRef = useRef<HTMLInputElement>(null)

  // Hand-off from registration: prefill email, focus password, confirm success.
  useEffect(() => {
    if (justRegistered) {
      toast({ title: 'Account created successfully', description: 'Sign in to continue.', variant: 'success' })
      passwordRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [otpStage, setOtpStage] = useState<'request' | 'verify'>('request')
  const [otpEmail, setOtpEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(initialError)

  function notConfigured() {
    setNotice('Add your Supabase keys to .env.local to enable authentication.')
  }

  async function google() {
    if (!supabaseEnabled) return notConfigured()
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    })
  }

  async function passwordLogin(formData: FormData) {
    if (!supabaseEnabled) return notConfigured()
    setLoading(true); setNotice(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get('email')),
      password: String(formData.get('password')),
    })
    setLoading(false)
    if (error) {
      setNotice(
        /invalid login credentials/i.test(error.message) ? 'Incorrect email or password. Please try again.'
        : /email not confirmed/i.test(error.message) ? 'Please confirm your email first — check your inbox for the link.'
        : error.message,
      )
    } else {
      toast({ title: 'Welcome back!', variant: 'success' })
      router.push(redirectTo); router.refresh()
    }
  }

  async function sendCode(formData: FormData) {
    if (!supabaseEnabled) return notConfigured()
    setLoading(true); setNotice(null)
    const email = String(formData.get('email'))
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    })
    setLoading(false)
    if (error) setNotice(error.message)
    else { setOtpEmail(email); setOtpStage('verify'); setNotice('We emailed you a 6-digit code (and a magic link).') }
  }

  async function verifyCode(formData: FormData) {
    if (!supabaseEnabled) return notConfigured()
    setLoading(true); setNotice(null)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token: String(formData.get('code')),
      type: 'email',
    })
    setLoading(false)
    if (error) setNotice(error.message)
    else { router.push(redirectTo); router.refresh() }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your listings and saved properties.">
      <Button variant="outline" className="w-full" onClick={google}><GoogleIcon /> Continue with Google</Button>
      <Divider />

      <div className="mb-4 inline-flex w-full rounded-2xl bg-secondary p-1">
        <Tab active={mode === 'password'} onClick={() => { setMode('password'); setNotice(null) }} icon={KeyRound}>Password</Tab>
        <Tab active={mode === 'otp'} onClick={() => { setMode('otp'); setOtpStage('request'); setNotice(null) }} icon={Mail}>Email code</Tab>
      </div>

      {mode === 'password' ? (
        <form action={passwordLogin} className="space-y-3">
          <Input name="email" type="email" placeholder="Email address" defaultValue={prefillEmail} autoComplete="email" required className="h-12" />
          <Input ref={passwordRef} name="password" type="password" placeholder="Password" autoComplete="current-password" required className="h-12" />
          <Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      ) : otpStage === 'request' ? (
        <form action={sendCode} className="space-y-3">
          <Input name="email" type="email" placeholder="Email address" required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending…' : 'Email me a code'}</Button>
        </form>
      ) : (
        <form action={verifyCode} className="space-y-3">
          <p className="text-sm text-muted-foreground">Enter the code sent to <span className="font-medium text-foreground">{otpEmail}</span></p>
          <Input name="code" inputMode="numeric" placeholder="6-digit code" className="text-center tracking-[0.5em]" required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Verifying…' : 'Verify & sign in'}</Button>
          <button type="button" onClick={() => setOtpStage('request')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">Use a different email</button>
        </form>
      )}

      {notice && <p className="mt-4 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">{notice}</p>}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to {SITE.name}? <Link href="/auth/register" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell title="Welcome back" subtitle="Loading…"><div className="h-40" /></AuthShell>}>
      <LoginInner />
    </Suspense>
  )
}


function Tab({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${active ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}>
      <Icon className="size-4" /> {children}
    </button>
  )
}

function Divider() {
  return <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" /></div>
}

