'use client'
import { ErrorState } from '@/components/common/error-state'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container py-16">
      <ErrorState reset={reset} />
    </div>
  )
}
