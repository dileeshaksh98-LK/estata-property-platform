'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

export const BrowseMapLoader = dynamic(() => import('./browse-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-[420px] w-full rounded-3xl" />,
})
