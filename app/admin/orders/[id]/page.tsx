'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { getOrder, updateOrderStatus, createNotification } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  { value: 'pending', labelKey: 'status.pending' },
  { value: 'paid', labelKey: 'status.paid' },
  { value: 'confirmed', labelKey: 'status.confirmed' },
  { value: 'shipped', labelKey: 'status.shipped' },
  { value: 'delivered', labelKey: 'status.delivered' },
  { value: 'cancelled', labelKey: 'status.cancelled' },
]

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
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
          title: t('admin.orderDetail.notifTitle'),
          message: t('admin.orderDetail.notifMessage', { id: String(order.id), status: newStatus }),
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
          <h1 className="text-2xl font-bold">{t('admin.orderDetail.title', { id: String(order.id) })}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
        <h2 className="font-semibold">{t('admin.orderDetail.status')}</h2>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label>{t('admin.orderDetail.updateStatus')}</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpdateStatus} disabled={saving || newStatus === order.status}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('admin.orderDetail.update')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('admin.orderDetail.current')} <span className="font-medium">{t('status.' + order.status)}</span>
        </p>
      </CardContent></Card>

      <Card>
        <CardContent className="p-4 space-y-3">
        <h2 className="font-semibold">{t('admin.orderDetail.items')}</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm gap-2">
            <div className="min-w-0">
              <p className="truncate">{item.product_name}</p>
              <p className="text-muted-foreground text-xs">{item.type.toUpperCase()} x{item.quantity} @ ฿{item.unit_price.toLocaleString()}</p>
            </div>
            <span className="font-medium">฿{item.total_price.toLocaleString()}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>{t('admin.orderDetail.total')}</span>
          <span>฿{order.total_amount.toLocaleString()}</span>
        </div>
      </CardContent></Card>

      <Card>
        <CardContent className="p-4 space-y-1 text-sm">
        <h2 className="font-semibold mb-2">{t('admin.orderDetail.shippingAddress')}</h2>
        <p>{order.shipping_name}</p>
        <p>{order.shipping_phone}</p>
        <p>{order.shipping_address}</p>
        <p>{order.shipping_subdistrict}, {order.shipping_district}</p>
        <p>{order.shipping_province} {order.shipping_zip}</p>
        {order.note && (
          <>
            <Separator className="my-2" />
            <p className="text-muted-foreground">{t('admin.orderDetail.note')} {order.note}</p>
          </>
        )}
      </CardContent></Card>

      {order.slip_url && (
        <section className="space-y-2">
          <h2 className="font-semibold">{t('admin.orderDetail.paymentSlip')}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.slip_url} alt="Payment Slip" className="max-w-full rounded border" />
        </section>
      )}
    </div>
  )
}
