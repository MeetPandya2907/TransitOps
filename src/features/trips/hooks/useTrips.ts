import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TripService } from '../services/trip.service'
import type { TripInsert } from '../services/trip.service'
import { FleetService } from '../services/fleet.service'

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: FleetService.getAvailableVehicles,
  })
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers', 'available'],
    queryFn: FleetService.getAvailableDrivers,
  })
}

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: TripService.getTrips,
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (trip: TripInsert) => TripService.createTrip(trip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useUpdateTripStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, updates }: { id: string, status: any, updates?: any }) => 
      TripService.updateTripStatus(id, status, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}
