'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useField } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { getAllAppointments } from '@/lib/supabase/queries'
import { Loader2, CalendarDays, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { Appointment, AppointmentService, Product } from '@/lib/db.types'

export default function AdminAppointmentsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const [appointments, setAppointments] = useState<(Appointment & { service: AppointmentService } & { product: Product | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getAllAppointments(supabase)
      setAppointments(data)
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <CalendarDays size={48} className="mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">{t('appointments.noAppointments')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('admin.navigation.appointments')}</h1>
      <Card>
        <CardContent className="p-0">
        <Table style={{ minWidth: 750 }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium">ID</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.appointments.customer')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.appointments.service')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.appointments.date')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.appointments.time')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.appointments.status')}</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => {
              const serviceName = useField(locale, apt.service?.name_th, apt.service?.name_en)
              const customerName = apt.phone || '-'
              return (
                <TableRow key={apt.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="px-4 py-3">#{apt.id}</TableCell>
                  <TableCell className="px-4 py-3">{customerName}</TableCell>
                  <TableCell className="px-4 py-3">{serviceName}</TableCell>
                  <TableCell className="px-4 py-3">{apt.appointment_date}</TableCell>
                  <TableCell className="px-4 py-3">{apt.time_slot?.substring(0, 5)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={`${statusColor(apt.status)} border-transparent`}>
                      {t('appointments.' + apt.status + 'Status') || t('status.' + apt.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/appointments/${apt.id}`}>
                        {t('admin.orders.view')} <ChevronRight size={14} className="ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
