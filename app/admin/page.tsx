import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getCategories, getProducts, getDashboardStats } from '@/lib/supabase/queries'
import Link from 'next/link'
import { Package, Tags, ShoppingCart, CalendarRange, DollarSign, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RevenueChart } from './revenue-chart'
import { OrdersByStatusChart } from './orders-status-chart'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const locale = await getLocale()
  const t = await getTranslations('admin.dashboard')
  const st = await getTranslations('status')
  const [categories, products, stats] = await Promise.all([
    getCategories(supabase),
    getProducts(supabase),
    getDashboardStats(supabase),
  ])

  const totalStock = products.reduce((sum, p) => sum + p.stock_qty, 0)
  const inactiveProducts = products.filter((p) => !p.is_active).length

  const statusCards = [
    {
      title: t('totalOrders'),
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: t('today', { count: stats.todayOrders }),
    },
    {
      title: t('totalRevenue'),
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: t('allTimeExclCancelled'),
    },
    {
      title: t('pendingOrders'),
      value: stats.pendingOrders,
      icon: Clock,
      description: t('awaitingAction'),
    },
    {
      title: t('totalProducts'),
      value: products.length,
      icon: Package,
      description: t('inactive', { count: inactiveProducts }),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
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
            <CardTitle className="text-lg">{t('topProducts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noSales')}</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, idx) => (
                  <div key={product.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">#{idx + 1}</span>
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{locale === 'th' ? (product.name_th || product.name_en) : (product.name_en || product.name_th)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{t('sold', { count: product.qty })}</span>
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
            <CardTitle className="text-lg">{t('recentOrders')}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noOrders')}</p>
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
                      <span className="text-muted-foreground">{st(order.status)}</span>
                    </div>
                    <span>฿{Number(order.total_amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('categories')}</CardTitle>
            <Tags size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('productCategories')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('stockPurchase')}</CardTitle>
            <ShoppingCart size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('itemsAvailable')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('appointments')}</CardTitle>
            <CalendarRange size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('todayAppointments', { count: stats.todayAppointments })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('quickActions')}</CardTitle>
            <TrendingUp size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/products/new">{t('addProduct')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/orders">{t('viewOrders')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
