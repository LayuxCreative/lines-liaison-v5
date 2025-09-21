import { useState, useEffect } from 'react';
import { getConnectionHealth, checkConnection } from '../config/supabase';

interface ConnectionHealth {
  healthy: boolean;
  lastCheck: number;
  reconnectAttempts: number;
  maxAttempts: number;
  isChecking: boolean;
}

export const useConnectionHealth = (checkInterval = 30000) => {
  const [health, setHealth] = useState<ConnectionHealth>({
    ...getConnectionHealth(),
    isChecking: false
  });

  const performHealthCheck = async () => {
    setHealth(prev => ({ ...prev, isChecking: true }));
    
    try {
      const isHealthy = await checkConnection();
      const currentHealth = getConnectionHealth();
      
      setHealth({
        ...currentHealth,
        healthy: isHealthy,
        isChecking: false
      });
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth(prev => ({
        ...prev,
        healthy: false,
        isChecking: false
      }));
    }
  };

  useEffect(() => {
    // Disable automatic health checks to avoid 401 errors
    // Only manual checks through performHealthCheck will be performed
    
    // Initial health check - disabled
    // performHealthCheck();

    // Set up periodic health checks - disabled
    // const interval = setInterval(() => {
    //   const currentHealth = getConnectionHealth();
    //   
    //   // Only perform active check if connection seems unhealthy
    //   if (!currentHealth.healthy || Date.now() - currentHealth.lastCheck > checkInterval) {
    //     performHealthCheck();
    //   } else {
    //     // Update state with current health without active check
    //     setHealth(prev => ({ ...prev, ...currentHealth }));
    //   }
    // }, checkInterval);

    // return () => clearInterval(interval);
  }, [checkInterval]);

  return {
    ...health,
    performHealthCheck
  };
};

export default useConnectionHealth;