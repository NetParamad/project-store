'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart-provider'
import { createClient } from '@/lib/supabase/client'
import { House, Package, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()
  const [hydrated, setHydrated] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setHydrated(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user)
    })
  }, [])

  if (pathname.startsWith('/admin')) return null
  if (pathname.startsWith('/checkout')) return null

  const tabs = [
    { href: '/', label: 'หน้าแรก', icon: House },
    { href: '/products', label: 'สินค้า', icon: Package },
    { href: '/cart', label: 'ตะกร้า', icon: ShoppingCart },
    {
      href: loggedIn ? '/profile' : '/auth/login',
      label: loggedIn ? 'บัญชี' : 'เข้าสู่ระบบ',
      icon: User,
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {tab.href === '/cart' && hydrated && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 min-w-[16px] rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
