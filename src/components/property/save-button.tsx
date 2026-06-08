'use client'

import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSavedProperties } from '@/hooks/use-saved-properties'
import { cn } from '@/lib/utils'

export function SaveButton({
  id,
  className,
  variant = 'overlay',
}: {
  id: string
  className?: string
  variant?: 'overlay' | 'inline'
}) {
  const { isSaved, toggle, ready } = useSavedProperties()
  const saved = ready && isSaved(id)

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save property'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(id)
      }}
      className={cn(
        'grid place-items-center rounded-full transition-colors',
        variant === 'overlay'
          ? 'size-9 glass border border-white/30 text-foreground hover:bg-card'
          : 'size-11 border border-border bg-card hover:bg-secondary',
        className,
      )}
    >
      <motion.span
        key={String(saved)}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      >
        <Heart
          className={cn('size-[18px] transition-colors', saved ? 'fill-accent text-accent' : 'text-current')}
        />
      </motion.span>
    </button>
  )
}
