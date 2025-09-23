import { useState, useEffect } from 'react';
import { supabase } from '../config/unifiedSupabase';

interface ConnectionHealth {
  isConnected: boolean;
  lastCheck: Date | null;
  reconnectAttempts: number;
  latency: number;
}

export const useConnectionHealth = () => {
  const [health, setHealth] = useState<ConnectionHealth>({
    isConnected: false,
    lastCheck: null,
    reconnectAttempts: 0,
    latency: 0
  });

  const checkConnection = async () => {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('activities')
        .select('id')
        .limit(1);
      
      const latency = Date.now() - startTime;
      
      setHealth({
        isConnected: !error,
        lastCheck: new Date(),
        reconnectAttempts: error ? health.reconnectAttempts + 1 : 0,
        latency
      });
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        isConnected: false,
        lastCheck: new Date(),
        reconnectAttempts: prev.reconnectAttempts + 1,
        latency: Date.now() - startTime
      }));
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { health, checkConnection };
};