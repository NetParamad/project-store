'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/db.types'
import { cn } from '@/lib/utils'

interface Props {
  categories: Category[]
  selected?: number
  selectedType?: string
  mobile?: boolean
}

export function CategoryFilter({ categories, selected, selectedType, mobile }: Props) {
  const searchParams = useSearchParams()

  function buildUrl(categoryId?: number, type?: string) {
    const p = new URLSearchParams()
    if (categoryId) p.set('category', categoryId.toString())
    if (type) p.set('type', type)
    const search = searchParams.get('search')
    if (search) p.set('search', search)
    return `/products?${p.toString()}`
  }

  function buildTypeUrl(type?: string) {
    const p = new URLSearchParams()
    if (type) p.set('type', type)
    const category = searchParams.get('category')
    if (category) p.set('category', category)
    const search = searchParams.get('search')
    if (search) p.set('search', search)
    return `/products?${p.toString()}`
  }

  if (mobile) {
    return (
      <>
        <Link
          href={buildTypeUrl()}
          className={cn(
            'whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors',
            !selectedType
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent'
          )}
        >
          ทุกประเภท
        </Link>
        <Link
          href={buildTypeUrl('buy')}
          className={cn(
            'whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors',
            selectedType === 'buy'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent'
          )}
        >
          ซื้อ
        </Link>
        <Link
          href={buildTypeUrl('book')}
          className={cn(
            'whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors',
            selectedType === 'book'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent'
          )}
        >
          จอง
        </Link>
        <Link
          href={buildUrl()}
          className={cn(
            'whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors',
            !selected && !selectedType
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent'
          )}
        >
          ทุกหมวดหมู่
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={buildUrl(cat.id)}
            className={cn(
              'whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors',
              selected === cat.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent'
            )}
          >
            {cat.name}
          </Link>
        ))}
      </>
    )
  }

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">ประเภท</h3>
      <Link
        href={buildTypeUrl()}
        className={cn(
          'block px-3 py-2 rounded-md text-sm transition-colors',
          !selectedType
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-accent text-muted-foreground'
        )}
      >
        ทุกประเภท
      </Link>
      <Link
        href={buildTypeUrl('buy')}
        className={cn(
          'block px-3 py-2 rounded-md text-sm transition-colors',
          selectedType === 'buy'
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-accent text-muted-foreground'
        )}
      >
        ซื้อ
      </Link>
      <Link
        href={buildTypeUrl('book')}
        className={cn(
          'block px-3 py-2 rounded-md text-sm transition-colors',
          selectedType === 'book'
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-accent text-muted-foreground'
        )}
      >
        จอง
      </Link>
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">หมวดหมู่</h3>
        <Link
          href={buildUrl()}
          className={cn(
            'block px-3 py-2 rounded-md text-sm transition-colors',
            !selected && !selectedType
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-accent text-muted-foreground'
          )}
        >
          ทุกหมวดหมู่
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={buildUrl(cat.id)}
            className={cn(
              'block px-3 py-2 rounded-md text-sm transition-colors',
              selected === cat.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-accent text-muted-foreground'
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
