import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useNotifications } from "../contexts/NotificationContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Global channel pool to prevent too many channels
const globalChannelPool = new Map<string, RealtimeChannel>();
const channelSubscribers = new Map<string, Set<string>>();
let subscriberCounter = 0;

// Rate limiting
// Remove unused constant
// Remove unused constant since it's not being used anywhere in the code

interface SubscriptionStatus {
  table: string;
  status: 'connected' | 'disconnected' | 'error';
  lastUpdate: Date;
  errorCount: number;
}

export const useRealtimeSubscription = () => {
  const { user } = useAuth();
  const { loadProjects, loadFiles, loadTasks } = useData();
  const { addNotification } = useNotifications();
  const subscriptionsRef = useRef<RealtimeChannel[]>([]);
  const subscriberIdRef = useRef<string>(`subscriber_${Date.now()}_${++subscriberCounter}`);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  const retryCountRef = useRef(0);
  
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    eventsPerMinute: 0,
    lastEventTime: null as Date | null
  });

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    const subscriberId = subscriberIdRef.current;
    const tables = ['projects', 'tasks', 'messages', 'notifications', 'activities'];
    
    const setupSubscriptions = async () => {
      try {
        const { supabase } = await import('../config/unifiedSupabase');
        
        for (const table of tables) {
          const channelKey = `${table}_${user.id}`;
          
          // Check if channel already exists
          if (globalChannelPool.has(channelKey)) {
            const existingChannel = globalChannelPool.get(channelKey)!;
            if (!channelSubscribers.has(channelKey)) {
              channelSubscribers.set(channelKey, new Set());
            }
            channelSubscribers.get(channelKey)!.add(subscriberId);
            subscriptionsRef.current.push(existingChannel);
            continue;
          }

          // Create new channel
          const channel = supabase
            .channel(channelKey)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: table,
                filter: table === 'projects' ? `team_members.cs.{${user.id}}` : undefined
              }, (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
                console.log(`Realtime update for ${table}:`, payload);
                
                // Update metrics
                setMetrics(prev => ({
                  ...prev,
                  totalEvents: prev.totalEvents + 1,
                  lastEventTime: new Date()
                }));

                // Handle different event types
                try {
                  switch (payload.eventType) {
                    case 'INSERT':
                      if (table === 'projects') {
                        loadProjects();
                      } else if (table === 'files') {
                        loadFiles();
                      } else if (table === 'tasks') {
                        loadTasks();
                      }
                      break;
                    case 'UPDATE':
                      if (table === 'projects') {
                        loadProjects();
                      } else if (table === 'files') {
                        loadFiles();
                      } else if (table === 'tasks') {
                        loadTasks();
                      }
                      break;
                    case 'DELETE':
                      if (table === 'projects') {
                        loadProjects();
                      } else if (table === 'files') {
                        loadFiles();
                      } else if (table === 'tasks') {
                        loadTasks();
                      }
                      break;
                  }

                  // Add notification for important updates
                  if (payload.eventType === 'INSERT' && table === 'tasks') {
                      addNotification({
                        title: 'New Task Created',
                        message: 'A new task has been assigned to your project',
                        type: 'info',
                        userId: user.id
                      });
                    }
                } catch (error) {
                  console.error(`Error handling realtime update for ${table}:`, error);
                }

                // Update subscription status
                setSubscriptionStatus(prev =>
                  prev.map(status =>
                    status.table === table 
                      ? { ...status, lastUpdate: new Date(), errorCount: 0 }
                      : status
                  )
                );
              }
            )
            .subscribe((status: string) => {
              console.log(`Subscription status for ${table}:`, status);
              
              setSubscriptionStatus(prev => {
                const existing = prev.find(s => s.table === table);
                const newStatus = {
                  table,
                  status: status === 'SUBSCRIBED' ? 'connected' as const : 
                          status === 'CHANNEL_ERROR' ? 'error' as const :
                          'disconnected' as const,
                  lastUpdate: new Date(),
                  errorCount: existing?.errorCount || 0
                };
                
                if (existing) {
                  return prev.map(s => s.table === table ? newStatus : s);
                } else {
                  return [...prev, newStatus];
                }
              });
              
              if (status === 'SUBSCRIBED') {
                setIsConnected(true);
                console.log(`Successfully subscribed to ${table} updates`);
              } else if (status === 'CHANNEL_ERROR') {
                console.error(`Channel error for ${table}`);
                setIsConnected(false);
              } else if (status === 'CLOSED') {
                console.warn(`Channel closed for ${table}`);
                setIsConnected(false);
              }
            });

          // Store channel in global pool
          globalChannelPool.set(channelKey, channel);
          if (!channelSubscribers.has(channelKey)) {
            channelSubscribers.set(channelKey, new Set());
          }
          channelSubscribers.get(channelKey)!.add(subscriberId);
          subscriptionsRef.current.push(channel);
        }
        
        retryCountRef.current = 0;
      } catch (error) {
        console.error('Error setting up Realtime subscriptions:', error);
        retryCountRef.current++;
        
        if (retryCountRef.current < maxRetries) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setupSubscriptions();
          }, 2000 * retryCountRef.current);
        }
      }
    };

    setupSubscriptions();

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach(channel => {
        const channelKey = Object.keys(globalChannelPool).find(
          key => globalChannelPool.get(key) === channel
        );
        
        if (channelKey && channelSubscribers.has(channelKey)) {
          const subscribers = channelSubscribers.get(channelKey)!;
          subscribers.delete(subscriberId);
          
          // If no more subscribers, remove the channel
          if (subscribers.size === 0) {
            channel.unsubscribe();
            globalChannelPool.delete(channelKey);
            channelSubscribers.delete(channelKey);
          }
        }
      });
      
      subscriptionsRef.current = [];
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, loadProjects, loadFiles, loadTasks, addNotification]);

  return {
    isConnected,
    subscriptionStatus,
    metrics,
    connectedTables: subscriptionStatus.filter(s => s.status === 'connected').length,
    totalTables: subscriptionStatus.length
  };
};
