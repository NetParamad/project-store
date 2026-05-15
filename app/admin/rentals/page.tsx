'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllRentals } from '@/lib/supabase/queries'
import { Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Rental, Product } from '@/lib/db.types'

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  reserved: 'Reserved',
  picked_up: 'Picked Up',
  returned: 'Returned',
  completed: 'Completed',
  late: 'Late',
  cancelled: 'Cancelled',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reserved: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  returned: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  late: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState<(Rental & { product: Product })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getAllRentals(supabase)
      setRentals(data)
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rentals</h1>
        <p className="text-muted-foreground">Manage product rentals</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium">#</th>
                <th className="p-3 font-medium">Product</th>
                <th className="p-3 font-medium">Dates</th>
                <th className="p-3 font-medium">Days</th>
                <th className="p-3 font-medium">Cost</th>
                <th className="p-3 font-medium">Deposit</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">#{rental.id}</td>
                  <td className="p-3">{rental.product?.name_en ?? `Product #${rental.product_id}`}</td>
                  <td className="p-3 text-xs">
                    {rental.start_date} → {rental.end_date}
                    {rental.actual_return_date && (
                      <><br />Returned: {rental.actual_return_date}</>
                    )}
                  </td>
                  <td className="p-3">{rental.total_days}</td>
                  <td className="p-3 font-medium">฿{rental.rental_cost.toLocaleString()}</td>
                  <td className="p-3 text-xs">
                    ฿{rental.deposit_amount.toLocaleString()}
                    {rental.deposit_paid && !rental.deposit_returned && (
                      <span className="ml-1 text-yellow-600">(pending)</span>
                    )}
                    {rental.deposit_returned && (
                      <span className="ml-1 text-green-600">(returned)</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[rental.status]}`}>
                      {statusLabel[rental.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/rentals/${rental.id}`}><Eye size={14} className="mr-1" /> Manage</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {rentals.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">No rentals yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
