'use client'

import { useTranslations } from 'next-intl'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Props {
  data: Record<string, number>
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function OrdersByStatusChart({ data }: Props) {
  const t = useTranslations('admin.dashboard')
  const st = useTranslations('status')
  const items = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: st(status) || status,
      value: count,
    }))

  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-semibold">{t('ordersByStatus')}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {items.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
  )
}
