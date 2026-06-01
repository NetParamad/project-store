import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  getActiveProducts,
  getCategories,
} from '@/lib/supabase/queries'
import { ProductCard } from '@/components/product-card'
import { SearchBar } from '@/components/search-bar'
import { CategoryFilter } from './category-filter'
import { Pagination } from './pagination'

interface Props {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

async function ProductGrid({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  const categoryId = params.category ? parseInt(params.category) : undefined
  const search = params.search
  const page = params.page ? parseInt(params.page) : 1

  const result = await getActiveProducts(supabase, {
    category_id: isNaN(categoryId ?? 0) ? undefined : categoryId,
    search,
    page: isNaN(page) ? 1 : page,
    pageSize: 12,
  })

  return (
    <div className="flex gap-8">
      <aside className="hidden md:block w-48 shrink-0">
        <CategoryFilter
          categories={categories}
          selected={categoryId}
        />
      </aside>

      <div className="flex-1 space-y-6">
        {result.products.length === 0 ? (
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
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
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

export default async function ProductsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">สินค้า</h1>
          <p className="text-muted-foreground mt-1">เลือกซื้อสินค้า</p>
        </div>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
        <CategoryFilter
          categories={categories}
          selected={undefined}
          mobile
        />
      </div>

      <Suspense fallback={<div className="text-center py-16">สินค้า...</div>}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
