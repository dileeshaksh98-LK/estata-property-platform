'use client'
import { useEffect, useRef } from 'react'
import { incrementView } from '@/lib/actions/properties'

export function ViewTracker({ id }: { id: string }) {
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    // Fire-and-forget; never blocks render.
    incrementView(id).catch(() => {})
  }, [id])
  return null
}
