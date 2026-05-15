'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from './cart-provider'
import { Button } from '@/components/ui/button'

export function CartButton() {
  const { totalItems } = useCart()

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link href="/cart">
        <ShoppingCart size={18} />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </Link>
    </Button>
  )
}
