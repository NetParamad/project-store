'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllOrders } from '@/lib/supabase/queries'
import { Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Order, OrderItem } from '@/lib/db.types'

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getAllOrders(supabase)
      setOrders(data)
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium">Order #</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Items</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Slip</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">#{order.id}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="p-3">{order.items?.length ?? 0}</td>
                  <td className="p-3 font-medium">฿{order.total_amount.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status]}`}>
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    {order.slip_url ? (
                      <a href={order.slip_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">
                        View Slip
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${order.id}`}><Eye size={14} className="mr-1" /> Manage</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
