'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'ทั้งหมด', href: '/products' },
  { label: 'จอง-ลอง', href: '/products/book' },
  { label: 'เช่าชุด', href: '/products/rent' },
]

export function TypeTabs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function buildHref(href: string) {
    const p = new URLSearchParams(searchParams.toString())
    p.delete('page')
    const qs = p.toString()
    return qs ? `${href}?${qs}` : href
  }

  return (
    <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit" role="tablist">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.label}
            href={buildHref(tab.href)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
