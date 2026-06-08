import { PropertyGridSkeleton } from '@/components/property/property-card-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container pt-10">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-3 h-5 w-48" />
      <div className="mt-8">
        <PropertyGridSkeleton count={6} />
      </div>
    </div>
  )
}
