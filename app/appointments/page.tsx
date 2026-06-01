'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserAppointments } from '@/lib/supabase/queries'
import { Loader2, CalendarDays, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { Appointment, AppointmentService, Product } from '@/lib/db.types'

const statusLabels: Record<string, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<(Appointment & { service: AppointmentService } & { product: Product | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/appointments')
        return
      }
      const data = await getUserAppointments(supabase)
      setAppointments(data)
      setLoading(false)
    }
    fetch()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">การนัดหมายของฉัน</h1>
        <Button asChild>
          <Link href="/appointments/book">จองนัดหมาย</Link>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <CalendarDays size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">ยังไม่มีการนัดหมาย</p>
          <Button asChild>
            <Link href="/products">เลือกซื้อสินค้า</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const serviceName = apt.service?.name_th || apt.service?.name_en || ''
            const productName = apt.product ? (apt.product.name_th || apt.product.name_en) : null
            return (
              <Card key={apt.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    #{apt.id} &middot; {apt.appointment_date} {apt.time_slot?.substring(0, 5)}
                  </p>
                  <p className="font-medium">{serviceName}{productName ? ` — ${productName}` : ''}</p>
                  <Badge className={`${statusColors[apt.status] || 'bg-gray-100 text-gray-800'} border-transparent`}>
                    {statusLabels[apt.status] || apt.status}
                  </Badge>
                </div>
                <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
                  <Link href={`/appointments/${apt.id}`}>
                    <Eye size={14} className="mr-1" /> ดู
                  </Link>
                </Button>
            </CardContent></Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
