import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCategories, getProduct } from '@/lib/supabase/queries'
import { getTranslations } from 'next-intl/server'
import { ProductForm } from '../../product-form'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const productId = parseInt(id, 10)
  if (isNaN(productId)) notFound()

  const supabase = await createClient()
  const [product, categories, t] = await Promise.all([
    getProduct(supabase, productId),
    getCategories(supabase),
    getTranslations(),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('admin.productForm.updateProduct')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('admin.productForm.updateProduct')} &ldquo;{product.name_en}&rdquo;
        </p>
      </div>
      <ProductForm categories={categories} initialData={product} />
    </div>
  )
}
