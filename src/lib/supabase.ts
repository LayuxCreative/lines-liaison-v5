import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Enhanced cookie-based session management for better reliability
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        try {
          // Try localStorage first
          const item = window.localStorage.getItem(key)
          if (item) return item
          
          // Fallback to sessionStorage
          return window.sessionStorage.getItem(key)
        } catch (error) {
          console.warn('Storage access failed:', error)
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          // Store in both localStorage and sessionStorage for redundancy
          window.localStorage.setItem(key, value)
          window.sessionStorage.setItem(key, value)
        } catch (error) {
          console.warn('Storage write failed:', error)
        }
      },
      removeItem: (key: string) => {
        try {
          window.localStorage.removeItem(key)
          window.sessionStorage.removeItem(key)
        } catch (error) {
          console.warn('Storage removal failed:', error)
        }
      }
    }
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
})

// Enhanced session management functions
export const sessionManager = {
  // Clear all session data
  clearSession: async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' })
      
      // Clear all Supabase-related items from storage
      const keysToRemove = [
        'supabase.auth.token',
        'sb-auth-token'
      ]
      
      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key)
          window.sessionStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error)
        }
      })

      // Remove any project-specific sb-*-auth-token keys dynamically
      try {
        const removeDynamicKeys = (storage: Storage) => {
          const keys = Object.keys(storage)
          keys.forEach(k => {
            if (/^sb-.+-auth-token$/.test(k)) {
              storage.removeItem(k)
            }
          })
        }
        removeDynamicKeys(window.localStorage)
        removeDynamicKeys(window.sessionStorage)
      } catch (error) {
        console.warn('Dynamic token cleanup failed:', error)
      }
      
      // Clear cookies if possible
      if (typeof document !== 'undefined' && typeof window !== 'undefined') {
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          if (name.includes('supabase') || name.includes('sb-')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          }
        })
      }
    } catch (error) {
      console.error('Session clear failed:', error)
    }
  },

  // Refresh session with retry logic
  refreshSession: async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (!error && data.session) {
          return data.session
        }
        if (error) {
          console.warn(`Session refresh attempt ${i + 1} failed:`, error)
        }
      } catch (error) {
        console.warn(`Session refresh attempt ${i + 1} error:`, error)
      }
      
      // Wait before retry
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    
    // If all retries failed, clear session
    await sessionManager.clearSession()
    return null
  },

  // Get current session with validation
  getCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.warn('Session validation failed:', error)
        await sessionManager.clearSession()
        return null
      }
      
      // Check if session is expired
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        
        if (expiresAt <= now) {
          console.warn('Session expired, attempting refresh')
          return await sessionManager.refreshSession()
        }
      }
      
      return session
    } catch (error) {
      console.error('Session check failed:', error)
      await sessionManager.clearSession()
      return null
    }
  }
}

// Function to check database connection
export const checkSupabaseConnection = async (): Promise<{ connected: boolean; error: string | null }> => {
  try {
    console.log('🌐 Checking Supabase database connection...');
    
    // Simple connection test
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return { connected: false, error: error.message };
    }

    console.log('✅ Database connection successful!');
    return { connected: true, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Connection check error:', msg);
    return { connected: false, error: msg };
  }
};

// Lightweight health ping that does not depend on RLS
export const pingSupabaseHealth = async (timeoutMs: number = 5000): Promise<{ ok: boolean; status?: number; error?: string }> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const baseUrl = supabaseUrl;

  try {
    const res = await fetch(`${baseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    return { ok: res.ok, status: res.status };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Health ping failed';
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
};

// Helper: extract Supabase project reference from configured URL (e.g., abcd1234 from https://abcd1234.supabase.co)
export function getSupabaseProjectRef(): string | null {
  try {
    if (!supabaseUrl || typeof supabaseUrl !== 'string') return null;
    const match = supabaseUrl.match(/^https?:\/\/([^.]+)\.supabase\.co/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

// Automatic connection check on load
if (typeof window !== 'undefined') {
  // Proactive cleanup: remove any sb-<ref>-auth-token keys from other projects
  try {
    const currentRef = getSupabaseProjectRef()
    const maybeRemove = (storage: Storage) => {
      Object.keys(storage).forEach(k => {
        const m = k.match(/^sb-(.+)-auth-token$/)
        if (m && currentRef && m[1] !== currentRef) {
          storage.removeItem(k)
        }
      })
    }
    maybeRemove(window.localStorage)
    maybeRemove(window.sessionStorage)
  } catch (error) {
    console.warn('Startup token drift cleanup failed:', error)
  }

  setTimeout(() => {
    checkSupabaseConnection().then(({ connected, error }) => {
      if (connected) {
        console.log('🎉 Application successfully connected to Supabase database');
      } else {
        console.warn('⚠️ Warning: Application not connected to database:', error);
      }
    });
  }, 1000);
}

export default supabase;