import { LoaderCircleIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib'

type SpinnerProps = ComponentProps<typeof LoaderCircleIcon>

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <LoaderCircleIcon
      role="status"
      aria-label="로딩 중"
      className={cn('size-5 animate-spin', className)}
      {...props}
    />
  )
}
