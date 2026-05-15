'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Props {
  data: Record<string, number>
}

const COLORS = ['#facc15', '#3b82f6', '#6366f1', '#a855f7', '#22c55e', '#ef4444']

const LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function OrdersByStatusChart({ data }: Props) {
  const items = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: LABELS[status] || status,
      value: count,
    }))

  if (items.length === 0) return null

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold text-sm mb-4">Orders by Status</h3>
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
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
