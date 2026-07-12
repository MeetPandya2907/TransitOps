import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Driver = Database['public']['Tables']['drivers']['Row']

export const FleetService = {
  async getAvailableVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, registration_number, name_model')
      .eq('status', 'available')
      
    if (error) throw error
    return data
  },
  
  async getAvailableDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, name')
      .eq('status', 'available')
      
    if (error) throw error
    return data
  }
}
