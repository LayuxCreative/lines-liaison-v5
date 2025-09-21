import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Connection state interface
interface ConnectionState {
  isConnected: boolean;
  lastError: string | null;
  lastCheck: number;
  reconnectAttempts: number;
  responseTime: number;
}

// Connection state management
const connectionState: ConnectionState = {
  isConnected: false,
  lastError: null,
  lastCheck: 0,
  reconnectAttempts: 0,
  responseTime: 0
};

// Health check function
const checkConnectionHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      connectionState.isConnected = false;
      connectionState.lastError = error.message;
      connectionState.lastCheck = Date.now();
      return false;
    }

    connectionState.isConnected = true;
    connectionState.lastError = null;
    connectionState.lastCheck = Date.now();
    connectionState.reconnectAttempts = 0;
    return true;
  } catch (error) {
    connectionState.isConnected = false;
    connectionState.lastError = error instanceof Error ? error.message : 'Unknown error';
    connectionState.lastCheck = Date.now();
    return false;
  }
};

// Recovery function
const recoverConnection = async (): Promise<boolean> => {
  try {
    // Force reconnect realtime
    supabase.realtime.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    supabase.realtime.connect();
    
    // Test connection
    return await checkConnectionHealth();
  } catch (error) {
    console.error('Recovery failed:', error);
    return false;
  }
};

// Connection monitoring and auto-reconnection system
class SupabaseConnectionManager {
  private client: SupabaseClient;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isReconnecting = false;

  constructor() {
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
      },
      global: {
        headers: {
          'x-client-info': 'lines-liaison@1.0.0'
        }
      }
    });

    this.initializeConnectionMonitoring();
    this.setupRealtimeListeners();
  }

  private initializeConnectionMonitoring(): void {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await checkConnectionHealth();
      if (!isHealthy && !this.isReconnecting) {
        this.startReconnectionProcess();
      }
    }, 30000);

    // Initial health check
    setTimeout(() => checkConnectionHealth(), 1000);
  }

  private setupRealtimeListeners(): void {
    // Monitor realtime connection status through channel events
    const channel = this.client.channel('connection-monitor');
    
    channel.on('system', { event: 'connected' }, () => {
      console.log('Realtime connection opened');
      connectionState.isConnected = true;
      this.stopReconnectionProcess();
    });

    channel.on('system', { event: 'disconnected' }, () => {
      console.log('Realtime connection closed');
      connectionState.isConnected = false;
      if (!this.isReconnecting) {
        this.startReconnectionProcess();
      }
    });

    channel.on('system', { event: 'error' }, (error: unknown) => {
      console.error('Realtime connection error:', error);
      connectionState.lastError = error instanceof Error ? error.message : 'Realtime connection error';
      if (!this.isReconnecting) {
        this.startReconnectionProcess();
      }
    });

    channel.subscribe();
  }

  private async startReconnectionProcess(): Promise<void> {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    console.log('Starting reconnection process...');

    let attempts = 0;
    while (attempts < this.maxReconnectAttempts && this.isReconnecting) {
      attempts++;
      connectionState.reconnectAttempts = attempts;

      console.log(`Reconnection attempt ${attempts}/${this.maxReconnectAttempts}`);

      try {
        await recoverConnection();
        const isHealthy = await checkConnectionHealth();
        
        if (isHealthy) {
          console.log('Reconnection successful');
          this.stopReconnectionProcess();
          return;
        }
      } catch (error) {
        console.error(`Reconnection attempt ${attempts} failed:`, error);
      }

      if (attempts < this.maxReconnectAttempts) {
        const delay = Math.min(this.reconnectDelay * Math.pow(2, attempts - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (this.isReconnecting) {
      console.error('All reconnection attempts failed');
      this.isReconnecting = false;
      connectionState.lastError = 'Failed to reconnect after maximum attempts';
    }
  }

  private stopReconnectionProcess(): void {
    this.isReconnecting = false;
    connectionState.reconnectAttempts = 0;
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  public getClient(): SupabaseClient {
    return this.client;
  }

  public async forceReconnect(): Promise<void> {
    this.stopReconnectionProcess();
    await this.startReconnectionProcess();
  }

  public getConnectionState() {
    return { ...connectionState };
  }

  public destroy(): void {
    this.stopReconnectionProcess();
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Create singleton instance
const connectionManager = new SupabaseConnectionManager();

// Export the client
export const supabase = connectionManager.getClient();

export default supabase;