'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { List, Map } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ViewToggle() {
  const router = useRouter()
  const params = useSearchParams()
  const view = params.get('view') === 'map' ? 'map' : 'list'

  function setView(v: 'list' | 'map') {
    const next = new URLSearchParams(params.toString())
    if (v === 'map') next.set('view', 'map')
    else { next.delete('view'); next.delete('bbox') }
    router.replace(`/properties?${next.toString()}`, { scroll: false })
  }

  return (
    <div role="group" aria-label="Results view" className="inline-flex rounded-2xl bg-secondary p-1">
      {(['list', 'map'] as const).map((v) => (
        <button
          key={v} onClick={() => setView(v)} aria-pressed={view === v}
          className={cn('flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors', view === v ? 'bg-card shadow-soft' : 'text-muted-foreground')}
        >
          {v === 'list' ? <List className="size-4" /> : <Map className="size-4" />}
          <span className="capitalize">{v}</span>
        </button>
      ))}
    </div>
  )
}
