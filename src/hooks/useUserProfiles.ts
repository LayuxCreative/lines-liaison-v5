import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface UseUserProfilesOptions {
  excludeCurrentUser?: boolean;
  currentUserId?: string;
  includeOffline?: boolean;
  realtime?: boolean;
}

interface UseUserProfilesReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  onlineCount: number;
  totalCount: number;
}

export const useUserProfiles = (options: UseUserProfilesOptions = {}): UseUserProfilesReturn => {
  const {
    excludeCurrentUser = false,
    currentUserId,
    includeOffline = true,
    realtime = true
  } = options;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select('*');

      // Exclude current user if requested
      if (excludeCurrentUser && currentUserId) {
        query = query.neq('id', currentUserId);
      }

      // Filter by online status if requested
      if (!includeOffline) {
        query = query.eq('status', 'available');
      }

      const { data, error: fetchError } = await query.order('full_name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching user profiles:', fetchError);
        setError(fetchError.message);
        return;
      }

      setUsers(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user profiles';
      console.error('Error fetching user profiles:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [excludeCurrentUser, currentUserId, includeOffline]);

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription if enabled
    if (realtime) {
      const subscription = supabase
        .channel('user-profiles')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('User profile change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newUser = payload.new as User;
              if (!excludeCurrentUser || newUser.id !== currentUserId) {
                setUsers(prev => [...prev, newUser].sort((a, b) => 
                  (a.full_name || a.email).localeCompare(b.full_name || b.email)
                ));
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedUser = payload.new as User;
              setUsers(prev => prev.map(user => 
                user.id === updatedUser.id ? updatedUser : user
              ));
            } else if (payload.eventType === 'DELETE') {
              const deletedUser = payload.old as User;
              setUsers(prev => prev.filter(user => user.id !== deletedUser.id));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchUsers, realtime, excludeCurrentUser, currentUserId]);

  // Count online users based on is_online field or status
  const onlineCount = users.filter(user => 
    user.is_online || user.status === 'available'
  ).length;
  const totalCount = users.length;

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    onlineCount,
    totalCount
  };
};