import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { api } from '@/lib/api'
import { ErrorState } from '@/components/shared'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { dashboardRanges } from 'core/constants'
import type { DashboardRange } from 'core/constants'
import type { MoodTrendResponse } from 'core/types/dashboard'

const chartConfig = {
  VeryHappy: { label: <span className="whitespace-nowrap">Very Happy</span>, color: 'oklch(0.62 0.09 145)' },
  Happy: { label: <span className="whitespace-nowrap">Happy</span>, color: 'oklch(0.68 0.08 110)' },
  Neutral: { label: <span className="whitespace-nowrap">Neutral</span>, color: 'oklch(0.68 0.08 75)' },
  Sad: { label: <span className="whitespace-nowrap">Sad</span>, color: 'oklch(0.6 0.09 45)' },
  VerySad: { label: <span className="whitespace-nowrap">Very Sad</span>, color: 'oklch(0.5 0.13 25)' },
} satisfies ChartConfig

export default function MoodTrendChart() {
  const [range, setRange] = useState<DashboardRange>(dashboardRanges.weekly)

  const trend = useQuery({
    queryKey: ['dashboard', 'mood-trend', range],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<MoodTrendResponse>('/dashboard/mood-trend', { signal, params: { range } })
      return data
    },
  })

  const points = trend.data?.data ?? []
  const ticks = points.filter((point) => point.isTick).map((point) => point.date)
  const axisLabels = new Map(points.map((point) => [point.date, point.axisLabel]))
  const tooltipLabels = new Map(points.map((point) => [point.date, point.label]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Check-ins</CardTitle>
        <CardAction>
          <Tabs value={range} onValueChange={(value) => setRange(value)}>
            <TabsList>
              <TabsTrigger value={dashboardRanges.weekly}>Weekly</TabsTrigger>
              <TabsTrigger value={dashboardRanges.monthly}>Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        {trend.isPending ? (
          <div className="flex h-56 w-full items-end gap-1.5 sm:h-64" aria-hidden="true">
            {[45, 70, 55, 85, 40, 65, 75].map((height, index) => (
              <Skeleton key={index} className="w-full rounded-t-md" style={{ height: `${height}%` }} />
            ))}
          </div>
        ) : trend.isError ? (
          <ErrorState error={trend.error} fallback="Failed to load mood check-in data." compact />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full sm:h-64">
            <BarChart accessibilityLayer data={trend.data.data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={1}
                axisLine={false}
                interval={0}
                ticks={ticks}
                tickFormatter={(value) => axisLabels.get(String(value)) ?? ''}
              />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => tooltipLabels.get(String(value)) ?? ''} />} />
              <ChartLegend content={<ChartLegendContent className="flex-wrap justify-center gap-x-3 gap-y-1" />} />
              <Bar dataKey="VeryHappy" stackId="mood" fill="var(--color-VeryHappy)" />
              <Bar dataKey="Happy" stackId="mood" fill="var(--color-Happy)" />
              <Bar dataKey="Neutral" stackId="mood" fill="var(--color-Neutral)" />
              <Bar dataKey="Sad" stackId="mood" fill="var(--color-Sad)" />
              <Bar dataKey="VerySad" stackId="mood" fill="var(--color-VerySad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
