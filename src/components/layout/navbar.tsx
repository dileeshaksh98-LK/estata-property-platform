'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Heart, Menu, Plus, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'
import { SITE } from '@/lib/constants'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/properties?listing=sale', label: 'Buy' },
  { href: '/properties?listing=rent', label: 'Rent' },
  { href: '/properties?type=land', label: 'Land' },
  { href: '/dashboard', label: 'Sell' },
]

export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'glass-strong border-b border-border/60 shadow-soft' : 'bg-transparent',
      )}
    >
      <nav className="container flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Link href="/" className="flex items-center gap-2" aria-label={SITE.name}>
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-semibold">
            e
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">{SITE.name}</span>
        </Link>

        {/* desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Search">
            <Link href="/properties"><Search /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Saved">
            <Link href="/saved"><Heart /></Link>
          </Button>
          <ThemeToggle />
          <Button asChild className="hidden md:inline-flex">
            <Link href="/dashboard/listings/new"><Plus className="-ml-1" /> Post Ad</Link>
          </Button>
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {/* mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong overflow-hidden border-b border-border/60 md:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-base font-medium hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-2">
                <Link href="/dashboard/listings/new"><Plus className="-ml-1" /> Post Your Property</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
