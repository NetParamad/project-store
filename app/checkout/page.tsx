'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/components/cart-provider'
import { getStoreSettings } from '@/lib/supabase/queries'
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

  const valid = shipping.name && shipping.phone && shipping.address && shipping.province && shipping.district && shipping.subdistrict && shipping.zip && slipFile

  const handleSubmit = async () => {
    if (!valid || !user) return
    setSubmitting(true)
    setError('')

    try {
      const supabase = createClient()

      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        type: 'buy' as const,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }))

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalPrice,
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

      for (const item of items) {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          p_product_id: item.product.id,
          p_field: 'stock_qty',
          p_qty: item.quantity,
        })
        if (stockError && stockError.message?.includes('function')) {
          const { data: prod } = await supabase
            .from('products')
            .select('stock_qty')
            .eq('id', item.product.id)
            .single()
          if (prod) {
            const current = Number(prod.stock_qty) || 0
            await supabase
              .from('products')
              .update({
                stock_qty: Math.max(0, current - item.quantity),
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.product.id)
          }
        }
      }

      clearCart()

      try {
        const { createNotification } = await import('@/lib/supabase/queries')
        await createNotification(supabase, {
          user_id: user.id,
          type: 'order_update',
          title: 'คำสั่งซื้อใหม่',
          message: `คำสั่งซื้อ #${order.id} ของคุณถูกวางแล้ว`,
          link: `/orders/${order.id}`,
        })
      } catch {} // best-effort

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
        <h1 className="text-2xl font-bold">สั่งซื้อสำเร็จ!</h1>
        <p className="text-muted-foreground">
          ขอบคุณสำหรับคำสั่งซื้อ เราจะตรวจสอบการชำระเงินและยืนยันโดยเร็ว
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button asChild variant="outline">
            <Link href="/orders">ดูคำสั่งซื้อ</Link>
          </Button>
          <Button asChild>
            <Link href="/products">เลือกซื้อต่อ</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">ตะกร้าว่างเปล่า</h1>
        <Button asChild>
          <Link href="/products">เลือกซื้อต่อ</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-3xl font-bold">ชำระเงิน</h1>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">ที่อยู่จัดส่ง</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>ชื่อ-นามสกุล <span className="text-destructive">*</span></Label>
                <Input value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} placeholder="John Doe" required />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>เบอร์โทรศัพท์ <span className="text-destructive">*</span></Label>
                <Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder="08X-XXX-XXXX" required pattern="[0-9]{10}" title="กรุณากรอกเบอร์โทร 10 หลัก" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>ที่อยู่ <span className="text-destructive">*</span></Label>
                <Textarea value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="House/ Building / Street" required />
              </div>
              <div className="space-y-1.5">
                <Label>ตำบล <span className="text-destructive">*</span></Label>
                <Input value={shipping.subdistrict} onChange={(e) => setShipping({ ...shipping, subdistrict: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>อำเภอ <span className="text-destructive">*</span></Label>
                <Input value={shipping.district} onChange={(e) => setShipping({ ...shipping, district: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>จังหวัด <span className="text-destructive">*</span></Label>
                <Input value={shipping.province} onChange={(e) => setShipping({ ...shipping, province: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>รหัสไปรษณีย์ <span className="text-destructive">*</span></Label>
                <Input value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} required pattern="[0-9]{5}" title="กรุณากรอกรหัสไปรษณีย์ 5 หลัก" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">การชำระเงิน</h2>
            {storeSettings && (
              <Card><CardContent className="p-4 space-y-3 text-sm">
                {storeSettings.promptpay_qr_url && (
                  <div>
                    <p className="font-medium mb-2">พร้อมเพย์</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={storeSettings.promptpay_qr_url} alt="PromptPay QR" className="w-40 h-40 object-contain border rounded" />
                  </div>
                )}
                {storeSettings.bank_name && (
                  <div className="space-y-1">
                    <p className="font-medium">โอนเงินผ่านธนาคาร</p>
                    <p>ธนาคาร: {storeSettings.bank_name}</p>
                    <p>เลขบัญชี: {storeSettings.bank_account}</p>
                    <p>ชื่อบัญชี: {storeSettings.bank_account_name}</p>
                  </div>
                )}
              </CardContent></Card>
            )}

            <div className="space-y-1.5">
              <Label>อัปโหลดสลิปการโอนเงิน <span className="text-destructive">*</span></Label>
              <Input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)} />
              {slipFile && <p className="text-xs text-muted-foreground">{slipFile.name}</p>}
            </div>
          </section>

          <section className="space-y-2">
            <Label>หมายเหตุเพิ่มเติม (ไม่บังคับ)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="คำแนะนำพิเศษ..." />
          </section>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card><CardContent className="p-4 space-y-3">
            <h2 className="font-semibold">สรุปคำสั่งซื้อ</h2>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.product.name}</p>
                  <p className="text-muted-foreground text-xs">
                    BUY x{item.quantity}
                  </p>
                </div>
                <span className="font-medium ml-2 shrink-0">
                  ฿{(item.product.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>ยอดรวม</span>
              <span>฿{totalPrice.toLocaleString()}</span>
            </div>
          </CardContent></Card>

          <Button className="w-full" size="lg" disabled={!valid || submitting} onClick={handleSubmit}>
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังดำเนินการ...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> สั่งซื้อ (฿{totalPrice.toLocaleString()})</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
