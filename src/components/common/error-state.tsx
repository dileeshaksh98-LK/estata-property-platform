'use client'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorState({ reset }: { reset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/5 px-6 py-20 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold">Something went wrong</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn’t load this content. Please check your connection and try again.
      </p>
      {reset && (
        <Button onClick={reset} className="mt-6" variant="outline">
          <RotateCw /> Try again
        </Button>
      )}
    </div>
  )
}
