import { createClient } from '@supabase/supabase-js';
import fetchRetry from 'fetch-retry';

// Environment variables validation with detailed error messages
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required. Please check your .env file.');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required. Please check your .env file.');
}

// Connection state management
interface ConnectionState {
  isConnected: boolean;
  lastHealthCheck: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

const connectionState: ConnectionState = {
  isConnected: false,
  lastHealthCheck: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5
};

// Configure fetch with retry logic and exponential backoff
const fetchWithRetry = fetchRetry(fetch, {
  retries: 3, // Number of retry attempts
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff with max 30s
  retryOn: [408, 429, 500, 502, 503, 504, 520, 521, 522, 524], // Retry on specific HTTP status codes
});

// Enhanced connection options with aggressive reconnection
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    debug: import.meta.env.DEV
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 30000, // Longer heartbeat interval
    reconnectAfterMs: (tries: number) => {
      const delay = Math.min(tries * 1000, 10000); // Slower, more stable reconnection
      console.log(`Realtime reconnecting in ${delay}ms (attempt ${tries})`);
      return delay;
    },
    timeout: 120000, // Increased timeout to 120 seconds for better stability
    encode: (payload: unknown, callback: (encoded: string) => void) => {
       callback(JSON.stringify(payload));
     },
     decode: (payload: string, callback: (decoded: unknown) => void) => {
       try {
         callback(JSON.parse(payload));
       } catch (error) {
         console.error('WebSocket decode error:', error);
         callback(payload);
       }
     }
  },
  global: {
    headers: {
      'x-application-name': 'lines-liaison',
      'x-client-info': 'supabase-js-web'
    },
    fetch: fetchWithRetry
  },
  db: {
    schema: 'public'
  }
};

// Create Supabase client with enhanced error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Enhanced connection health monitoring
export const checkConnectionHealth = async (): Promise<boolean> => {
  try {
    // Use a simple query with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const { error } = await supabase
      .from('activities')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Connection health check failed:', error);
      connectionState.isConnected = false;
      return false;
    }
    
    connectionState.isConnected = true;
    connectionState.lastHealthCheck = new Date();
    connectionState.reconnectAttempts = 0;
    
    return true;
  } catch (error) {
    console.error('Connection health check failed:', error);
    connectionState.isConnected = false;
    return false;
  }
};

// Connection recovery function with exponential backoff
export const recoverConnection = async (): Promise<boolean> => {
  if (connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
    return false;
  }
  
  connectionState.reconnectAttempts++;
  console.log(`Attempting connection recovery (${connectionState.reconnectAttempts}/${connectionState.maxReconnectAttempts})`);
  
  try {
    // Exponential backoff delay calculation
    const baseDelay = 1000; // 1 second base delay
    const maxDelay = 30000; // 30 seconds max delay
    const backoffDelay = Math.min(baseDelay * Math.pow(2, connectionState.reconnectAttempts - 1), maxDelay);
    
    console.log(`Waiting ${backoffDelay}ms before retry attempt...`);
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    
    // Force refresh the client connection
    await supabase.auth.refreshSession();
    
    // Test the connection
    const isHealthy = await checkConnectionHealth();
    
    if (isHealthy) {
      console.log('Connection recovered successfully');
      connectionState.reconnectAttempts = 0; // Reset attempts on success
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Connection recovery failed:', error);
    return false;
  }
};

// Get connection status
export const getConnectionStatus = () => ({
  ...connectionState,
  timeSinceLastCheck: connectionState.lastHealthCheck 
    ? Date.now() - connectionState.lastHealthCheck.getTime() 
    : null
});

// Enhanced realtime connection monitoring
export const setupRealtimeMonitoring = () => {
  const channel = supabase.channel('connection-monitor');
  
  channel
    .on('system', {}, (payload) => {
      console.log('Realtime system event:', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      connectionState.isConnected = true;
      connectionState.lastHealthCheck = new Date();
    })
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
      
      if (status === 'SUBSCRIBED') {
        connectionState.isConnected = true;
        connectionState.reconnectAttempts = 0;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        connectionState.isConnected = false;
        recoverConnection();
      }
    });
  
  return channel;
};

// Auto health check with exponential backoff
let healthCheckInterval: NodeJS.Timeout;

const startHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    const isHealthy = await checkConnectionHealth();
    
    if (!isHealthy) {
      console.warn('Connection unhealthy, attempting recovery...');
      await recoverConnection();
    }
  }, 15000); // Check every 15 seconds
};

// Initialize monitoring
startHealthMonitoring();
setupRealtimeMonitoring();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
});

export default supabase;
