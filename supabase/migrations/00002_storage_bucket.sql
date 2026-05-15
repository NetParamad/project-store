-- Run in Supabase SQL Editor
-- Create storage buckets

-- ============================================================
-- BUCKET 1: Product images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admins only can upload/update/delete
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- ============================================================
-- BUCKET 2: Payment slips (PromptPay)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-slips', 'payment-slips', false)
ON CONFLICT (id) DO NOTHING;

-- Users can view their own slips; admins can view all
CREATE POLICY "Users can view own payment slips"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-slips'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Any authenticated user can upload a slip
CREATE POLICY "Authenticated users can upload payment slips"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-slips'
    AND auth.role() = 'authenticated'
  );

-- Only admins can update/delete
CREATE POLICY "Admins can update payment slips"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'payment-slips'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete payment slips"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'payment-slips'
    AND public.is_admin()
  );

-- ============================================================
-- BUCKET 3: Store assets (logo, PromptPay QR)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view (logo, QR need to be visible to customers)
CREATE POLICY "Anyone can view store assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');

-- Only admins can manage
CREATE POLICY "Admins can upload store assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND public.is_admin()
  );

CREATE POLICY "Admins can update store assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete store assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND public.is_admin()
  );
