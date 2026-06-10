'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

export const PinPickerLoader = dynamic(() => import('./pin-picker'), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-3xl" />,
})
