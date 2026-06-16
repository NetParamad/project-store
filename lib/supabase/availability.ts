import type { SupabaseClient } from '@supabase/supabase-js'

export async function getProductsAvailability(
  client: SupabaseClient,
  productIds: number[],
  startDate?: string,
  endDate?: string
): Promise<Map<number, boolean>> {
  if (productIds.length === 0) return new Map()

  const today = new Date()
  const start = startDate ?? today.toISOString().split('T')[0]
  const end =
    endDate ??
    new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [locksResult, rentalsResult, appointmentsResult] = await Promise.all([
    client
      .from('product_date_locks')
      .select('product_id')
      .in('product_id', productIds)
      .lte('lock_start_date', end)
      .gte('lock_end_date', start),
    client
      .from('rentals')
      .select('product_id')
      .in('product_id', productIds)
      .not('status', 'in', '("cancelled")')
      .lte('rental_start_date', end)
      .gte('rental_end_date', start),
    client
      .from('appointments')
      .select('product_id')
      .in('product_id', productIds)
      .not('status', 'in', '("cancelled")')
      .gte('appointment_date', start)
      .lte('appointment_date', end),
  ])

  const unavailableIds = new Set<number>()
  locksResult.data?.forEach((r) => unavailableIds.add(r.product_id))
  rentalsResult.data?.forEach((r) => unavailableIds.add(r.product_id))
  appointmentsResult.data?.forEach((r) => unavailableIds.add(r.product_id))

  const result = new Map<number, boolean>()
  productIds.forEach((id) => result.set(id, !unavailableIds.has(id)))
  return result
}
