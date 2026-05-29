'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useField } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { getAppointment } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import type { Appointment, AppointmentService, Product } from '@/lib/db.types'

const statusSteps = ['pending', 'confirmed', 'completed']

export default function AdminAppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const [appointment, setAppointment] = useState<(Appointment & { service: AppointmentService } & { product: Product | null }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getAppointment(supabase, Number(params.id))
      if (!data) {
        router.push('/admin/appointments')
        return
      }
      setAppointment(data)
      setLoading(false)
    }
    fetch()
  }, [params.id, router])

  async function handleStatusChange(newStatus: Appointment['status']) {
    if (!appointment) return
    setUpdating(true)
    try {
      const { updateAppointmentStatus } = await import('@/lib/supabase/queries')
      const supabase = createClient()
      await updateAppointmentStatus(supabase, appointment.id, { status: newStatus })
      setAppointment({ ...appointment, status: newStatus })
    } catch (err) {
      console.error(err)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!appointment) return null

  const isCancelled = appointment.status === 'cancelled'
  const currentStep = statusSteps.indexOf(appointment.status)
  const serviceName = useField(locale, appointment.service?.name_th, appointment.service?.name_en)
  const productName = appointment.product ? useField(locale, appointment.product.name_th, appointment.product.name_en) : null

  const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled']

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/appointments"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('admin.appointmentDetail.title')} #{appointment.id}</h1>
          <p className="text-sm text-muted-foreground">{serviceName}</p>
        </div>
      </div>

      {isCancelled ? (
        <Card className="bg-red-50 border-red-200 text-center text-red-700 font-medium">
          <CardContent className="p-4">
            {t('appointments.cancelled')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {statusSteps.map((step, idx) => (
            <div key={step} className="flex items-center gap-3">
              {idx < currentStep ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              ) : idx === currentStep ? (
                <Circle className="w-5 h-5 text-primary shrink-0" fill="currentColor" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
              )}
              <span className={idx <= currentStep ? 'font-medium' : 'text-muted-foreground'}>
                {t('appointments.' + step + 'Status') || t('status.' + step)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{t('admin.appointmentDetail.updateStatus')}</span>
        <Select value={appointment.status} onValueChange={handleStatusChange} disabled={updating}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>
                {t('appointments.' + s + 'Status') || t('status.' + s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {updating && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3 text-sm">
        <h2 className="font-semibold">{t('admin.appointmentDetail.details')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-muted-foreground">{t('admin.appointmentDetail.service')}</span>
            <p className="font-medium">{serviceName}</p>
          </div>
          {productName && (
            <div>
              <span className="text-muted-foreground">{t('admin.appointmentDetail.product')}</span>
              <p className="font-medium">{productName}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">{t('admin.appointmentDetail.customer')}</span>
            <p className="font-medium">{appointment.phone || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('admin.appointmentDetail.date')}</span>
            <p className="font-medium">{appointment.appointment_date}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('admin.appointmentDetail.time')}</span>
            <p className="font-medium">{appointment.time_slot?.substring(0, 5)}</p>
          </div>
          {appointment.phone && (
            <div>
              <span className="text-muted-foreground">{t('admin.appointmentDetail.phone')}</span>
              <p className="font-medium">{appointment.phone}</p>
            </div>
          )}
        </div>
      </CardContent></Card>

      {appointment.notes && (
        <Card>
          <CardContent className="p-4 text-sm space-y-1">
          <h2 className="font-semibold mb-1">{t('admin.appointmentDetail.notes')}</h2>
          <p className="text-muted-foreground">{appointment.notes}</p>
        </CardContent></Card>
      )}
    </div>
  )
}
