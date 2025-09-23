import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/unifiedSupabase';

export interface RealtimeHealthStatus {
  isConnected: boolean;
  connectionState: 'connecting' | 'open' | 'closing' | 'closed';
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  latency: number | null;
  errors: string[];
}

export const useRealtimeHealth = () => {
  const [health, setHealth] = useState<RealtimeHealthStatus>({
    isConnected: false,
    connectionState: 'closed',
    lastHeartbeat: null,
    reconnectAttempts: 0,
    latency: null,
    errors: []
  });

  const channelRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    const testRealtimeConnection = () => {
      if (!mounted) return;

      try {
        // Clean up previous channel
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }

        const startTime = Date.now();
        const channel = supabase.channel(`health-check-${Date.now()}`);
        channelRef.current = channel;

        channel.subscribe((status: string) => {
          if (!mounted) return;

          const latency = Date.now() - startTime;

          if (status === 'SUBSCRIBED') {
            setHealth(prev => ({
              ...prev,
              isConnected: true,
              connectionState: 'open',
              lastHeartbeat: new Date(),
              latency,
              errors: []
            }));

            // Unsubscribe after successful test
            setTimeout(() => {
              if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
              }
            }, 1000);
          } else if (status === 'CHANNEL_ERROR') {
            setHealth(prev => ({
              ...prev,
              isConnected: false,
              connectionState: 'closed',
              reconnectAttempts: prev.reconnectAttempts + 1,
              errors: [...prev.errors, 'Channel connection failed']
            }));
          }
        });

        // Set timeout for connection test
        timeoutRef.current = setTimeout(() => {
          if (mounted && channelRef.current) {
            setHealth(prev => ({
              ...prev,
              isConnected: false,
              connectionState: 'closed',
              errors: [...prev.errors, 'Connection timeout']
            }));
            channelRef.current.unsubscribe();
            channelRef.current = null;
          }
        }, 5000);

      } catch (error) {
        if (mounted) {
          setHealth(prev => ({
            ...prev,
            isConnected: false,
            connectionState: 'closed',
            errors: [...prev.errors, `Connection error: ${error}`]
          }));
        }
      }
    };

    // Test connection every 30 seconds
    testRealtimeConnection();
    const interval = setInterval(testRealtimeConnection, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, []);

  const getHealthScore = (): number => {
    if (!health.isConnected) return 0;
    if (health.latency === null) return 50;
    if (health.latency < 100) return 100;
    if (health.latency < 300) return 75;
    if (health.latency < 500) return 50;
    return 25;
  };

  const getHealthStatus = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    const score = getHealthScore();
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const clearErrors = () => {
    setHealth(prev => ({ ...prev, errors: [] }));
  };

  return {
    health,
    getHealthScore,
    getHealthStatus,
    clearErrors
  };
};