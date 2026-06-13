import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/supabase/queries'
import { SearchBar } from '@/components/search-bar'
import { TypeTabs } from '../type-tabs'
import { CategoryFilter } from '../category-filter'
import { ProductGrid } from '../_components/product-grid'

interface Props {
  searchParams: Promise<{ category?: string; search?: string; page?: string; available?: string }>
}

export default async function RentProductsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const categories = await getCategories(supabase)
  const params = await searchParams
  const showAvailableOnly = params.available === 'true'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">เช่าชุด</h1>
          <p className="text-muted-foreground mt-1">เลือกชุดที่ต้องการเช่า</p>
        </div>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <Suspense>
        <TypeTabs />
      </Suspense>

      <div className="flex items-center gap-4">
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
          <CategoryFilter
            categories={categories}
            selected={undefined}
            mobile
          />
        </div>
        <Link
          href={showAvailableOnly ? '/products/rent' : '/products/rent?available=true'}
          className={`text-sm whitespace-nowrap px-3 py-1.5 rounded-full border transition-colors ${
            showAvailableOnly
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-muted'
          }`}
        >
          {showAvailableOnly ? 'แสดงทั้งหมด' : 'เฉพาะที่ว่าง'}
        </Link>
      </div>

      <Suspense fallback={<div className="text-center py-16">สินค้า...</div>}>
        <ProductGrid searchParams={searchParams} typeFilter={['rent', 'both']} />
      </Suspense>
    </div>
  )
}
