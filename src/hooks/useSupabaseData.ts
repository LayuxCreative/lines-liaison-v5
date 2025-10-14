import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ActivityLog } from './useRecentActivity';

export interface SupabaseDataHook<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSupabaseData<T = Record<string, unknown>>(
  tableName: string,
  options?: {
    select?: string;
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
    filter?: { column: string; value: unknown; operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' };
  }
): SupabaseDataHook<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(tableName).select(options?.select || '*');

      // Apply filter
      if (options?.filter) {
        const { column, value, operator = 'eq' } = options.filter;
        switch (operator) {
          case 'eq':
            query = query.eq(column, value);
            break;
          case 'neq':
            query = query.neq(column, value);
            break;
          case 'gt':
            query = query.gt(column, value);
            break;
          case 'lt':
            query = query.lt(column, value);
            break;
          case 'gte':
            query = query.gte(column, value);
            break;
          case 'lte':
            query = query.lte(column, value);
            break;
        }
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? false 
        });
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData((result as T[]) || []);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName, JSON.stringify(options)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Specific hook for activities
export function useSupabaseActivities() {
  return useSupabaseData<ActivityLog>('activity_logs', {
    select: '*',
    limit: 50,
    orderBy: { column: 'created_at', ascending: false }
  });
}

// Specific hook for notifications
export function useSupabaseNotifications() {
  return useSupabaseData('notifications', {
    select: '*',
    limit: 20,
    orderBy: { column: 'created_at', ascending: false }
  });
}