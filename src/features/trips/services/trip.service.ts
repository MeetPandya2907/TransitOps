import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Trip = Database['public']['Tables']['trips']['Row']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type TripUpdate = Database['public']['Tables']['trips']['Update']

export const TripService = {
  async getTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        vehicles ( registration_number, name_model ),
        drivers ( name, license_number )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createTrip(trip: TripInsert) {
    const { data, error } = await supabase
      .from('trips')
      .insert(trip)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateTripStatus(
    id: string,
    status: Trip['status'],
    updates?: { final_odometer?: number; fuel_consumed?: number }
  ) {
    // Build the payload, including timestamp fields for traceability
    const payload: TripUpdate = { status, ...updates }

    if (status === 'cancelled') {
      payload.cancelled_at = new Date().toISOString()
    }
    // dispatched_at and completed_at are handled by the DB trigger

    const { data, error } = await supabase
      .from('trips')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
