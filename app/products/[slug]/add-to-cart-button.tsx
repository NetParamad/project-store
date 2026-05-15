'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCart } from '@/components/cart-provider'
import type { Product } from '@/lib/db.types'
import { toast } from 'sonner'

interface Props {
  product: Product
  hasPurchase: boolean
  hasRental: boolean
}

function daysBetween(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)))
}

function calcRentalPrice(product: Product, startDate: string, endDate: string) {
  const days = daysBetween(startDate, endDate)
  const daily = Number(product.rental_price_daily) || 0
  const weekly = Number(product.rental_price_weekly) || 0
  const monthly = Number(product.rental_price_monthly) || 0

  let total = 0
  let remaining = days

  if (monthly > 0) {
    const months = Math.floor(remaining / 30)
    total += months * monthly
    remaining -= months * 30
  }
  if (weekly > 0) {
    const weeks = Math.floor(remaining / 7)
    total += weeks * weekly
    remaining -= weeks * 7
  }
  total += remaining * daily

  return { total, days }
}

export function AddToCartButton({ product, hasPurchase, hasRental }: Props) {
  const { addItem } = useCart()
  const [mode, setMode] = useState<'buy' | 'rent'>('buy')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const t = useTranslations('products')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultStart = tomorrow.toISOString().split('T')[0]
  const defaultEnd = new Date(tomorrow.getTime() + 86400000).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)

  const rentalPrice = mode === 'rent'
    ? calcRentalPrice(product, startDate, endDate)
    : null

  function handleAdd() {
    const id = `${product.id}-${mode}${mode === 'rent' ? `-${startDate}-${endDate}` : ''}`
    addItem({
      id,
      product,
      type: mode,
      quantity,
      ...(mode === 'rent' ? { rentalStart: startDate, rentalEnd: endDate, rentalDays: rentalPrice?.days } : {}),
    })

    setAdded(true)
    toast.success(`${product.name_en} ${t('added')}`)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {hasPurchase && hasRental && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'buy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('buy')}
            className="flex-1"
          >
            {t('buy')}
          </Button>
          <Button
            type="button"
            variant={mode === 'rent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('rent')}
            className="flex-1"
          >
            {t('rent')}
          </Button>
        </div>
      )}

      {mode === 'rent' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="start-date" className="text-xs">{t('startDate')}</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              min={defaultStart}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (e.target.value >= endDate) {
                  const next = new Date(e.target.value)
                  next.setDate(next.getDate() + 1)
                  setEndDate(next.toISOString().split('T')[0])
                }
              }}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end-date" className="text-xs">{t('endDate')}</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      )}

      {rentalPrice && (
        <div className="rounded bg-muted/50 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('period')}</span>
            <span>{rentalPrice.days} {t('perDay') === '/day' && rentalPrice.days > 1 ? 'days' : t('perDay')}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>{t('rentalTotal')}</span>
            <span>฿{rentalPrice.total.toLocaleString()}</span>
          </div>
          {Number(product.deposit) > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('deposit')}</span>
              <span>฿{Number(product.deposit).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <Label htmlFor="qty" className="text-xs">
            {t('quantity')}
          </Label>
          <Input
            id="qty"
            type="number"
            min={1}
            max={mode === 'buy' ? product.stock_qty : product.rental_stock_qty}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 h-9"
          />
        </div>

        <Button
          onClick={handleAdd}
          disabled={added || quantity < 1}
          className="flex-1 h-12"
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
    </div>
  )
}
