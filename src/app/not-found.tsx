import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-7xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">This page wandered off</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The property or page you’re looking for may have been sold, rented, or moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/properties">Browse properties</Link>
      </Button>
    </div>
  )
}
