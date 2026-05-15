export interface Profile {
  id: string
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name_th: string
  name_en: string
  slug: string
  description_th: string | null
  description_en: string | null
  parent_id: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  category_id: number | null
  name_th: string
  name_en: string
  slug: string
  description_th: string | null
  description_en: string | null
  price: number
  rental_price_daily: number | null
  rental_price_weekly: number | null
  rental_price_monthly: number | null
  deposit: number | null
  stock_qty: number
  rental_stock_qty: number
  is_active: boolean
  created_at: string
  updated_at: string
  images?: ProductImage[]
}

export interface ProductImage {
  id: number
  product_id: number
  url: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

export type ProductFormData = {
  category_id: string
  name_th: string
  name_en: string
  slug: string
  description_th: string
  description_en: string
  price: string
  rental_price_daily: string
  rental_price_weekly: string
  rental_price_monthly: string
  deposit: string
  stock_qty: string
  rental_stock_qty: string
  is_active: boolean
}

export type CategoryFormData = {
  name_th: string
  name_en: string
  slug: string
  description_th: string
  description_en: string
  parent_id: string
  sort_order: string
}

export interface StoreSettings {
  id: number
  store_name_th: string
  store_name_en: string
  logo_url: string | null
  promptpay_number: string | null
  promptpay_qr_url: string | null
  bank_name: string | null
  bank_account: string | null
  bank_account_name: string | null
  updated_at: string
}

export interface Rental {
  id: number
  order_id: number
  order_item_id: number | null
  product_id: number
  user_id: string
  status: 'pending' | 'reserved' | 'picked_up' | 'returned' | 'completed' | 'late' | 'cancelled'
  quantity: number
  start_date: string
  end_date: string
  actual_return_date: string | null
  total_days: number
  rental_cost: number
  deposit_amount: number
  deposit_paid: boolean
  deposit_returned: boolean
  late_fee_per_day: number
  total_late_fee: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user_id: string
  type: 'general' | 'order_update' | 'payment_confirmed' | 'rental_update'
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

export type StoreSettingsFormData = {
  store_name_th: string
  store_name_en: string
  promptpay_number: string
  bank_name: string
  bank_account: string
  bank_account_name: string
}

export interface Order {
  id: number
  user_id: string
  status: 'pending' | 'paid' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address: string | null
  shipping_province: string | null
  shipping_district: string | null
  shipping_subdistrict: string | null
  shipping_zip: string | null
  note: string | null
  slip_url: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  type: 'buy' | 'rent'
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}
