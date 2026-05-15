'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { getUserOrders } from '@/lib/supabase/queries'
import { Loader2, Package, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Order, OrderItem } from '@/lib/db.types'

export default function OrdersPage() {
  const router = useRouter()
  const t = useTranslations()
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/orders')
        return
      }
      const data = await getUserOrders(supabase)
      setOrders(data)
      setLoading(false)
    }
    fetch()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold">{t('orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Package size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{t('orders.noOrders')}</p>
          <Button asChild>
            <Link href="/products">{t('orders.startShopping')}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t('orders.orderNum')}{order.id} &middot; {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p className="font-semibold">฿{order.total_amount.toLocaleString()}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(order.status)}`}>
                  {t(`status.${order.status}`)}
                </span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/orders/${order.id}`}>
                  <Eye size={14} className="mr-1" /> {t('orders.view')}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
