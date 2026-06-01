'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAppointment } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { Appointment, AppointmentService, Product } from '@/lib/db.types'

const statusSteps = ['pending', 'confirmed', 'completed']

const statusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

export default function AppointmentDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AppointmentDetailContent />
    </Suspense>
  )
}

function AppointmentDetailContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [appointment, setAppointment] = useState<(Appointment & { service: AppointmentService } & { product: Product | null }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/appointments')
        return
      }
      const data = await getAppointment(supabase, Number(params.id))
      if (!data || data.user_id !== user.id) {
        router.push('/appointments')
        return
      }
      setAppointment(data)
      setLoading(false)
    }
    fetch()
  }, [router, params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!appointment) return null

  const isCancelled = appointment.status === 'cancelled'
  const currentStep = statusSteps.indexOf(appointment.status)
  const serviceName = appointment.service?.name_th || appointment.service?.name_en || ''
  const productName = appointment.product ? (appointment.product.name_th || appointment.product.name_en) : null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={searchParams.get('from') === 'admin' ? '/admin/appointments' : '/appointments'}>
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">รายละเอียดการนัดหมาย</h1>
          <p className="text-sm text-muted-foreground">
            #{appointment.id} &middot; {appointment.appointment_date} {appointment.time_slot?.substring(0, 5)} &middot; {serviceName}
          </p>
        </div>
      </div>

      {isCancelled ? (
        <Card className="bg-red-50 border-red-200 text-center text-red-700 font-medium">
          <CardContent className="p-4">
            การนัดหมายนี้ถูกยกเลิกแล้ว
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
                {statusLabels[step]}
              </span>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3 text-sm">
        <h2 className="font-semibold">รายละเอียดการนัดหมาย</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-muted-foreground">บริการ</span>
            <p className="font-medium">{serviceName}</p>
          </div>
          {productName && (
            <div>
              <span className="text-muted-foreground">สินค้า</span>
              <p className="font-medium">{productName}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">วันที่</span>
            <p className="font-medium">{appointment.appointment_date}</p>
          </div>
          <div>
            <span className="text-muted-foreground">เวลา</span>
            <p className="font-medium">{appointment.time_slot?.substring(0, 5)}</p>
          </div>
          {appointment.phone && (
            <div>
              <span className="text-muted-foreground">เบอร์โทร</span>
              <p className="font-medium">{appointment.phone}</p>
            </div>
          )}
        </div>
      </CardContent></Card>

      {appointment.notes && (
        <Card>
          <CardContent className="p-4 text-sm space-y-1">
          <h2 className="font-semibold mb-1">หมายเหตุ</h2>
          <p className="text-muted-foreground">{appointment.notes}</p>
        </CardContent></Card>
      )}
    </div>
  )
}
