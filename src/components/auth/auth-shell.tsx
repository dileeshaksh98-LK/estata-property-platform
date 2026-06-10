'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SITE } from '@/lib/constants'

/** Shared auth card shell used by the login and register pages. */
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
