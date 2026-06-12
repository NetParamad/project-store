'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRentableProducts } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft, ClipboardList, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import type { Product, ProductImage } from '@/lib/db.types'

export default function NewRentalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewRentalContent />
    </Suspense>
  )
}

function NewRentalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectProductSlug = searchParams.get('product')

  const [products, setProducts] = useState<(Product & { images: ProductImage[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedProductId, setSelectedProductId] = useState('')
  const [rentalStart, setRentalStart] = useState('')
  const [rentalEnd, setRentalEnd] = useState('')
  const [notes, setNotes] = useState('')

  const selectedProduct = products.find(p => p.id.toString() === selectedProductId)

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth?redirect=/rentals/new')
          return
        }
        const rentable = await getRentableProducts(supabase)
        const available = rentable.filter(p => !p.is_locked)
        setProducts(available)

        if (preselectProductSlug) {
          const matched = available.find(p => p.slug === preselectProductSlug)
          if (matched) {
            setSelectedProductId(matched.id.toString())
            setLoading(false)
            return
          }
        }

        if (available.length > 0) {
          setSelectedProductId(available[0].id.toString())
        }
      } catch (err) {
        console.error('Failed to load rental data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [router, preselectProductSlug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct || !rentalStart || !rentalEnd) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const days = Math.ceil((new Date(rentalEnd).getTime() - new Date(rentalStart).getTime()) / (1000 * 60 * 60 * 24))
      if (days > 30) {
        alert('ระยะเวลาเช่าสูงสุด 30 วัน')
        setSubmitting(false)
        return
      }

      const { isProductAvailable, createRental, createNotification } = await import('@/lib/supabase/queries')
      const available = await isProductAvailable(supabase, selectedProduct.id, rentalStart, rentalEnd)
      if (!available) {
        alert('ไม่สามารถเช่าได้ในช่วงวันที่เลือก เนื่องจากชุดนี้ถูกล็อควันจองในวันดังกล่าว')
        setSubmitting(false)
        return
      }

      const rental = await createRental(supabase, {
        user_id: user.id,
        product_id: selectedProduct.id,
        rental_start_date: rentalStart,
        rental_end_date: rentalEnd,
        rental_price: Number(selectedProduct.rental_price),
        deposit_amount: Number(selectedProduct.rental_deposit),
        notes: notes || undefined,
      })

      try {
        await createNotification(supabase, {
          user_id: user.id,
          type: 'general',
          title: 'คำขอเช่าชุดสำเร็จ!',
          message: `คุณได้ขอเช่า ${selectedProduct.name} ตั้งแต่วันที่ ${new Date(rentalStart + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} ถึง ${new Date(rentalEnd + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          link: '/rentals',
        })
      } catch {} // best-effort

      router.push(`/rentals/${rental.id}`)
    } catch (err) {
      console.error(err)
      alert('ไม่สามารถสร้างคำขอเช่าได้')
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

  const days = rentalStart && rentalEnd
    ? Math.max(0, Math.ceil((new Date(rentalEnd).getTime() - new Date(rentalStart).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/rentals"><ArrowLeft size={18} /></Link>
        </Button>
        <h1 className="text-2xl font-bold">เช่าชุด</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>เลือกสินค้า <span className="text-destructive">*</span></Label>
            <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v); setRentalStart(''); setRentalEnd('') }}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
              <p className="font-medium"><ClipboardList size={16} className="inline mr-1" />ข้อมูลสินค้า</p>
              <div className="grid grid-cols-2 gap-y-1 text-muted-foreground">
                <span>ราคาเช่า: <b className="text-foreground">฿{Number(selectedProduct.rental_price).toLocaleString()}</b></span>
                <span>ค่าประกัน: <b className="text-foreground">฿{Number(selectedProduct.rental_deposit).toLocaleString()}</b></span>
              </div>
            </div>
          )}

          {selectedProduct && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>วันที่เริ่มเช่า <span className="text-destructive">*</span></Label>
                <Input type="date" value={rentalStart} onChange={(e) => setRentalStart(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="space-y-1">
                <Label>วันที่สิ้นสุดเช่า <span className="text-destructive">*</span></Label>
                <Input type="date" value={rentalEnd} onChange={(e) => setRentalEnd(e.target.value)}
                  min={rentalStart || new Date().toISOString().split('T')[0]} required />
              </div>
            </div>
          )}

          {selectedProduct && rentalStart && rentalEnd && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-1.5 text-sm">
              <p className="font-medium text-purple-800"><Wallet size={16} className="inline mr-1" />สรุปค่าใช้จ่าย</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-purple-700">
                <span>จำนวนวัน: {days} วัน</span>
                <span>ราคาเช่า: ฿{Number(selectedProduct.rental_price).toLocaleString()} /วัน</span>
                <span>ค่าประกัน: ฿{Number(selectedProduct.rental_deposit).toLocaleString()}</span>
                <span className="font-semibold text-purple-900">รวมทั้งสิ้น: ฿{(Number(selectedProduct.rental_price) * days + Number(selectedProduct.rental_deposit)).toLocaleString()}</span>
              </div>
              <p className="text-xs text-purple-500 mt-1">* ค่าประกันจะคืนเมื่อคืนชุดในสภาพดี</p>
            </div>
          )}
        </CardContent></Card>

        <Card>
          <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold">ข้อมูลเพิ่มเติม</h2>
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={3}
            />
          </div>
        </CardContent></Card>

        <Button
          type="submit"
          disabled={submitting || !selectedProductId || !rentalStart || !rentalEnd}
          className="w-full"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ยืนยันคำขอเช่า'}
        </Button>
      </form>
    </div>
  )
}
