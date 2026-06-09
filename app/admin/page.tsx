import { createClient } from '@/lib/supabase/server'
import { getCategories, getProducts, getDashboardStats } from '@/lib/supabase/queries'
import Link from 'next/link'
import { Package, Tags, ShoppingCart, CalendarRange, DollarSign, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RevenueChart } from './revenue-chart'
import { OrdersByStatusChart } from './orders-status-chart'
import { BookingChart } from './booking-chart'

const statusLabels: Record<string, string> = {
  pending: 'รอการชำระเงิน',
  paid: 'ชำระแล้ว - รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ได้รับแล้ว',
  cancelled: 'ยกเลิก',
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const [categories, products, stats] = await Promise.all([
    getCategories(supabase),
    getProducts(supabase),
    getDashboardStats(supabase),
  ])

  const totalStock = products.reduce((sum, p) => sum + p.stock_qty, 0)
  const inactiveProducts = products.filter((p) => !p.is_active).length

  const statusCards = [
    {
      title: 'คำสั่งซื้อทั้งหมด',
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: `${stats.todayOrders} วันนี้`,
    },
    {
      title: 'รายได้ทั้งหมด',
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'ทั้งหมด (ไม่รวมที่ยกเลิก)',
    },
    {
      title: 'รอดำเนินการ',
      value: stats.pendingOrders,
      icon: Clock,
      description: 'รอการดำเนินการ',
    },
    {
      title: 'สินค้าทั้งหมด',
      value: products.length,
      icon: Package,
      description: `${inactiveProducts} รายการที่ปิดใช้งาน`,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground mt-1">
          ภาพรวมของร้านค้า
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart data={stats.revenueByDay} />
        <OrdersByStatusChart data={stats.ordersByStatus} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สินค้าขายดี</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีรายการขาย</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, idx) => (
                  <div key={product.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">#{idx + 1}</span>
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>ขายแล้ว {product.qty}</span>
                      <span>฿{product.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">คำสั่งซื้อล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        order.status === 'cancelled' ? 'bg-red-500' :
                        order.status === 'delivered' ? 'bg-green-500' :
                        order.status === 'paid' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`} />
                      <span>#{order.id}</span>
                      <span className="text-muted-foreground">{statusLabels[order.status] || order.status}</span>
                    </div>
                    <span>฿{Number(order.total_amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BookingChart data={stats.topBookedProducts} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">หมวดหมู่</CardTitle>
            <Tags size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">หมวดหมู่สินค้า</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">สต็อก (ซื้อ)</CardTitle>
            <ShoppingCart size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground mt-1">สินค้าที่มี</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">การนัดหมาย</CardTitle>
            <CalendarRange size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.todayAppointments} วันนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ดำเนินการด่วน</CardTitle>
            <TrendingUp size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/products/new">เพิ่มสินค้า</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/orders">ดูคำสั่งซื้อ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
