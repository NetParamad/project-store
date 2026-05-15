'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRental, createNotification } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
import type { Rental, Product } from '@/lib/db.types'

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'returned', label: 'Returned' },
  { value: 'completed', label: 'Completed' },
  { value: 'late', label: 'Late' },
  { value: 'cancelled', label: 'Cancelled' },
]

function calcLateFee(rental: Rental & { product: Product }, returnDate: string) {
  const end = new Date(rental.end_date)
  const actual = new Date(returnDate)
  if (actual <= end) return 0
  const overdueDays = Math.ceil((actual.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))
  const rate = rental.late_fee_per_day || Math.round((rental.rental_cost / rental.total_days) * 0.5 * 100) / 100
  return Math.round(overdueDays * rate * 100) / 100
}

export default function AdminRentalDetailPage() {
  const params = useParams()
  const [rental, setRental] = useState<(Rental & { product: Product }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [newStatus, setNewStatus] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [depositReturned, setDepositReturned] = useState(false)
  const [lateFee, setLateFee] = useState('0')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getRental(supabase, Number(params.id))
      setRental(data)
      if (data) {
        setNewStatus(data.status)
        const today = new Date().toISOString().split('T')[0]
        setReturnDate(data.actual_return_date ?? today)
        setDepositReturned(data.deposit_returned)
        setLateFee(String(data.total_late_fee))
        setNotes(data.notes ?? '')
      }
      setLoading(false)
    }
    fetch()
  }, [params.id])

  const handleUpdate = async () => {
    if (!rental) return
    setSaving(true)
    setMessage('')

    try {
      const supabase = createClient()

      const autoLateFee = calcLateFee(rental, returnDate)
      const shownFee = Number(lateFee) || 0
      const finalFee = Math.max(autoLateFee, shownFee)

      const input: {
        status: Rental['status']
        actual_return_date?: string | null
        deposit_returned?: boolean
        total_late_fee?: number
        notes?: string
      } = {
        status: newStatus as Rental['status'],
        deposit_returned: depositReturned,
        total_late_fee: finalFee,
        notes,
      }

      if (newStatus === 'returned' || newStatus === 'completed' || newStatus === 'late') {
        input.actual_return_date = returnDate
      }

      const { error: updateError } = await supabase
        .from('rentals')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', rental.id)
        .select()
        .single()

      if (updateError) throw updateError

      const hadNotReturned = rental.status !== 'returned' && rental.status !== 'completed'
      const isNowReturned = newStatus === 'returned' || newStatus === 'completed'

      if (isNowReturned && hadNotReturned && rental.quantity > 0) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            rental_stock_qty: (rental.product?.rental_stock_qty ?? 0) + rental.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rental.product_id)

        if (stockError) throw stockError
      }

      const fresh = await getRental(supabase, rental.id)
      if (fresh) {
        setRental(fresh)
        setLateFee(String(fresh.total_late_fee))
        setDepositReturned(fresh.deposit_returned)
        setNewStatus(fresh.status)
        setReturnDate(fresh.actual_return_date ?? '')
        setNotes(fresh.notes ?? '')
      }

      try {
        await createNotification(supabase, {
          user_id: rental.user_id,
          type: 'rental_update',
          title: 'Rental status updated',
          message: `Rental #${rental.id} for ${rental.product?.name_en ?? `#${rental.product_id}`} is now "${newStatus}"`,
          link: `/orders/${rental.order_id}`,
        })
      } catch {}

      setMessage(`Rental updated. Fee: ฿${finalFee.toLocaleString()}${autoLateFee > 0 && shownFee === 0 ? ` (auto-calculated from ${autoLateFee})` : ''}`)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!rental) return null

  const autoFee = returnDate ? calcLateFee(rental, returnDate) : 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/rentals"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Rental #{rental.id}</h1>
          <p className="text-sm text-muted-foreground">
            Product: {rental.product?.name_en ?? `#${rental.product_id}`}
          </p>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.startsWith('Rental updated') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-destructive/10 text-destructive'}`}>
          {message}
        </div>
      )}

      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Manage Rental</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Actual Return Date</Label>
            <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Late Fee (฿)</Label>
            <Input type="number" min="0" step="0.01" value={lateFee} onChange={(e) => setLateFee(e.target.value)} />
            {autoFee > 0 && Number(lateFee) === 0 && (
              <p className="text-xs text-amber-600">Auto: ฿{autoFee.toLocaleString()} (overdue)</p>
            )}
          </div>
          <div className="space-y-1.5 flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={depositReturned} onChange={(e) => setDepositReturned(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">Deposit Returned</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <Button onClick={handleUpdate} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Rental'}
        </Button>
      </div>

      <section className="rounded-lg border p-4 space-y-2 text-sm">
        <h2 className="font-semibold">Rental Details</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Order #</span>
            <p className="font-medium">#{rental.order_id}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Product</span>
            <p className="font-medium">{rental.product?.name_en ?? `#${rental.product_id}`}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Quantity</span>
            <p className="font-medium">{rental.quantity}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Period</span>
            <p className="font-medium">{rental.start_date} → {rental.end_date}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Days</span>
            <p className="font-medium">{rental.total_days}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Rental Cost</span>
            <p className="font-medium">฿{rental.rental_cost.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Deposit</span>
            <p className="font-medium">
              ฿{rental.deposit_amount.toLocaleString()}
              {rental.deposit_paid ? ' (paid)' : ' (not paid)'}
              {rental.deposit_returned && ' — returned'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Late Fee</span>
            <p className="font-medium">฿{rental.total_late_fee.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium capitalize">{rental.status}</p>
          </div>
        </div>
      </section>

      {rental.notes && (
        <section className="rounded-lg border p-4 text-sm">
          <h2 className="font-semibold mb-1">Notes</h2>
          <p className="text-muted-foreground">{rental.notes}</p>
        </section>
      )}
    </div>
  )
}
