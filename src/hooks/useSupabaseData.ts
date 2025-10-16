import { useState, useEffect, useCallback } from 'react';
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

  const { select, limit, orderBy, filter } = options || {};

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(tableName).select(select || '*');

      // Apply filter
      if (filter) {
        const { column, value, operator = 'eq' } = filter;
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
      if (orderBy) {
        query = query.order(orderBy.column, { 
          ascending: orderBy.ascending ?? false 
        });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
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
  }, [tableName, select, limit, orderBy, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Specific hook for activities
export function useSupabaseActivities() {
  return useSupabaseData<ActivityLog>('activities', {
    select: '*',
    limit: 50,
    orderBy: { column: 'timestamp', ascending: false }
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