'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOrder, updateOrderStatus, createNotification } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import type { Order, OrderItem } from '@/lib/db.types'

const statusOptions = [
  { value: 'pending', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<(Order & { items: OrderItem[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getOrder(supabase, Number(params.id))
      setOrder(data)
      setNewStatus(data?.status ?? '')
      setLoading(false)
    }
    fetch()
  }, [params.id])

  const handleUpdateStatus = async () => {
    if (!order || newStatus === order.status) return
    setSaving(true)
    try {
      const supabase = createClient()
      const updated = await updateOrderStatus(supabase, order.id, newStatus as Order['status'])
      setOrder({ ...order, ...updated })

      try {
        await createNotification(supabase, {
          user_id: order.user_id,
          type: 'order_update',
          title: 'Order status updated',
          message: `Order #${order.id} is now "${newStatus}"`,
          link: `/orders/${order.id}`,
        })
      } catch {} // notification is best-effort
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/orders"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Status</h2>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label>Update Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpdateStatus} disabled={saving || newStatus === order.status}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Current: <span className="font-medium">{statusOptions.find(s => s.value === order.status)?.label}</span>
        </p>
      </div>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <div>
              <p>{item.product_name}</p>
              <p className="text-muted-foreground text-xs">{item.type.toUpperCase()} x{item.quantity} @ ฿{item.unit_price.toLocaleString()}</p>
            </div>
            <span className="font-medium">฿{item.total_price.toLocaleString()}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>฿{order.total_amount.toLocaleString()}</span>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-1 text-sm">
        <h2 className="font-semibold mb-2">Shipping Address</h2>
        <p>{order.shipping_name}</p>
        <p>{order.shipping_phone}</p>
        <p>{order.shipping_address}</p>
        <p>{order.shipping_subdistrict}, {order.shipping_district}</p>
        <p>{order.shipping_province} {order.shipping_zip}</p>
        {order.note && (
          <>
            <Separator className="my-2" />
            <p className="text-muted-foreground">Note: {order.note}</p>
          </>
        )}
      </section>

      {order.slip_url && (
        <section className="space-y-2">
          <h2 className="font-semibold">Payment Slip</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.slip_url} alt="Payment Slip" className="max-w-sm rounded border" />
        </section>
      )}
    </div>
  )
}
