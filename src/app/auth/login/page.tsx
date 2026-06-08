'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'
import { SITE } from '@/lib/constants'

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirect') || '/dashboard'
  const initialError = params.get('error') ? 'Sign-in failed. Please try again.' : null

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
    if (error) setNotice(error.message)
    else { router.push(redirectTo); router.refresh() }
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
          <Input name="email" type="email" placeholder="Email address" required />
          <Input name="password" type="password" placeholder="Password" required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
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

/* ---- shared building blocks (reused by the register page) ----------- */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grain mesh relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-4xl border border-border bg-card/90 p-8 shadow-lift backdrop-blur-xl"
      >
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-semibold">e</span>
          <span className="font-display text-xl font-semibold">{SITE.name}</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </motion.div>
    </div>
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

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 4.75 12 4.75Z" />
    </svg>
  )
}
