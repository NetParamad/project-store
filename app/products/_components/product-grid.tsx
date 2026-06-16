import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getActiveProducts, getCategories } from '@/lib/supabase/queries'
import { getProductsAvailability } from '@/lib/supabase/availability'
import { ProductCard } from '@/components/product-card'
import { CategoryFilter } from '../category-filter'
import { Pagination } from '../pagination'

interface Props {
  searchParams: Promise<{ category?: string; search?: string; page?: string; available?: string }>
}

export async function ProductGrid({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  const categoryId = params.category ? parseInt(params.category) : undefined
  const search = params.search
  const page = params.page ? parseInt(params.page) : 1
  const showAvailableOnly = params.available === 'true'

  const result = await getActiveProducts(supabase, {
    category_id: isNaN(categoryId ?? 0) ? undefined : categoryId,
    search,
    page: isNaN(page) ? 1 : page,
    pageSize: 12,
  })

  const productIds = result.products.map((p) => p.id)
  const availabilityMap = productIds.length > 0
    ? await getProductsAvailability(supabase, productIds)
    : new Map<number, boolean>()

  let filteredProducts = result.products
  if (showAvailableOnly) {
    filteredProducts = result.products.filter(
      (p) => availabilityMap.get(p.id) !== false
    )
  }

  return (
    <div className="flex gap-8">
      <aside className="hidden md:block w-48 shrink-0">
        <CategoryFilter categories={categories} selected={categoryId} />
      </aside>

      <div className="flex-1 space-y-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">ไม่พบสินค้า</p>
            {(search || categoryId) && (
              <Link
                href="/products"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                ลองปรับคำค้นหาหรือตัวกรอง
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  available={availabilityMap.get(product.id)}
                />
              ))}
            </div>

            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              searchParams={params}
            />
          </>
        )}
      </div>
    </div>
  )
}
