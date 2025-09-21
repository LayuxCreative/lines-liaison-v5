import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastError: string | null;
  reconnectAttempts: number;
  responseTime: number;
  lastCheck: Date | null;
}

interface ConnectionMetrics {
  totalDisconnections: number;
  totalReconnections: number;
  averageResponseTime: number;
  uptime: number;
  lastDisconnection: Date | null;
}

export const useConnectionMonitor = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: true,
    isReconnecting: false,
    lastError: null,
    reconnectAttempts: 0,
    responseTime: 0,
    lastCheck: null
  });

  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    totalDisconnections: 0,
    totalReconnections: 0,
    averageResponseTime: 0,
    uptime: 0,
    lastDisconnection: null
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Health check function
  const checkHealth = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      const responseTime = Date.now() - startTime;
      
      const isHealthy = !error || error.code === 'PGRST116'; // PGRST116 is "no rows returned"
      
      setStatus(prev => ({
        ...prev,
        isConnected: isHealthy,
        lastError: isHealthy ? null : error?.message || 'Unknown error',
        responseTime,
        lastCheck: new Date()
      }));

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        averageResponseTime: (prev.averageResponseTime + responseTime) / 2
      }));

      return isHealthy;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        lastError: error instanceof Error ? error.message : 'Network error',
        responseTime,
        lastCheck: new Date()
      }));

      return false;
    }
  }, []);

  // Force reconnection
  const forceReconnect = useCallback(async (): Promise<boolean> => {
    setStatus(prev => ({ ...prev, isReconnecting: true, reconnectAttempts: 0 }));

    try {
      // Disconnect and reconnect realtime
      supabase.realtime.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      supabase.realtime.connect();

      // Wait for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      const isHealthy = await checkHealth();
      
      setStatus(prev => ({
        ...prev,
        isReconnecting: false,
        reconnectAttempts: 0
      }));

      if (isHealthy) {
        setMetrics(prev => ({
          ...prev,
          totalReconnections: prev.totalReconnections + 1
        }));
      }

      return isHealthy;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isReconnecting: false,
        lastError: error instanceof Error ? error.message : 'Reconnection failed'
      }));
      return false;
    }
  }, [checkHealth]);

  // Auto-reconnection with exponential backoff
  const autoReconnect = useCallback(async (): Promise<void> => {
    if (status.isReconnecting) return;

    setStatus(prev => ({ ...prev, isReconnecting: true }));

    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts && !status.isConnected) {
      attempts++;
      
      setStatus(prev => ({ ...prev, reconnectAttempts: attempts }));

      console.log(`Auto-reconnection attempt ${attempts}/${maxAttempts}`);

      const success = await forceReconnect();
      
      if (success) {
        console.log('Auto-reconnection successful');
        return;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    setStatus(prev => ({
      ...prev,
      isReconnecting: false,
      lastError: 'Failed to reconnect after maximum attempts'
    }));

    setMetrics(prev => ({
      ...prev,
      totalDisconnections: prev.totalDisconnections + 1,
      lastDisconnection: new Date()
    }));
  }, [status.isReconnecting, status.isConnected, forceReconnect]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Initial health check
    checkHealth();

    // Regular health checks every 30 seconds
    const healthInterval = setInterval(checkHealth, 30000);

    // Monitor connection status changes
    const statusInterval = setInterval(() => {
      if (!status.isConnected && !status.isReconnecting) {
        autoReconnect();
      }
    }, 5000);

    // Cleanup function
    return () => {
      clearInterval(healthInterval);
      clearInterval(statusInterval);
      setIsMonitoring(false);
    };
  }, [isMonitoring, checkHealth, status.isConnected, status.isReconnecting, autoReconnect]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      totalDisconnections: 0,
      totalReconnections: 0,
      averageResponseTime: 0,
      uptime: 0,
      lastDisconnection: null
    });
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  // Calculate uptime
  useEffect(() => {
    if (!isMonitoring) return;

    const uptimeInterval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        uptime: prev.uptime + 1
      }));
    }, 1000);

    return () => clearInterval(uptimeInterval);
  }, [isMonitoring]);

  return {
    status,
    metrics,
    isMonitoring,
    checkHealth,
    forceReconnect,
    startMonitoring,
    stopMonitoring,
    resetMetrics
  };
};

export default useConnectionMonitor;