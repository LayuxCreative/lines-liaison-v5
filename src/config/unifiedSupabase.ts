import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database type definition
type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; email: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; email?: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
      };
      projects: {
        Row: { id: string; name: string; description: string | null; owner_id: string; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; description?: string | null; owner_id: string; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; description?: string | null; owner_id?: string; created_at?: string; updated_at?: string };
      };
      tasks: {
        Row: { id: string; title: string; description: string | null; status: string; priority: string; project_id: string; assignee_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; description?: string | null; status?: string; priority?: string; project_id: string; assignee_id?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; title?: string; description?: string | null; status?: string; priority?: string; project_id?: string; assignee_id?: string | null; created_at?: string; updated_at?: string };
      };
      teams: {
        Row: { id: string; name: string; description: string | null; owner_id: string; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; description?: string | null; owner_id: string; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; description?: string | null; owner_id?: string; created_at?: string; updated_at?: string };
      };
    };
  };
};

// Environment validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Unified Supabase client with optimized configuration
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'lines-liaison-auth',
    debug: import.meta.env.DEV
  },
  realtime: {
    params: {
      eventsPerSecond: 5,
      timeout: 30000
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
  },
  global: {
    headers: {
      'x-client-info': 'lines-liaison-v5',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Request timeout after 30 seconds:', url);
      }, 30000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=30'
        }
      }).finally(() => clearTimeout(timeoutId));
    }
  },
  db: {
    schema: 'public'
  }
});

// Connection health monitoring
export class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  static getInstance(): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager();
    }
    return SupabaseConnectionManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Test initial connection
      await this.healthCheck();
      
      // Start periodic health checks
      this.startHealthMonitoring();
      
      console.log('✅ Supabase connection initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase connection:', error);
      throw error;
    }
  }

  private async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      this.isConnected = !error;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      const wasConnected = this.isConnected;
      const isNowConnected = await this.healthCheck();
      
      if (wasConnected && !isNowConnected) {
        console.warn('🔄 Supabase connection lost, attempting reconnection...');
      } else if (!wasConnected && isNowConnected) {
        console.log('✅ Supabase connection restored');
      }
    }, 30000); // Check every 30 seconds
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Initialize connection manager
export const connectionManager = SupabaseConnectionManager.getInstance();

export default supabase;