import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Database } from './database.types';

type TableName = keyof Database['public']['Tables'];

const generateMockId = () => Math.random().toString(36).substring(2, 11);

export function useSupabaseInsert<T extends { id?: string }>(tableName: TableName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Omit<T, 'id'> | Partial<T>): Promise<T> => {
      if (!isSupabaseConfigured || !supabase) {
        const mockItem = { id: generateMockId(), created_at: new Date().toISOString(), ...newItem } as unknown as T;
        return mockItem;
      }

      const { data, error } = await supabase.from(tableName).insert([newItem]).select().single();
      if (error) {
        console.error(`Insert Error (${tableName}):`, error);
        alert(`Supabase Error: ${error.message || JSON.stringify(error)}`);
        throw error;
      }
      return data as T;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([tableName], (oldData: T[] | undefined) => {
        if (!oldData) return [data];
        return [...oldData, data];
      });
    },
  });
}

export function useSupabaseUpdate<T extends { id: string }>(tableName: TableName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedItem: Partial<T> & { id: string }): Promise<T> => {
      if (!isSupabaseConfigured || !supabase) {
        return { ...updatedItem, updated_at: new Date().toISOString() } as unknown as T;
      }

      const { data, error } = await supabase.from(tableName).update(updatedItem).eq('id', updatedItem.id).select().single();
      if (error) {
        console.error(`Update Error (${tableName}):`, error);
        alert(`Supabase Error: ${error.message || JSON.stringify(error)}`);
        throw error;
      }
      return data as T;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([tableName], (oldData: T[] | undefined) => {
        if (!oldData) return [data];
        return oldData.map((item) => (item.id === data.id ? { ...item, ...data } : item));
      });
    },
  });
}

export function useSupabaseDelete<T extends { id: string }>(tableName: TableName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      if (!isSupabaseConfigured || !supabase) {
        return id;
      }

      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
        console.error(`Delete Error (${tableName}):`, error);
        alert(`Supabase Error: ${error.message || JSON.stringify(error)}`);
        throw error;
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData([tableName], (oldData: T[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter((item) => item.id !== id);
      });
    },
  });
}
