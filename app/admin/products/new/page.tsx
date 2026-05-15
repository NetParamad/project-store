import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/supabase/queries'
import { ProductForm } from '../product-form'

export default async function NewProductPage() {
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Product</h1>
        <p className="text-muted-foreground mt-1">
          Add a new product to your catalog
        </p>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}
