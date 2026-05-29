'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useField } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { getActiveAppointmentServices, getAppointmentsByDate, getBookableProducts } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft } from 'lucide-react'
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
import type { AppointmentService, Product, ProductImage } from '@/lib/db.types'

export default function BookAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const locale = useLocale()
  const preselectProductSlug = searchParams.get('product')

  const [services, setServices] = useState<AppointmentService[]>([])
  const [products, setProducts] = useState<(Product & { images: ProductImage[] })[]>([])
  const [occupiedSlots, setOccupiedSlots] = useState<{ time_slot: string; end_time: string; service_id: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('none')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const selectedService = services.find(s => s.id.toString() === selectedServiceId)
  const isTryOn = selectedService?.type === 'try_on'

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/appointments/book')
        return
      }
      const [svc, prods] = await Promise.all([
        getActiveAppointmentServices(supabase),
        getBookableProducts(supabase),
      ])
      setServices(svc)
      setProducts(prods)

      if (preselectProductSlug) {
        const matched = prods.find(p => p.slug === preselectProductSlug)
        if (matched) {
          setSelectedProductId(matched.id.toString())
          const tryOn = svc.find(s => s.type === 'try_on')
          if (tryOn) setSelectedServiceId(tryOn.id.toString())
          setLoading(false)
          return
        }
      }

      if (svc.length > 0) {
        setSelectedServiceId(svc[0].id.toString())
      }
      if (svc.length === 1) {
        setSelectedServiceId(svc[0].id.toString())
      }
      setLoading(false)
    }
    fetch()
  }, [router, preselectProductSlug])

  useEffect(() => {
    if (!selectedDate) return
    const fetch = async () => {
      const supabase = createClient()
      const slots = await getAppointmentsByDate(supabase, selectedDate)
      setOccupiedSlots(slots)
    }
    fetch()
  }, [selectedDate])

  function generateTimeSlots(): string[] {
    const allSlots: string[] = []
    for (let h = 9; h < 18; h++) {
      allSlots.push(`${h.toString().padStart(2, '0')}:00`)
    }
    return allSlots
  }

  function isSlotAvailable(slot: string): boolean {
    if (!selectedService) return true
    const slotEnd = addMinutes(slot, selectedService.duration_minutes)
    return !occupiedSlots.some(occ => {
      if (occ.service_id !== selectedService.id) return false
      return timesOverlap(slot, slotEnd, occ.time_slot, occ.end_time)
    })
  }

  function addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + mins
    return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
  }

  function timesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
    return a1 < b2 && a2 > b1
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService || !selectedDate || !selectedTime) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const endTime = addMinutes(selectedTime, selectedService.duration_minutes)
      const { createAppointment } = await import('@/lib/supabase/queries')
      await createAppointment(supabase, {
        user_id: user.id,
        service_id: selectedService.id,
        product_id: selectedProductId && selectedProductId !== 'none' ? parseInt(selectedProductId) : null,
        appointment_date: selectedDate,
        time_slot: selectedTime,
        end_time: endTime,
        phone: phone || undefined,
        notes: notes || undefined,
      })

      router.push('/appointments?booked=1')
    } catch (err) {
      console.error(err)
      alert('Failed to book appointment')
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

  const timeSlots = generateTimeSlots()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/appointments"><ArrowLeft size={18} /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('appointments.book')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>{t('appointments.pickService')} <span className="text-destructive">*</span></Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder={t('appointments.selectService')} />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {locale === 'th' ? s.name_th : s.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isTryOn && (
            <div className="space-y-2">
              <Label>{t('appointments.selectProduct')}</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('appointments.selectProduct')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {locale === 'th' ? p.name_th : p.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('appointments.selectDate')} <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime('') }}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {selectedDate && (
            <div className="space-y-2">
              <Label>{t('appointments.selectTime')} <span className="text-destructive">*</span></Label>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('appointments.noSlots')}</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map(slot => {
                    const available = isSlotAvailable(slot)
                    return (
                      <Button
                        key={slot}
                        type="button"
                        disabled={!available}
                        variant="outline"
                        onClick={() => setSelectedTime(slot)}
                        className={`text-sm ${
                          selectedTime === slot
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground'
                            : !available
                              ? 'bg-muted text-muted-foreground/50 border-muted'
                              : ''
                        }`}
                      >
                        {slot.substring(0, 5)}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent></Card>

        <Card>
          <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold">{t('appointments.info')}</h2>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('appointments.phone')} <span className="text-destructive">*</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('appointments.phoneHint')}
              required
              pattern="[0-9]{10}"
              title="กรุณากรอกเบอร์โทร 10 หลัก"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t('appointments.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('appointments.notesHint')}
              rows={3}
            />
          </div>
        </CardContent></Card>

        <Button type="submit" disabled={submitting || !selectedServiceId || !selectedDate || !selectedTime} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('appointments.confirm')}
        </Button>
      </form>
    </div>
  )
}
