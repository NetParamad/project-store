'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { getAllOrders } from '@/lib/supabase/queries'
import { Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { Order, OrderItem } from '@/lib/db.types'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminOrdersPage() {
  const t = useTranslations()
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
        <h1 className="text-3xl font-bold">{t('admin.orders.title')}</h1>
        <p className="text-muted-foreground">{t('admin.orders.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-0">
        <Table style={{ minWidth: 750 }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium">{t('admin.orders.orderNum')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.orders.date')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.orders.items')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.orders.total')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.orders.status')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.orders.slip')}</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-accent/50 transition-colors">
                <TableCell className="px-4 py-3 font-medium">#{order.id}</TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
                <TableCell className="px-4 py-3">{order.items?.length ?? 0}</TableCell>
                <TableCell className="px-4 py-3 font-medium">฿{order.total_amount.toLocaleString()}</TableCell>
                <TableCell className="px-4 py-3">
                  <Badge className={`${statusColor[order.status]} border-transparent`}>
                    {t('status.' + order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {order.slip_url ? (
                    <a href={order.slip_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">
                      {t('admin.orders.viewSlip')}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/orders/${order.id}`}><Eye size={14} className="mr-1" /> {t('admin.orders.manage')}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('admin.orders.noOrders')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  )
}
