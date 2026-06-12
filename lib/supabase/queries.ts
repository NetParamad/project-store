import type { SupabaseClient } from '@supabase/supabase-js'
import type { Category, Product, ProductImage, Profile, StoreSettings, Appointment, AppointmentService, Rental, ProductDateLock } from '@/lib/db.types'

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
    .maybeSingle()
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
    .order('name', { ascending: true })

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
    name: string
    slug: string
    description?: string
    parent_id?: number | null
    sort_order?: number
  }
) {
  const { data, error } = await client
    .from('categories')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
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
    name?: string
    slug?: string
    description?: string
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
    name: string
    slug: string
    description?: string
    price?: number
    stock_qty?: number
    is_active?: boolean
    product_type?: 'book' | 'rent' | 'both'
  }
) {
  const { data, error } = await client
    .from('products')
    .insert({
      category_id: input.category_id ?? null,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      price: input.price ?? 0,
      stock_qty: input.stock_qty ?? 0,
      is_active: input.is_active ?? true,
      product_type: input.product_type ?? 'book',
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
    name?: string
    slug?: string
    description?: string
    price?: number
    stock_qty?: number
    is_active?: boolean
    product_type?: 'book' | 'rent' | 'both'
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
    .select('*, service:appointment_services(*), product:products(*, images:product_images(*))')
    .eq('user_id', user?.id ?? '')
    .order('appointment_date', { ascending: false })
    .order('time_slot', { ascending: false })

  return (data ?? []) as (Appointment & { service: AppointmentService } & { product: (Product & { images: ProductImage[] }) | null })[]
}

export async function getAppointment(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('appointments')
    .select('*, service:appointment_services(*), product:products(*, images:product_images(*))')
    .eq('id', id)
    .single()

  return data as (Appointment & { service: AppointmentService } & { product: (Product & { images: ProductImage[] }) | null }) | null
}

export async function getAllAppointments(client: SupabaseClient) {
  const { data } = await client
    .from('appointments')
    .select('*, service:appointment_services(*), product:products(*, images:product_images(*))')
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
    product_type?: ('book' | 'rent' | 'both')[]
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

  if (options?.product_type) {
    query = query.in('product_type', options.product_type)
  }

  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%`
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
    .in('product_type', ['book', 'both'])
    .order('created_at', { ascending: false })

  return (data ?? []) as (Product & { images: ProductImage[] })[]
}

export async function getRentableProducts(client: SupabaseClient) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('is_active', true)
    .in('product_type', ['rent', 'both'])
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

export async function updateStoreSettings(
  client: SupabaseClient,
  input: {
    store_name?: string
    logo_url?: string | null
    promptpay_number?: string | null
    promptpay_qr_url?: string | null
    bank_name?: string | null
    bank_account?: string | null
    bank_account_name?: string | null
    business_hours_start?: string
    business_hours_end?: string
    address?: string | null
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

// ─── Dashboard ───

export async function getDashboardStats(client: SupabaseClient) {
  const { data: rentals } = await client
    .from('rentals')
    .select('id, rental_price, deposit_amount, status, created_at, product_id, product:products(name)')
    .order('created_at', { ascending: false })

  const totalRentals = rentals?.length ?? 0
  const totalRevenue = rentals
    ?.filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => sum + Number(r.rental_price), 0) ?? 0
  const todayRentals = rentals
    ?.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString())
    .length ?? 0
  const pendingRentals = rentals
    ?.filter((r) => r.status === 'pending')
    .length ?? 0

  const rentalsByStatus: Record<string, number> = {}
  rentals?.forEach((r) => {
    rentalsByStatus[r.status] = (rentalsByStatus[r.status] || 0) + 1
  })

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const revenueByDay: { date: string; revenue: number }[] = last30.map((date) => ({
    date,
    revenue: rentals
      ?.filter((r) => r.created_at?.startsWith(date) && r.status !== 'cancelled')
      .reduce((sum, r) => sum + Number(r.rental_price), 0) ?? 0,
  }))

  const productRentalCounts: Record<string, { count: number; name: string }> = {}
  rentals?.forEach((r) => {
    if (r.status === 'cancelled') return
    const p = r.product as { name?: string } | null
    const name = p?.name ?? `#${r.product_id}`
    if (!productRentalCounts[name]) {
      productRentalCounts[name] = { count: 0, name }
    }
    productRentalCounts[name].count += 1
  })

  const topProducts = Object.entries(productRentalCounts)
    .map(([, data]) => ({ name: data.name, qty: data.count, revenue: 0 }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  const { data: recentRentals } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: allAppointments } = await client
    .from('appointments')
    .select('id, created_at, status')
  const totalAppointments = allAppointments?.length ?? 0
  const todayAppointments = allAppointments
    ?.filter((a) => new Date(a.created_at).toDateString() === new Date().toDateString())
    .length ?? 0
  const appointmentsByStatus: Record<string, number> = {}
  allAppointments?.forEach((a) => {
    appointmentsByStatus[a.status] = (appointmentsByStatus[a.status] || 0) + 1
  })

  const { data: bookedProducts } = await client
    .from('appointments')
    .select('product_id, product:products(name)')
    .not('product_id', 'is', null)
    .neq('status', 'cancelled')

  const productBookingCounts: Record<string, number> = {}
  bookedProducts?.forEach((a) => {
    const p = a.product as { name?: string } | null
    const name = p?.name ?? `#${a.product_id}`
    productBookingCounts[name] = (productBookingCounts[name] || 0) + 1
  })

  const topBookedProducts = Object.entries(productBookingCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalRentals,
    totalRevenue,
    todayRentals,
    pendingRentals,
    rentalsByStatus,
    revenueByDay,
    topProducts,
    recentRentals: (recentRentals ?? []) as (Rental & { product: Product & { images: ProductImage[] } })[],
    totalAppointments,
    todayAppointments,
    appointmentsByStatus,
    topBookedProducts,
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

// ─── Product Locks ───

export async function createDateLock(
  client: SupabaseClient,
  input: {
    product_id: number
    lock_start_date: string
    lock_end_date: string
    reason?: string
    created_by: string
  }
) {
  const { data, error } = await client
    .from('product_date_locks')
    .insert({
      product_id: input.product_id,
      lock_start_date: input.lock_start_date,
      lock_end_date: input.lock_end_date,
      reason: input.reason ?? null,
      created_by: input.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data as ProductDateLock
}

export async function getProductDateLocks(client: SupabaseClient, productId: number) {
  const { data } = await client
    .from('product_date_locks')
    .select('*')
    .eq('product_id', productId)
    .order('lock_start_date', { ascending: true })

  return (data ?? []) as ProductDateLock[]
}

export async function deleteDateLock(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('product_date_locks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function isProductAvailable(
  client: SupabaseClient,
  productId: number,
  startDate: string,
  endDate?: string
) {
  const end = endDate ?? startDate
  const { data } = await client
    .from('product_date_locks')
    .select('id')
    .eq('product_id', productId)
    .lte('lock_start_date', end)
    .gte('lock_end_date', startDate)
    .limit(1)

  return (data?.length ?? 0) === 0
}

// ─── Rentals ───

export async function createRental(
  client: SupabaseClient,
  input: {
    user_id: string
    product_id: number
    appointment_id?: number
    order_id?: number
    rental_start_date: string
    rental_end_date: string
    rental_price: number
    deposit_amount: number
    notes?: string
  }
) {
  const { data, error } = await client
    .from('rentals')
    .insert({
      user_id: input.user_id,
      product_id: input.product_id,
      appointment_id: input.appointment_id ?? null,
      order_id: input.order_id ?? null,
      rental_start_date: input.rental_start_date,
      rental_end_date: input.rental_end_date,
      rental_price: input.rental_price,
      deposit_amount: input.deposit_amount,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Rental
}

export async function getUserRentals(client: SupabaseClient) {
  const { data: { user } } = await client.auth.getUser()
  const { data } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (data ?? []) as (Rental & { product: Product & { images: ProductImage[] } })[]
}

export async function getAllRentals(client: SupabaseClient) {
  const { data } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .order('created_at', { ascending: false })

  return (data ?? []) as (Rental & { product: Product & { images: ProductImage[] } })[]
}

export async function getRental(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .eq('id', id)
    .maybeSingle()

  return data as (Rental & { product: Product & { images: ProductImage[] } }) | null
}

export async function getAdminRental(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .eq('id', id)
    .maybeSingle()

  return data as (Rental & { product: Product & { images: ProductImage[] } }) | null
}

export async function updateRentalStatus(
  client: SupabaseClient,
  id: number,
  status: Rental['status'],
  notes?: string
) {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'returned') updates.returned_at = new Date().toISOString()
  if (notes !== undefined) updates.notes = notes

  const { error } = await client
    .from('rentals')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function updateRentalReturn(
  client: SupabaseClient,
  id: number,
  input: {
    status?: Rental['status']
    returned_at?: string
    return_condition?: string
    return_penalty?: number
    return_notes?: string
    notes?: string
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.status !== undefined) updates.status = input.status
  if (input.returned_at !== undefined) updates.returned_at = input.returned_at
  if (input.return_condition !== undefined) updates.return_condition = input.return_condition
  if (input.return_penalty !== undefined) updates.return_penalty = input.return_penalty
  if (input.return_notes !== undefined) updates.return_notes = input.return_notes
  if (input.notes !== undefined) updates.notes = input.notes

  const { error } = await client
    .from('rentals')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function updateRental(
  client: SupabaseClient,
  id: number,
  input: {
    rental_start_date?: string
    rental_end_date?: string
    rental_price?: number
    deposit_amount?: number
    notes?: string
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.rental_start_date !== undefined) updates.rental_start_date = input.rental_start_date
  if (input.rental_end_date !== undefined) updates.rental_end_date = input.rental_end_date
  if (input.rental_price !== undefined) updates.rental_price = input.rental_price
  if (input.deposit_amount !== undefined) updates.deposit_amount = input.deposit_amount
  if (input.notes !== undefined) updates.notes = input.notes

  const { error } = await client
    .from('rentals')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

// ─── Admin Appointment Management ───

export async function updateAppointmentAdmin(
  client: SupabaseClient,
  id: number,
  input: {
    appointment_date?: string
    time_slot?: string
    end_time?: string
    product_id?: number | null
    notes?: string
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.appointment_date !== undefined) updates.appointment_date = input.appointment_date
  if (input.time_slot !== undefined) updates.time_slot = input.time_slot
  if (input.end_time !== undefined) updates.end_time = input.end_time
  if (input.product_id !== undefined) updates.product_id = input.product_id
  if (input.notes !== undefined) updates.notes = input.notes

  const { error } = await client
    .from('appointments')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function updateAppointmentCustomer(
  client: SupabaseClient,
  id: number,
  userId: string,
  input: {
    appointment_date?: string
    time_slot?: string
    end_time?: string
    product_id?: number | null
    notes?: string
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.appointment_date !== undefined) updates.appointment_date = input.appointment_date
  if (input.time_slot !== undefined) updates.time_slot = input.time_slot
  if (input.end_time !== undefined) updates.end_time = input.end_time
  if (input.product_id !== undefined) updates.product_id = input.product_id
  if (input.notes !== undefined) updates.notes = input.notes

  const { error } = await client
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
