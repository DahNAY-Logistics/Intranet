import type { LucideIcon } from 'lucide-react'

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StatCardProps = {
  label: string
  value: number
  icon: LucideIcon
}

export default function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </CardTitle>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-3xl font-medium tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}
