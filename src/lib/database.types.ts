export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      users_profile: {
        Row: {
          id: string
          org_id: string | null
          first_name: string | null
          last_name: string | null
          role: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          org_id: string | null
          name: string
          plate_number: string
          type: string
          status: string | null
          make: string | null
          model: string | null
          year: number | null
          vin: string | null
          current_location: Json | null
          speed: number | null
          fuel_level: number | null
          battery_level: number | null
          odometer: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          name: string
          plate_number: string
          type: string
          status?: string | null
          make?: string | null
          model?: string | null
          year?: number | null
          vin?: string | null
          current_location?: Json | null
          speed?: number | null
          fuel_level?: number | null
          battery_level?: number | null
          odometer?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          name?: string
          plate_number?: string
          type?: string
          status?: string | null
          make?: string | null
          model?: string | null
          year?: number | null
          vin?: string | null
          current_location?: Json | null
          speed?: number | null
          fuel_level?: number | null
          battery_level?: number | null
          odometer?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          org_id: string | null
          first_name: string
          last_name: string
          license_number: string
          license_expiry: string | null
          phone: string | null
          email: string | null
          status: string | null
          current_vehicle_id: string | null
          rating: number | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          first_name: string
          last_name: string
          license_number: string
          license_expiry?: string | null
          phone?: string | null
          email?: string | null
          status?: string | null
          current_vehicle_id?: string | null
          rating?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          first_name?: string
          last_name?: string
          license_number?: string
          license_expiry?: string | null
          phone?: string | null
          email?: string | null
          status?: string | null
          current_vehicle_id?: string | null
          rating?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          org_id: string | null
          vehicle_id: string | null
          driver_id: string | null
          status: string | null
          start_location: string | null
          end_location: string | null
          start_time: string | null
          end_time: string | null
          distance: number | null
          estimated_duration: number | null
          actual_duration: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          vehicle_id?: string | null
          driver_id?: string | null
          status?: string | null
          start_location?: string | null
          end_location?: string | null
          start_time?: string | null
          end_time?: string | null
          distance?: number | null
          estimated_duration?: number | null
          actual_duration?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          vehicle_id?: string | null
          driver_id?: string | null
          status?: string | null
          start_location?: string | null
          end_location?: string | null
          start_time?: string | null
          end_time?: string | null
          distance?: number | null
          estimated_duration?: number | null
          actual_duration?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          org_id: string | null
          vehicle_id: string | null
          title: string
          description: string | null
          status: string | null
          priority: string | null
          cost: number | null
          scheduled_date: string | null
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          vehicle_id?: string | null
          title: string
          description?: string | null
          status?: string | null
          priority?: string | null
          cost?: number | null
          scheduled_date?: string | null
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          vehicle_id?: string | null
          title?: string
          description?: string | null
          status?: string | null
          priority?: string | null
          cost?: number | null
          scheduled_date?: string | null
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fuel_logs: {
        Row: {
          id: string
          org_id: string | null
          vehicle_id: string | null
          driver_id: string | null
          date: string | null
          gallons: number
          cost: number
          odometer: number | null
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          vehicle_id?: string | null
          driver_id?: string | null
          date?: string | null
          gallons: number
          cost: number
          odometer?: number | null
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          vehicle_id?: string | null
          driver_id?: string | null
          date?: string | null
          gallons?: number
          cost?: number
          odometer?: number | null
          location?: string | null
          created_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          org_id: string | null
          vehicle_id: string | null
          type: string
          severity: string | null
          message: string
          is_resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          vehicle_id?: string | null
          type: string
          severity?: string | null
          message: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          vehicle_id?: string | null
          type?: string
          severity?: string | null
          message?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
        }
      }
      geofences: {
        Row: {
          id: string
          org_id: string | null
          name: string
          type: string | null
          coordinates: Json
          color: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          name: string
          type?: string | null
          coordinates: Json
          color?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          name?: string
          type?: string | null
          coordinates?: Json
          color?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          org_id: string | null
          title: string
          type: string | null
          entity_type: string | null
          entity_id: string | null
          file_url: string
          expiry_date: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          title: string
          type?: string | null
          entity_type?: string | null
          entity_id?: string | null
          file_url: string
          expiry_date?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          title?: string
          type?: string | null
          entity_type?: string | null
          entity_id?: string | null
          file_url?: string
          expiry_date?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
