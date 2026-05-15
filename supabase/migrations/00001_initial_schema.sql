-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_th TEXT,
  description_en TEXT,
  parent_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (
    public.is_admin()
  );

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    public.is_admin()
  );

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_th TEXT,
  description_en TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  rental_price_daily DECIMAL(10,2) DEFAULT 0,
  rental_price_weekly DECIMAL(10,2) DEFAULT 0,
  rental_price_monthly DECIMAL(10,2) DEFAULT 0,
  deposit DECIMAL(10,2) DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  rental_stock_qty INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (
    public.is_admin()
  );

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (
    public.is_admin()
  );

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (
    public.is_admin()
  );

-- 4. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can update product images"
  ON public.product_images FOR UPDATE
  USING (
    public.is_admin()
  );

CREATE POLICY "Admins can delete product images"
  ON public.product_images FOR DELETE
  USING (
    public.is_admin()
  );

-- 5. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name_th TEXT NOT NULL DEFAULT '',
  store_name_en TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  promptpay_number TEXT,
  promptpay_qr_url TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_account_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store settings"
  ON public.store_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert store settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update store settings"
  ON public.store_settings FOR UPDATE
  USING (public.is_admin());

-- Seed default row
INSERT INTO public.store_settings (id, store_name_th, store_name_en)
VALUES (1, 'ร้านของฉัน', 'My Store')
ON CONFLICT (id) DO NOTHING;

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','confirmed','shipped','delivered','cancelled')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_province TEXT,
  shipping_district TEXT,
  shipping_subdistrict TEXT,
  shipping_zip TEXT,
  note TEXT,
  slip_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- 7. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'rent')),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

-- 8. SETUP: Set first user as admin (run after your first signup)
-- UPDATE public.profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- 9. RENTALS
CREATE TABLE IF NOT EXISTS public.rentals (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id BIGINT REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reserved','picked_up','returned','completed','late','cancelled')),
  quantity INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_return_date DATE,
  total_days INTEGER NOT NULL DEFAULT 1,
  rental_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_paid BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_returned BOOLEAN NOT NULL DEFAULT FALSE,
  late_fee_per_day DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_late_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rentals"
  ON public.rentals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create rentals"
  ON public.rentals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rentals"
  ON public.rentals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rentals"
  ON public.rentals FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update rentals"
  ON public.rentals FOR UPDATE
  USING (public.is_admin());

-- 10. STOCK MANAGEMENT RPC
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id BIGINT,
  p_field TEXT,
  p_qty INTEGER
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF p_field = 'stock_qty' THEN
    UPDATE public.products
    SET stock_qty = GREATEST(0, stock_qty - p_qty),
        updated_at = NOW()
    WHERE id = p_product_id;
  ELSIF p_field = 'rental_stock_qty' THEN
    UPDATE public.products
    SET rental_stock_qty = GREATEST(0, rental_stock_qty - p_qty),
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_stock(
  p_product_id BIGINT,
  p_field TEXT,
  p_qty INTEGER
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF p_field = 'stock_qty' THEN
    UPDATE public.products
    SET stock_qty = stock_qty + p_qty,
        updated_at = NOW()
    WHERE id = p_product_id;
  ELSIF p_field = 'rental_stock_qty' THEN
    UPDATE public.products
    SET rental_stock_qty = rental_stock_qty + p_qty,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
END;
$$;

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general','order_update','payment_confirmed','rental_update')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());
