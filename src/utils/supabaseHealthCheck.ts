// Supabase Health Check Utility
// Advanced connection monitoring and diagnostics

import { supabase, getConnectionHealth } from '../config/supabase';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  latency: number;
  details: {
    database: boolean;
    realtime: boolean;
    auth: boolean;
    storage: boolean;
  };
  errors: string[];
}

export class SupabaseHealthMonitor {
  private static instance: SupabaseHealthMonitor;
  private healthHistory: HealthCheckResult[] = [];
  private maxHistorySize = 50;

  static getInstance(): SupabaseHealthMonitor {
    if (!SupabaseHealthMonitor.instance) {
      SupabaseHealthMonitor.instance = new SupabaseHealthMonitor();
    }
    return SupabaseHealthMonitor.instance;
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const details = {
      database: false,
      realtime: false,
      auth: false,
      storage: false
    };

    try {
      // Test database connection
      const dbTest = await this.testDatabase();
      details.database = dbTest.success;
      if (!dbTest.success) errors.push(`Database: ${dbTest.error}`);

      // Test realtime connection
      const realtimeTest = await this.testRealtime();
      details.realtime = realtimeTest.success;
      if (!realtimeTest.success) errors.push(`Realtime: ${realtimeTest.error}`);

      // Test auth service
      const authTest = await this.testAuth();
      details.auth = authTest.success;
      if (!authTest.success) errors.push(`Auth: ${authTest.error}`);

      // Test storage service
      const storageTest = await this.testStorage();
      details.storage = storageTest.success;
      if (!storageTest.success) errors.push(`Storage: ${storageTest.error}`);

    } catch (error) {
      errors.push(`General: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const latency = Date.now() - startTime;
    const healthyServices = Object.values(details).filter(Boolean).length;
    const totalServices = Object.keys(details).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices >= totalServices / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const result: HealthCheckResult = {
      status,
      timestamp: Date.now(),
      latency,
      details,
      errors
    };

    this.addToHistory(result);
    return result;
  }

  private async testDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database connection failed' 
      };
    }
  }

  private async testRealtime(): Promise<{ success: boolean; error?: string }> {
    try {
      const connectionHealth = getConnectionHealth();
      if (!connectionHealth.healthy) {
        return { 
          success: false, 
          error: `Unhealthy connection (attempts: ${connectionHealth.reconnectAttempts})` 
        };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Realtime connection failed' 
      };
    }
  }

  private async testAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Auth service failed' 
      };
    }
  }

  private async testStorage(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage.listBuckets();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Storage service failed' 
      };
    }
  }

  private addToHistory(result: HealthCheckResult): void {
    this.healthHistory.push(result);
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
  }

  getHealthHistory(): HealthCheckResult[] {
    return [...this.healthHistory];
  }

  getLatestHealth(): HealthCheckResult | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  getAverageLatency(minutes = 10): number {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentResults = this.healthHistory.filter(r => r.timestamp > cutoff);
    
    if (recentResults.length === 0) return 0;
    
    const totalLatency = recentResults.reduce((sum, r) => sum + r.latency, 0);
    return Math.round(totalLatency / recentResults.length);
  }

  getUptimePercentage(hours = 24): number {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentResults = this.healthHistory.filter(r => r.timestamp > cutoff);
    
    if (recentResults.length === 0) return 100;
    
    const healthyResults = recentResults.filter(r => r.status === 'healthy').length;
    return Math.round((healthyResults / recentResults.length) * 100);
  }
}

// Export singleton instance
export const healthMonitor = SupabaseHealthMonitor.getInstance();

// Auto health check every 5 minutes
setInterval(async () => {
  try {
    await healthMonitor.performHealthCheck();
  } catch (error) {
    console.error('Automated health check failed:', error);
  }
}, 5 * 60 * 1000);