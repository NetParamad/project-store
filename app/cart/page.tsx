'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCart, calcRentalPrice } from '@/components/cart-provider'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart()
  const t = useTranslations('cart')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <ShoppingBag size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{t('emptyHint')}</p>
          <Button asChild>
            <Link href="/products">{t('continue')}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {totalItems} {totalItems !== 1 ? t('items') : t('item')}
            </p>
            <Button variant="outline" size="sm" onClick={clearCart}>
              {t('clear')}
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const unitPrice = item.type === 'buy'
                ? item.product.price
                : (() => {
                    const { total } = calcRentalPrice(item.product, item.rentalStart!, item.rentalEnd!)
                    return total
                  })()

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border bg-background p-4"
                >
                  <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
                    {item.product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.images[0].url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                        {t('noImg')}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium text-sm hover:underline line-clamp-1"
                    >
                      {item.product.name_en}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium uppercase">
                        {item.type}
                      </span>
                      <span className="text-sm font-semibold">
                        ฿{unitPrice.toLocaleString()}
                      </span>
                    </div>
                    {item.type === 'rent' && item.rentalStart && item.rentalEnd && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <span>{item.rentalStart} → {item.rentalEnd}</span>
                        {item.rentalDays && <span>({item.rentalDays}d)</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <p className="font-semibold">
                      ฿{(unitPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )
            })}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{t('total')}</p>
            <p className="text-2xl font-bold">
              ฿{totalPrice.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button asChild variant="outline">
              <Link href="/products">
                <ArrowLeft size={16} className="mr-2" />
                {t('continue')}
              </Link>
            </Button>
            <Button className="flex-1" size="lg" asChild>
              <Link href="/checkout">{t('checkout')}</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
