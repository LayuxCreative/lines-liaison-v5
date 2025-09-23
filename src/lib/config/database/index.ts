import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Database configuration
export const DATABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  project: {
    id: 'ymstntjoewkyissepjbc',
    region: 'us-east-1',
    status: 'active'
  },
  connection: {
    schema: 'public',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    timeout: 30000,
    heartbeatInterval: 30000,
    eventsPerSecond: 10
  }
} as const;

// Create Supabase client with optimized configuration
export const supabase: SupabaseClient<Database> = createClient(
  DATABASE_CONFIG.url,
  DATABASE_CONFIG.anonKey,
  {
    auth: {
      autoRefreshToken: DATABASE_CONFIG.connection.autoRefreshToken,
      persistSession: DATABASE_CONFIG.connection.persistSession,
      detectSessionInUrl: DATABASE_CONFIG.connection.detectSessionInUrl,
      flowType: DATABASE_CONFIG.connection.flowType,
      storage: window.localStorage,
      storageKey: 'lines-liaison-auth',
      debug: import.meta.env.DEV
    },
    realtime: {
      params: {
        eventsPerSecond: DATABASE_CONFIG.connection.eventsPerSecond,
        timeout: DATABASE_CONFIG.connection.timeout,
        heartbeatIntervalMs: DATABASE_CONFIG.connection.heartbeatInterval
      },
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
    },
    global: {
      headers: {
        'x-client-info': 'lines-liaison-v5',
        'apikey': DATABASE_CONFIG.anonKey
      },
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache'
          }
        });
      }
    },
    db: {
      schema: DATABASE_CONFIG.connection.schema
    }
  }
);

// Connection health monitoring
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      const isHealthy = await this.healthCheck();
      if (isHealthy) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHealthMonitoring();
        console.log('✅ Database connection established');
      } else {
        throw new Error('Database health check failed');
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      this.handleConnectionError();
    }
  }

  private async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Database health check error:', error);
      return false;
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      if (!isHealthy && this.isConnected) {
        this.isConnected = false;
        this.handleConnectionError();
      } else if (isHealthy && !this.isConnected) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ Database connection restored');
      }
    }, 30000); // Check every 30 seconds
  }

  private handleConnectionError(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.initialize(), 5000 * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isConnected = false;
  }
}

// Export singleton instance
export const databaseManager = DatabaseConnectionManager.getInstance();

// Export default client
export default supabase;