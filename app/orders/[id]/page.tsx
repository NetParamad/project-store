'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { getOrder, getOrderRentals } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import type { Order, OrderItem, Rental, Product } from '@/lib/db.types'

const statusSteps = ['pending', 'paid', 'confirmed', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const t = useTranslations()
  const [order, setOrder] = useState<(Order & { items: OrderItem[] }) | null>(null)
  const [rentals, setRentals] = useState<(Rental & { product: Product })[]>([])
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

      const rentalData = await getOrderRentals(supabase, data.id)
      setRentals(rentalData)

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
          <h1 className="text-2xl font-bold">{t('orders.orderNum')}{order.id}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {order.status === 'cancelled' ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center text-red-700 font-medium">
          {t('orders.cancelled')}
        </div>
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
                {t(`status.${step}`)}
              </span>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">{t('orders.items')}</h2>
        {order.items.map((item) => {
          const itemRental = rentals.find((r) => r.product_id === item.product_id)
          return (
            <div key={item.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div>
                  <p>{item.product_name}</p>
                  <p className="text-muted-foreground text-xs">{item.type.toUpperCase()} x{item.quantity} @ ฿{item.unit_price.toLocaleString()}</p>
                </div>
                <span className="font-medium">฿{item.total_price.toLocaleString()}</span>
              </div>
              {itemRental && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                  <span>{itemRental.start_date} → {itemRental.end_date} ({itemRental.total_days}d)</span>
                  <span className="capitalize font-medium">[{t(`status.${itemRental.status}`)}]</span>
                </div>
              )}
            </div>
          )
        })}
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>{t('orders.total')}</span>
          <span>฿{order.total_amount.toLocaleString()}</span>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-1 text-sm">
        <h2 className="font-semibold mb-2">{t('orders.shippingAddress')}</h2>
        <p>{order.shipping_name}</p>
        <p>{order.shipping_phone}</p>
        <p>{order.shipping_address}</p>
        <p>{order.shipping_subdistrict}, {order.shipping_district}</p>
        <p>{order.shipping_province} {order.shipping_zip}</p>
        {order.note && (
          <>
            <Separator className="my-2" />
            <p className="text-muted-foreground">{t('orders.note')}: {order.note}</p>
          </>
        )}
      </section>

      {order.slip_url && (
        <section className="space-y-2">
          <h2 className="font-semibold">{t('orders.paymentSlip')}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.slip_url} alt="Payment Slip" className="max-w-xs rounded border" />
        </section>
      )}
    </div>
  )
}
