import { Badge } from '@/components/ui/badge'

interface Props {
  available: boolean
  className?: string
}

export function AvailabilityBadge({ available, className }: Props) {
  if (available) return null

  return (
    <Badge variant="secondary" className={className}>
      ไม่ว่าง
    </Badge>
  )
}
