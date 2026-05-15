'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { getUserRentals } from '@/lib/supabase/queries'
import { Loader2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Rental, Product } from '@/lib/db.types'

export default function UserRentalsPage() {
  const router = useRouter()
  const t = useTranslations()
  const [rentals, setRentals] = useState<(Rental & { product: Product })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/rentals')
        return
      }
      const data = await getUserRentals(supabase)
      setRentals(data)
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
      <h1 className="text-3xl font-bold">{t('rentals.title')}</h1>

      {rentals.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <CalendarDays size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{t('rentals.noRentals')}</p>
          <Button asChild>
            <Link href="/products">{t('rentals.browse')}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental) => (
            <div key={rental.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{rental.product?.name_en ?? `Product #${rental.product_id}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {rental.start_date} → {rental.end_date} ({rental.total_days} {t('rentals.days')})
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(rental.status)}`}>
                  {t(`status.${rental.status}`)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('rentals.cost')}: ฿{rental.rental_cost.toLocaleString()}</span>
                <span className="text-muted-foreground">{t('rentals.deposit')}: ฿{rental.deposit_amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reserved: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    returned: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    late: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
