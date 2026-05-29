import type { SupabaseClient } from '@supabase/supabase-js'
import type { Category, Order, OrderItem, Product, ProductImage, Profile, StoreSettings, Appointment, AppointmentService } from '@/lib/db.types'

// ─── Profiles ───

export async function getProfile(client: SupabaseClient) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!data && error && error.code !== 'PGRST116') {
    await client.from('profiles').insert({
      id: user.id,
      display_name: user.email,
      role: 'user'
    })
    const { data: newData } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (newData) return newData as Profile | null
  }

  return data as Profile | null
}

export async function isAdmin(client: SupabaseClient) {
  const profile = await getProfile(client)
  return profile?.role === 'admin'
}

export async function updateProfile(
  client: SupabaseClient,
  data: Partial<Pick<Profile, 'display_name' | 'phone' | 'avatar_url'>>
) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: updated, error } = await client
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()
  if (error) throw error
  return updated as Profile
}

// ─── Categories ───

export async function getCategories(client: SupabaseClient) {
  const { data } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name_th', { ascending: true })

  return (data ?? []) as Category[]
}

export async function getCategory(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  return data as Category | null
}

export async function createCategory(
  client: SupabaseClient,
  input: {
    name_th: string
    name_en: string
    slug: string
    description_th?: string
    description_en?: string
    parent_id?: number | null
    sort_order?: number
  }
) {
  const { data, error } = await client
    .from('categories')
    .insert({
      name_th: input.name_th,
      name_en: input.name_en,
      slug: input.slug,
      description_th: input.description_th ?? null,
      description_en: input.description_en ?? null,
      parent_id: input.parent_id ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(
  client: SupabaseClient,
  id: number,
  input: {
    name_th?: string
    name_en?: string
    slug?: string
    description_th?: string
    description_en?: string
    parent_id?: number | null
    sort_order?: number
  }
) {
  const { data, error } = await client
    .from('categories')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Products ───

export async function getProducts(client: SupabaseClient) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .order('created_at', { ascending: false })

  return (data ?? []) as (Product & { images: ProductImage[] })[]
}

export async function getProduct(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('id', id)
    .single()

  return data as (Product & { images: ProductImage[] }) | null
}

export async function createProduct(
  client: SupabaseClient,
  input: {
    category_id?: number | null
    name_th: string
    name_en: string
    slug: string
    description_th?: string
    description_en?: string
    price?: number
    stock_qty?: number
    is_active?: boolean
    is_bookable?: boolean
  }
) {
  const { data, error } = await client
    .from('products')
    .insert({
      category_id: input.category_id ?? null,
      name_th: input.name_th,
      name_en: input.name_en,
      slug: input.slug,
      description_th: input.description_th ?? null,
      description_en: input.description_en ?? null,
      price: input.price ?? 0,
      stock_qty: input.stock_qty ?? 0,
      is_active: input.is_active ?? true,
      is_bookable: input.is_bookable ?? false,
    })
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(
  client: SupabaseClient,
  id: number,
  input: {
    category_id?: number | null
    name_th?: string
    name_en?: string
    slug?: string
    description_th?: string
    description_en?: string
    price?: number
    stock_qty?: number
    is_active?: boolean
    is_bookable?: boolean
  }
) {
  const { data, error } = await client
    .from('products')
    .update({
      ...input,
      category_id: input.category_id === undefined ? undefined : input.category_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function deleteProduct(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Product Images ───

export async function getProductImages(client: SupabaseClient, productId: number) {
  const { data } = await client
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  return (data ?? []) as ProductImage[]
}

export async function addProductImage(
  client: SupabaseClient,
  input: {
    product_id: number
    url: string
    is_primary?: boolean
    sort_order?: number
  }
) {
  const { data, error } = await client
    .from('product_images')
    .insert({
      product_id: input.product_id,
      url: input.url,
      is_primary: input.is_primary ?? false,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as ProductImage
}

export async function deleteProductImage(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('product_images')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function setPrimaryImage(client: SupabaseClient, productId: number, imageId: number) {
  await client
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  const { error } = await client
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  if (error) throw error
}

// ─── Store Settings ───

export async function getStoreSettings(client: SupabaseClient) {
  const { data } = await client
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single()

  return data as StoreSettings | null
}

// ─── Appointment Services ───

export async function getAppointmentServices(client: SupabaseClient) {
  const { data } = await client
    .from('appointment_services')
    .select('*')
    .order('id', { ascending: true })

  return (data ?? []) as AppointmentService[]
}

export async function getActiveAppointmentServices(client: SupabaseClient) {
  const { data } = await client
    .from('appointment_services')
    .select('*')
    .eq('is_active', true)
    .order('id', { ascending: true })

  return (data ?? []) as AppointmentService[]
}

// ─── Appointments ───

export async function createAppointment(
  client: SupabaseClient,
  input: {
    user_id: string
    service_id: number
    product_id?: number | null
    appointment_date: string
    time_slot: string
    end_time: string
    phone?: string
    notes?: string
  }
) {
  const { data, error } = await client
    .from('appointments')
    .insert({
      user_id: input.user_id,
      service_id: input.service_id,
      product_id: input.product_id ?? null,
      appointment_date: input.appointment_date,
      time_slot: input.time_slot,
      end_time: input.end_time,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Appointment
}

export async function getUserAppointments(client: SupabaseClient) {
  const { data: { user } } = await client.auth.getUser()
  const { data } = await client
    .from('appointments')
    .select('*, service:appointment_services(*), product:products(*)')
    .eq('user_id', user?.id ?? '')
    .order('appointment_date', { ascending: false })
    .order('time_slot', { ascending: false })

  return (data ?? []) as (Appointment & { service: AppointmentService } & { product: Product | null })[]
}

export async function getAppointment(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('appointments')
    .select('*, service:appointment_services(*), product:products(*)')
    .eq('id', id)
    .single()

  return data as (Appointment & { service: AppointmentService } & { product: Product | null }) | null
}

export async function getAllAppointments(client: SupabaseClient) {
  const { data } = await client
    .from('appointments')
    .select('*, service:appointment_services(*), product:products(*)')
    .order('appointment_date', { ascending: false })
    .order('time_slot', { ascending: false })

  return (data ?? []) as any[]
}

export async function updateAppointmentStatus(
  client: SupabaseClient,
  id: number,
  input: {
    status: Appointment['status']
    notes?: string
  }
) {
  const { data, error } = await client
    .from('appointments')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Appointment
}

export async function getAppointmentsByDate(client: SupabaseClient, date: string) {
  const { data } = await client
    .from('appointments')
    .select('time_slot, end_time, service_id')
    .eq('appointment_date', date)
    .in('status', ['pending', 'confirmed'])

  return (data ?? []) as { time_slot: string; end_time: string; service_id: number }[]
}

// ─── Store Front ───

export async function getActiveProducts(
  client: SupabaseClient,
  options?: {
    category_id?: number
    search?: string
    page?: number
    pageSize?: number
  }
) {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from('products')
    .select('*, images:product_images(*)', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (options?.category_id) {
    query = query.eq('category_id', options.category_id)
  }

  if (options?.search) {
    query = query.or(
      `name_th.ilike.%${options.search}%,name_en.ilike.%${options.search}%`
    )
  }

  const { data, count } = await query.range(from, to)

  return {
    products: (data ?? []) as (Product & { images: ProductImage[] })[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getBookableProducts(client: SupabaseClient) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('is_active', true)
    .eq('is_bookable', true)
    .order('created_at', { ascending: false })

  return (data ?? []) as (Product & { images: ProductImage[] })[]
}

export async function getProductBySlug(client: SupabaseClient, slug: string) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return data as (Product & { images: ProductImage[] }) | null
}

export async function getFeaturedProducts(
  client: SupabaseClient,
  limit = 6
) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as (Product & { images: ProductImage[] })[]
}

export async function getCategoriesWithProductCount(client: SupabaseClient) {
  const { data } = await client
    .from('categories')
    .select('*, products!inner(id)')
    .order('sort_order', { ascending: true })

  return (data ?? []) as (Category & { products: { id: number }[] })[]
}

export async function updateStoreSettings(
  client: SupabaseClient,
  input: {
    store_name_th?: string
    store_name_en?: string
    logo_url?: string | null
    promptpay_number?: string | null
    promptpay_qr_url?: string | null
    bank_name?: string | null
    bank_account?: string | null
    bank_account_name?: string | null
    business_hours_start?: string
    business_hours_end?: string
    address_th?: string | null
    address_en?: string | null
    email?: string | null
    phone?: string | null
    facebook_url?: string | null
    instagram_url?: string | null
    line_url?: string | null
    tiktok_url?: string | null
    youtube_url?: string | null
    map_url?: string | null
  }
) {
  const { data, error } = await client
    .from('store_settings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return data as StoreSettings
}

// ─── Orders ───

export async function createOrder(
  client: SupabaseClient,
  input: {
    total_amount: number
    shipping_name: string
    shipping_phone: string
    shipping_address: string
    shipping_province: string
    shipping_district: string
    shipping_subdistrict: string
    shipping_zip: string
    note?: string
    items: {
      product_id: number
      product_name: string
      type: 'buy'
      quantity: number
      unit_price: number
      total_price: number
    }[]
  }
) {
  const { data: order, error: orderError } = await client
    .from('orders')
    .insert({
      total_amount: input.total_amount,
      shipping_name: input.shipping_name,
      shipping_phone: input.shipping_phone,
      shipping_address: input.shipping_address,
      shipping_province: input.shipping_province,
      shipping_district: input.shipping_district,
      shipping_subdistrict: input.shipping_subdistrict,
      shipping_zip: input.shipping_zip,
      note: input.note ?? null,
    })
    .select()
    .single()

  if (orderError) throw orderError

  const { error: itemsError } = await client
    .from('order_items')
    .insert(
      input.items.map((item) => ({
        order_id: order.id,
        ...item,
      }))
    )

  if (itemsError) throw itemsError

  const { data: fullOrder } = await client
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', order.id)
    .single()

  return fullOrder as Order & { items: OrderItem[] }
}

export async function getUserOrders(client: SupabaseClient) {
  const { data } = await client
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })

  return (data ?? []) as (Order & { items: OrderItem[] })[]
}

export async function getOrder(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .single()

  return data as (Order & { items: OrderItem[] }) | null
}

export async function getAllOrders(client: SupabaseClient) {
  const { data } = await client
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })

  return (data ?? []) as (Order & { items: OrderItem[] })[]
}

export async function updateOrderStatus(
  client: SupabaseClient,
  id: number,
  status: Order['status']
) {
  const { data, error } = await client
    .from('orders')
    .update({
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Order
}

export async function updateOrderSlip(
  client: SupabaseClient,
  id: number,
  slipUrl: string
) {
  const { data, error } = await client
    .from('orders')
    .update({
      slip_url: slipUrl,
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Order
}

// ─── Dashboard ───

export async function getDashboardStats(client: SupabaseClient) {
  const { data: orders } = await client
    .from('orders')
    .select('id, total_amount, status, created_at')
    .order('created_at', { ascending: false })

  const totalOrders = orders?.length ?? 0
  const totalRevenue = orders
    ?.filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0
  const todayOrders = orders
    ?.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
    .length ?? 0
  const pendingOrders = orders
    ?.filter((o) => o.status === 'pending' || o.status === 'paid')
    .length ?? 0

  const ordersByStatus: Record<string, number> = {}
  orders?.forEach((o) => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
  })

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const revenueByDay: { date: string; revenue: number }[] = last30.map((date) => ({
    date,
    revenue: orders
      ?.filter((o) => o.created_at?.startsWith(date) && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0,
  }))

  const { data: orderItems } = await client
    .from('order_items')
    .select('product_name, quantity, total_price, product:products(name_th, name_en)')

  const productSales: Record<string, { qty: number; revenue: number; name_th: string; name_en: string }> = {}
  orderItems?.forEach((item) => {
    if (!productSales[item.product_name]) {
      const p = item.product as { name_th?: string; name_en?: string } | null
      productSales[item.product_name] = {
        qty: 0,
        revenue: 0,
        name_th: p?.name_th || item.product_name,
        name_en: p?.name_en || item.product_name,
      }
    }
    productSales[item.product_name].qty += item.quantity
    productSales[item.product_name].revenue += Number(item.total_price)
  })

  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, name_th: data.name_th, name_en: data.name_en, qty: data.qty, revenue: data.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  const { data: recentOrders } = await client
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: allAppointments } = await client
    .from('appointments')
    .select('id, created_at')
  const totalAppointments = allAppointments?.length ?? 0
  const todayAppointments = allAppointments
    ?.filter((a) => new Date(a.created_at).toDateString() === new Date().toDateString())
    .length ?? 0

  return {
    totalOrders,
    totalRevenue,
    todayOrders,
    pendingOrders,
    ordersByStatus,
    revenueByDay,
    topProducts,
    recentOrders: (recentOrders ?? []) as (Order & { items: OrderItem[] })[],
    totalAppointments,
    todayAppointments,
  }
}

// ─── Notifications ───

export async function getNotifications(client: SupabaseClient, userId: string) {
  const { data } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as import('@/lib/db.types').Notification[]
}

export async function getUnreadCount(client: SupabaseClient, userId: string) {
  const { count } = await client
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  return count ?? 0
}

export async function markNotificationRead(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllNotificationsRead(client: SupabaseClient, userId: string) {
  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
}

export async function createNotification(
  client: SupabaseClient,
  input: {
    user_id: string
    type: 'general' | 'order_update' | 'payment_confirmed' | 'appointment_update'
    title: string
    message?: string
    link?: string
  }
) {
  const { data, error } = await client
    .from('notifications')
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
