'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOrder } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import type { Order, OrderItem } from '@/lib/db.types'

const statusSteps = ['pending', 'paid', 'confirmed', 'shipped', 'delivered']

const statusLabels: Record<string, string> = {
  pending: 'รอการชำระเงิน',
  paid: 'ชำระแล้ว - รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ได้รับแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<(Order & { items: OrderItem[] }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      const data = await getOrder(supabase, Number(params.id))
      if (!data || data.user_id !== user.id) {
        router.push('/orders')
        return
      }
      setOrder(data)
      setLoading(false)
    }
    fetch()
  }, [router, params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) return null

  const currentStep = statusSteps.indexOf(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/orders"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">คำสั่งซื้อ #{order.id}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {order.status === 'cancelled' ? (
        <Card className="bg-red-50 border-red-200 text-center text-red-700 font-medium">
          <CardContent className="p-4">
            คำสั่งซื้อนี้ถูกยกเลิกแล้ว
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {statusSteps.map((step, idx) => (
            <div key={step} className="flex items-center gap-3">
              {idx < currentStep ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              ) : idx === currentStep ? (
                <Circle className="w-5 h-5 text-primary shrink-0" fill="currentColor" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
              )}
              <span className={idx <= currentStep ? 'font-medium' : 'text-muted-foreground'}>
                {statusLabels[step]}
              </span>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
        <h2 className="font-semibold">รายการ</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <div className="min-w-0 flex-1">
              <p className="break-words pr-2">{item.product_name}</p>
              <p className="text-muted-foreground text-xs">{item.type.toUpperCase()} x{item.quantity} @ ฿{item.unit_price.toLocaleString()}</p>
            </div>
            <span className="font-medium shrink-0">฿{item.total_price.toLocaleString()}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>ยอดรวม</span>
          <span>฿{order.total_amount.toLocaleString()}</span>
        </div>
      </CardContent></Card>

      <Card>
        <CardContent className="p-4 space-y-1 text-sm">
        <h2 className="font-semibold mb-2">ที่อยู่จัดส่ง</h2>
        <p>{order.shipping_name}</p>
        <p>{order.shipping_phone}</p>
        <p>{order.shipping_address}</p>
        <p>{order.shipping_subdistrict}, {order.shipping_district}</p>
        <p>{order.shipping_province} {order.shipping_zip}</p>
        {order.note && (
          <>
            <Separator className="my-2" />
            <p className="text-muted-foreground">หมายเหตุ: {order.note}</p>
          </>
        )}
      </CardContent></Card>

      {order.slip_url && (
        <section className="space-y-2">
          <h2 className="font-semibold">สลิปการโอน</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.slip_url} alt="Payment Slip" className="max-w-xs rounded border" />
        </section>
      )}
    </div>
  )
}
