'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  data: { date: string; revenue: number }[]
}

export function RevenueChart({ data }: Props) {
  const displayed = data.filter((d) => d.revenue > 0)
  if (displayed.length === 0) return null

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold text-sm mb-4">Revenue (Last 30 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(5)}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `฿${v}`}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'Revenue']}
              labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
