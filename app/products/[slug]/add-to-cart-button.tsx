'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCart } from '@/components/cart-provider'
import { useField } from '@/lib/i18n'
import type { Product } from '@/lib/db.types'
import { toast } from 'sonner'

interface Props {
  product: Product
  outOfStock?: boolean
}

export function AddToCartButton({ product, outOfStock }: Props) {
  const locale = useLocale()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const t = useTranslations('products')

  function handleAdd() {
    const id = `${product.id}-buy`
    addItem({
      id,
      product,
      type: 'buy',
      quantity,
    })

    setAdded(true)
    toast.success(`${useField(locale, product.name_th, product.name_en)} ${t('added')}`)
    setTimeout(() => setAdded(false), 2000)
  }

  if (outOfStock) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium text-destructive">{t('outOfStock')}</p>
        <Button disabled className="w-full h-12" size="lg">
          <ShoppingCart size={18} className="mr-2" />
          {t('outOfStock')}
        </Button>
      </CardContent></Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="space-y-1">
          <Label htmlFor="qty" className="text-xs">
            {t('quantity')}
          </Label>
          <Input
            id="qty"
            type="number"
            min={1}
            max={product.stock_qty}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full sm:w-20 h-9"
          />
        </div>

        <Button
          onClick={handleAdd}
          disabled={added || quantity < 1}
          className="w-full sm:flex-1 h-12"
          size="lg"
        >
          {added ? (
            <>
              <Check size={18} className="mr-2" />
              {t('added')}
            </>
          ) : (
            <>
              <ShoppingCart size={18} className="mr-2" />
              {t('addToCart')}
            </>
          )}
        </Button>
      </div>
    </CardContent></Card>
  )
}
