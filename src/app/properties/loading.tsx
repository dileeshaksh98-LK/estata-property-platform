import { PropertyGridSkeleton } from '@/components/property/property-card-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container pt-8">
      <Skeleton className="h-9 w-80" />
      <Skeleton className="mt-2 h-4 w-40" />
      <div className="mt-8 flex gap-8">
        <Skeleton className="hidden h-[520px] w-72 shrink-0 rounded-3xl lg:block" />
        <div className="flex-1">
          <PropertyGridSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}
