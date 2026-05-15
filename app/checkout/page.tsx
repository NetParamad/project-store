'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useCart, calcRentalPrice } from '@/components/cart-provider'
import { getStoreSettings, createRental } from '@/lib/supabase/queries'
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import type { StoreSettings } from '@/lib/db.types'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ orderId: number } | null>(null)
  const [error, setError] = useState('')
  const t = useTranslations('checkout')

  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    address: '',
    province: '',
    district: '',
    subdistrict: '',
    zip: '',
  })
  const [note, setNote] = useState('')
  const [slipFile, setSlipFile] = useState<File | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/checkout')
        return
      }
      setUser(user)
      const settings = await getStoreSettings(supabase)
      setStoreSettings(settings)
      setLoading(false)
    }
    init()
  }, [router])

  const totalDeposit = items
    .filter(i => i.type === 'rent')
    .reduce((sum, i) => sum + (Number(i.product.deposit) || 0) * i.quantity, 0)

  const grandTotal = totalPrice + totalDeposit

  const valid = shipping.name && shipping.phone && shipping.address && shipping.province && shipping.district && shipping.subdistrict && shipping.zip && slipFile

  const handleSubmit = async () => {
    if (!valid || !user) return
    setSubmitting(true)
    setError('')

    try {
      const supabase = createClient()

      const orderItems = items.map((item) => {
        const unitPrice = item.type === 'buy'
          ? item.product.price
          : calcRentalPrice(item.product, item.rentalStart!, item.rentalEnd!).total

        return {
          product_id: item.product.id,
          product_name: item.product.name_en,
          type: item.type as 'buy' | 'rent',
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity,
        }
      })

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          total_amount: grandTotal,
          shipping_name: shipping.name,
          shipping_phone: shipping.phone,
          shipping_address: shipping.address,
          shipping_province: shipping.province,
          shipping_district: shipping.district,
          shipping_subdistrict: shipping.subdistrict,
          shipping_zip: shipping.zip,
          note: note || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderItems.map((item) => ({
            order_id: order.id,
            ...item,
          }))
        )

      if (itemsError) throw itemsError

      for (const item of items) {
        if (item.type === 'rent' && item.rentalStart && item.rentalEnd) {
          const deposit = Number(item.product.deposit) || 0
          const { total: cost } = calcRentalPrice(item.product, item.rentalStart, item.rentalEnd)
          await createRental(supabase, {
            order_id: order.id,
            product_id: item.product.id,
            user_id: user.id,
            quantity: item.quantity,
            start_date: item.rentalStart,
            end_date: item.rentalEnd,
            total_days: item.rentalDays ?? 1,
            rental_cost: cost,
            deposit_amount: deposit,
          })
        }
      }

      const fileExt = slipFile.name.split('.').pop()
      const filePath = `${user.id}/${order.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(filePath, slipFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(filePath)

      const { error: slipError } = await supabase
        .from('orders')
        .update({
          slip_url: publicUrl,
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
        .single()

      if (slipError) throw slipError

      if (items.some(i => i.type === 'rent')) {
        await supabase
          .from('rentals')
          .update({ deposit_paid: true, updated_at: new Date().toISOString() })
          .eq('order_id', order.id)
      }

      for (const item of items) {
        const field = item.type === 'buy' ? 'stock_qty' : 'rental_stock_qty'
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          p_product_id: item.product.id,
          p_field: field,
          p_qty: item.quantity,
        })
        if (stockError && stockError.message?.includes('function')) {
          const { data: prod } = await supabase
            .from('products')
            .select(field)
            .eq('id', item.product.id)
            .single()
          if (prod) {
            const current = Number(prod[field as keyof typeof prod]) || 0
            await supabase
              .from('products')
              .update({
                [field]: Math.max(0, current - item.quantity),
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.product.id)
          }
        }
      }

      clearCart()
      setDone({ orderId: order.id })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <CheckCircle size={48} className="mx-auto text-green-600" />
        <h1 className="text-2xl font-bold">{t('orderPlaced')}</h1>
        <p className="text-muted-foreground">
          {t('thankYou')}
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button asChild variant="outline">
            <Link href="/orders">{t('viewOrders')}</Link>
          </Button>
          <Button asChild>
            <Link href="/products">{t('goShopping')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t('cartEmpty')}</h1>
        <Button asChild>
          <Link href="/products">{t('goShopping')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('shippingAddress')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>{t('fullName')}</Label>
                <Input value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{t('phone')}</Label>
                <Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder="08X-XXX-XXXX" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{t('address')}</Label>
                <Textarea value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="House/ Building / Street" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('subdistrict')}</Label>
                <Input value={shipping.subdistrict} onChange={(e) => setShipping({ ...shipping, subdistrict: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('district')}</Label>
                <Input value={shipping.district} onChange={(e) => setShipping({ ...shipping, district: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('province')}</Label>
                <Input value={shipping.province} onChange={(e) => setShipping({ ...shipping, province: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('zip')}</Label>
                <Input value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('payment')}</h2>
            {storeSettings && (
              <div className="rounded-lg border p-4 space-y-3 text-sm">
                {storeSettings.promptpay_qr_url && (
                  <div>
                    <p className="font-medium mb-2">{t('promptpay')}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={storeSettings.promptpay_qr_url} alt="PromptPay QR" className="w-40 h-40 object-contain border rounded" />
                  </div>
                )}
                {storeSettings.bank_name && (
                  <div className="space-y-1">
                    <p className="font-medium">{t('bankTransfer')}</p>
                    <p>{t('bank')}: {storeSettings.bank_name}</p>
                    <p>{t('account')}: {storeSettings.bank_account}</p>
                    <p>{t('name')}: {storeSettings.bank_account_name}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{t('uploadSlip')} *</Label>
              <Input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)} />
              {slipFile && <p className="text-xs text-muted-foreground">{slipFile.name}</p>}
            </div>
          </section>

          <section className="space-y-2">
            <Label>{t('orderNote')}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('anyInstructions')} />
          </section>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h2 className="font-semibold">{t('orderSummary')}</h2>
            {items.map((item) => {
              const unitPrice = item.type === 'buy'
                ? item.product.price
                : calcRentalPrice(item.product, item.rentalStart!, item.rentalEnd!).total

              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.product.name_en}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.type.toUpperCase()} x{item.quantity}
                      {item.type === 'rent' && item.rentalStart && (
                        <span className="flex items-center gap-1 mt-0.5">
                          {item.rentalStart} → {item.rentalEnd}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-medium ml-2 shrink-0">
                    ฿{(unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              )
            })}
            {totalDeposit > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('depositIncluded')}</span>
                <span>฿{totalDeposit.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>{t('totalInclDeposit')}</span>
              <span>฿{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <Button className="w-full" size="lg" disabled={!valid || submitting} onClick={handleSubmit}>
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('processing')}</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> {t('placeOrder')} (฿{grandTotal.toLocaleString()})</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
