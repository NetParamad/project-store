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
  stock_qty: number
  is_active: boolean
  is_bookable: boolean
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
  stock_qty: string
  is_active: boolean
  is_bookable: boolean
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

export interface AppointmentService {
  id: number
  type: 'try_on' | 'consultation'
  name_th: string
  name_en: string
  description_th: string | null
  description_en: string | null
  duration_minutes: number
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: number
  user_id: string
  service_id: number
  product_id: number | null
  appointment_date: string
  time_slot: string
  end_time: string
  phone: string | null
  notes: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export type AppointmentFormData = {
  service_id: string
  product_id: string
  appointment_date: string
  time_slot: string
  phone: string
  notes: string
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
  theme: string
  theme_custom_color: string | null
  business_hours_start: string
  business_hours_end: string
  address_th: string | null
  address_en: string | null
  email: string | null
  phone: string | null
  facebook_url: string | null
  instagram_url: string | null
  line_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  map_url: string | null
  updated_at: string
}

export type StoreSettingsFormData = {
  store_name_th: string
  store_name_en: string
  promptpay_number: string
  bank_name: string
  bank_account: string
  bank_account_name: string
  theme: string
  theme_custom_color: string
  business_hours_start: string
  business_hours_end: string
  address_th: string
  address_en: string
  email: string
  phone: string
  facebook_url: string
  instagram_url: string
  line_url: string
  tiktok_url: string
  youtube_url: string
  map_url: string
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
  type: 'buy'
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Notification {
  id: number
  user_id: string
  type: 'general' | 'order_update' | 'payment_confirmed' | 'appointment_update'
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}
