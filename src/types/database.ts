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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
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
      user_roles: {
        Row: {
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          role_id?: string
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          source: string
          destination: string
          vehicle_id: string
          driver_id: string
          cargo_weight: number
          planned_distance: number
          final_odometer: number | null
          fuel_consumed: number | null
          revenue: number | null
          status: 'draft' | 'dispatched' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
          dispatched_at: string | null
          completed_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          source: string
          destination: string
          vehicle_id: string
          driver_id: string
          cargo_weight: number
          planned_distance: number
          final_odometer?: number | null
          fuel_consumed?: number | null
          revenue?: number | null
          status?: 'draft' | 'dispatched' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
          dispatched_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          source?: string
          destination?: string
          vehicle_id?: string
          driver_id?: string
          cargo_weight?: number
          planned_distance?: number
          final_odometer?: number | null
          fuel_consumed?: number | null
          revenue?: number | null
          status?: 'draft' | 'dispatched' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
          dispatched_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
      }
      trip_history: {
        Row: {
          id: string
          trip_id: string
          previous_status: 'draft' | 'dispatched' | 'completed' | 'cancelled' | null
          new_status: 'draft' | 'dispatched' | 'completed' | 'cancelled'
          changed_by: string | null
          changed_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          previous_status?: 'draft' | 'dispatched' | 'completed' | 'cancelled' | null
          new_status: 'draft' | 'dispatched' | 'completed' | 'cancelled'
          changed_by?: string | null
          changed_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          previous_status?: 'draft' | 'dispatched' | 'completed' | 'cancelled' | null
          new_status?: 'draft' | 'dispatched' | 'completed' | 'cancelled'
          changed_by?: string | null
          changed_at?: string
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      vehicle_status: 'available' | 'on_trip' | 'in_shop' | 'retired'
      driver_status: 'available' | 'on_trip' | 'off_duty' | 'suspended'
      trip_status: 'draft' | 'dispatched' | 'completed' | 'cancelled'
      maintenance_status: 'pending' | 'active' | 'completed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
