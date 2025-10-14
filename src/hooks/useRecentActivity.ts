import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';

export interface ActivityLog {
  id: string;
  user_id: string;
  project_id: string;
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  user_email?: string;
  user_full_name?: string;
  actor_email?: string;
  occurred_at?: string;
  event_type?: string;
}

interface UseRecentActivityParams {
  limit?: number;
  offset?: number;
  event?: string;
  from?: string;
  to?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseRecentActivityReturn {
  activities: ActivityLog[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export const useRecentActivity = (params: UseRecentActivityParams = {}): UseRecentActivityReturn => {
  const {
    limit = 50,
    offset = 0,
    event,
    from,
    to,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = params;

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(offset);

  const fetchActivities = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit,
        offset: isLoadMore ? currentOffset : 0,
        ...(event && { event }),
        ...(from && { from }),
        ...(to && { to })
      };

      const response = await supabaseService.getActivities(params);
      
      if (response.success && response.data) {
        if (isLoadMore) {
          setActivities(prev => [...prev, ...response.data!]);
        } else {
          setActivities(response.data);
          setCurrentOffset(0);
        }
        
        // Check if there are more items to load
        setHasMore(response.data.length === limit);
      } else {
        setError(response.error || 'Failed to fetch activities');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit, currentOffset, event, from, to]);

  const refetch = useCallback(() => {
    return fetchActivities(false);
  }, [fetchActivities]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setCurrentOffset(prev => prev + limit);
    await fetchActivities(true);
  }, [hasMore, loading, limit, fetchActivities]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  return {
    activities,
    loading,
    error,
    refetch,
    hasMore,
    loadMore
  };
};

// Helper function to get user display name
export const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    // Use the more efficient getUserById instead of getUsers
    const response = await supabaseService.getUserById(userId);
    if (response.success && response.data) {
      return response.data.full_name || response.data.email || 'Unknown User';
    }
    return 'Unknown User';
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('ERR_ABORTED') || error.message.includes('aborted')) {
        console.warn('Request was aborted, using fallback for user:', userId);
        return 'User';
      }
      if (error.message.includes('404')) {
        console.warn('User not found:', userId);
        return 'Unknown User';
      }
    }
    console.error('Error fetching user name:', error);
    return 'Unknown User';
  }
};

// Helper function to format activity messages
export const formatActivityMessage = (activity: ActivityLog): string => {
  // Use the description field directly since it's already formatted
  return activity.description || 'Unknown activity.';
};

// Helper function to format time ago
export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};