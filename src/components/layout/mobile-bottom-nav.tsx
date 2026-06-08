'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, PlusCircle, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/properties', label: 'Search', icon: Search },
  { href: '/dashboard/listings/new', label: 'Post', icon: PlusCircle, primary: true },
  { href: '/saved', label: 'Saved', icon: Heart },
  { href: '/dashboard', label: 'Account', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" aria-label="Primary">
      <div className="glass-strong mx-auto flex max-w-lg items-center justify-around border-t border-border/60 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {ITEMS.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          if (primary)
            return (
              <Link
                key={label}
                href={href}
                className="-mt-6 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-lift transition-transform active:scale-90"
                aria-label={label}
              >
                <Icon className="size-7" />
              </Link>
            )
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('size-5 transition-transform', active && 'scale-110')} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
