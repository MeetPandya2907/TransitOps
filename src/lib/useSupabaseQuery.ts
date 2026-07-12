import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Database } from './database.types';

type TableName = keyof Database['public']['Tables'];

export function useSupabaseQuery<T>(
  tableName: TableName,
  fallbackData: T[],
  options?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [tableName],
    queryFn: async (): Promise<T[]> => {
      if (!isSupabaseConfigured || !supabase) {
        // Fallback to mock data if Supabase isn't configured
        return fallbackData;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Error fetching from ${tableName}:`, error);
        throw error;
      }

      // If data is empty and we have fallback data, we can optionally seed it
      // or just return the fallback for development ease if the DB is empty.
      // For now, if no data in DB, return empty array to reflect actual DB state,
      // but if the user wants mock data while the DB is unpopulated, we could return fallback.
      // Let's assume if it's configured, we trust the DB state.
      return data as T[];
    },
    ...options,
  });
}
