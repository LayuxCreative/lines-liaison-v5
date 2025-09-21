/**
 * Authentication cleanup utilities
 * Handles clearing conflicting storage data and ensuring clean auth state
 */

export const clearAuthStorage = (): void => {
  try {
    // Only clear specific problematic keys, not the main auth session
    const problematicKeys = [
      'user_data',
      'cached_user',
      'temp_auth',
      'auth_error',
      'login_attempt'
    ];
    
    problematicKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        console.log(`Removed problematic key: ${key}`);
      } catch (error) {
        console.warn(`Failed to remove key ${key}:`, error);
      }
    });
    
    console.log('Auth storage cleanup completed (session preserved)');
  } catch (error) {
    console.error('Error during auth storage cleanup:', error);
  }
};

// New function for complete logout cleanup
export const clearAllAuthStorage = (): void => {
  try {
    // Clear all Supabase-related localStorage items (for logout only)
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('auth') ||
      key.startsWith('supabase.') ||
      key.startsWith('sb.')
    );
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`Removed storage key: ${key}`);
      } catch (error) {
        console.warn(`Failed to remove storage key ${key}:`, error);
      }
    });
    
    // Clear sessionStorage as well
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('auth')
    );
    
    sessionKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        console.log(`Removed session key: ${key}`);
      } catch (error) {
        console.warn(`Failed to remove session key ${key}:`, error);
      }
    });
    
    console.log('Complete auth storage cleanup completed');
  } catch (error) {
    console.error('Error during complete auth storage cleanup:', error);
  }
};

export const validateAuthState = (): boolean => {
  try {
    // Check for the specific Supabase auth token
    const authToken = localStorage.getItem('sb-auth-token');
    
    if (!authToken) {
      console.log('No Supabase auth token found in storage');
      return false;
    }
    
    // Check for valid token structure
    try {
      const parsed = JSON.parse(authToken);
      
      // Validate required fields
      if (!parsed || typeof parsed !== 'object') {
        console.warn('Invalid auth token structure');
        return false;
      }
      
      // Check for access token and expiration
      if (!parsed.access_token || !parsed.expires_at) {
        console.warn('Missing required token fields');
        return false;
      }
      
      // Check if token is expired (with 30 second buffer only)
      const expirationTime = new Date(parsed.expires_at * 1000);
      const currentTime = new Date();
      const bufferTime = 30 * 1000; // 30 seconds in milliseconds
      const isExpired = expirationTime.getTime() - bufferTime <= currentTime.getTime();
      
      if (isExpired) {
        console.log('Auth token is expired');
        return false;
      }
      
      console.log('Auth state validation: valid');
      return true;
    } catch (e) {
      console.warn('Invalid auth token format:', e);
      return false;
    }
  } catch (error) {
    console.error('Error validating auth state:', error);
    return false;
  }
};

export const forceAuthReset = (): void => {
  console.log('Forcing auth reset...');
  
  // Clear all storage
  clearAuthStorage();
  
  // Clear any cached data
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('auth') || cacheName.includes('supabase')) {
          caches.delete(cacheName);
        }
      });
    });
  }
  
  console.log('Auth reset completed');
};