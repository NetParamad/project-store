import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCategories, getProduct } from '@/lib/supabase/queries'
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
  const [product, categories] = await Promise.all([
    getProduct(supabase, productId),
    getCategories(supabase),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground mt-1">
          Update &ldquo;{product.name_en}&rdquo;
        </p>
      </div>
      <ProductForm categories={categories} initialData={product} />
    </div>
  )
}
