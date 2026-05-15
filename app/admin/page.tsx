import { createClient } from '@/lib/supabase/server'
import { getCategories, getProducts, getDashboardStats } from '@/lib/supabase/queries'
import { Package, Tags, ShoppingCart, CalendarRange, DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueChart } from './revenue-chart'
import { OrdersByStatusChart } from './orders-status-chart'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const [categories, products, stats] = await Promise.all([
    getCategories(supabase),
    getProducts(supabase),
    getDashboardStats(supabase),
  ])

  const totalStock = products.reduce((sum, p) => sum + p.stock_qty, 0)
  const totalRentalStock = products.reduce((sum, p) => sum + p.rental_stock_qty, 0)
  const inactiveProducts = products.filter((p) => !p.is_active).length

  const statusCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: `${stats.todayOrders} today`,
    },
    {
      title: 'Total Revenue',
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'All time (excl. cancelled)',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      description: 'Awaiting action',
    },
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      description: `${inactiveProducts} inactive`,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your store
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
            <CardTitle className="text-lg">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, idx) => (
                  <div key={product.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">#{idx + 1}</span>
                      <span className="truncate max-w-[200px]">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{product.qty} sold</span>
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
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
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
                      <span className="text-muted-foreground">{order.status}</span>
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
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tags size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Product categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock (Purchase)</CardTitle>
            <ShoppingCart size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground mt-1">Items available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock (Rental)</CardTitle>
            <CalendarRange size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRentalStock}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for rent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <TrendingUp size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/products/new"
              className="block w-full text-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Add Product
            </a>
            <a
              href="/admin/orders"
              className="block w-full text-center px-4 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
            >
              View Orders
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
