import { useState, useEffect, useRef } from 'react';

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
    errors: ['Realtime monitoring disabled']
  });

  const heartbeatRef = useRef<Date | null>(null);
  const latencyRef = useRef<number | null>(null);
  const reconnectCountRef = useRef(0);

  useEffect(() => {
    // DISABLED: Realtime health monitoring to prevent ChannelRateLimitReached
    console.warn('Realtime health monitoring is temporarily disabled');
    void heartbeatRef; void latencyRef; void reconnectCountRef; void setHealth;
    return () => {};
  }, []);

  const getHealthScore = (): number => {
    // Return a fixed low score since monitoring is disabled
    return 0;
  };

  const getHealthStatus = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    return 'poor';
  };

  const clearErrors = () => {
    // No-op since monitoring is disabled
  };

  return {
    health,
    getHealthScore,
    getHealthStatus,
    clearErrors
  };
};