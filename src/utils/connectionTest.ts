import { supabase } from '../config/unifiedSupabase';

export class SupabaseConnectionTest {
  static async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      console.log('Testing Supabase connection...');
      
      // Retry logic for better reliability
      let lastError: any = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Connection attempt ${attempt}/${maxRetries}...`);
          
          // Test basic connectivity with a simple query
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
          
          const { error: connectError } = await supabase
            .from('activities')
            .select('count', { count: 'exact', head: true })
            .abortSignal(controller.signal);
          
          clearTimeout(timeoutId);
          
          if (!connectError) {
            // Success on this attempt
            break;
          }
          
          lastError = connectError;
          
          // If it's an API key issue, don't retry
          if (connectError.message.includes('Invalid API key') || connectError.message.includes('JWT')) {
            break;
          }
          
          // Wait before retry (except on last attempt)
          if (attempt < maxRetries) {
            console.log(`Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (retryError) {
          lastError = retryError;
          if (attempt < maxRetries) {
            console.log(`Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      const latency = Date.now() - startTime;
      
      if (lastError) {
        console.error('❌ Database connection failed:', lastError);
        
        // Check if it's an API key issue
        if (lastError.message && (lastError.message.includes('Invalid API key') || lastError.message.includes('JWT'))) {
          return {
            success: false,
            message: 'Invalid API configuration - check your Supabase keys',
            latency
          };
        }
        
        return {
          success: false,
          message: `Connection timeout - please check your database connection`,
          latency
        };
      }
      
      // Test auth session as secondary check
      const { error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.warn('⚠️ Auth session check failed:', authError);
        // Don't fail the connection test for auth issues
      }
      
      console.log('Supabase connection successful');
      return {
        success: true,
        message: 'Connected to Supabase successfully',
        latency
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error('Supabase connection error:', error);
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout - please check your database connection',
          latency
        };
      }
      
      // Handle network errors
      if (error instanceof Error && error.message.includes('fetch')) {
        return {
          success: false,
          message: 'Network error - check your database connection',
          latency
        };
      }
      
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latency
      };
    }
  }

  static async testAuth(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing Supabase auth...');
      
      // Use getSession instead of getUser for better connection testing
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Auth test failed:', error);
        return {
          success: false,
          message: `Auth test failed: ${error.message}`
        };
      }
      
      console.log('Auth test successful');
      return {
        success: true,
        message: data.session ? 'User authenticated' : 'No active session'
      };
      
    } catch (error) {
      console.error('Auth test error:', error);
      return {
        success: false,
        message: `Auth error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async runFullTest(): Promise<{
    connection: { success: boolean; message: string; latency?: number };
    auth: { success: boolean; message: string };
    overall: boolean;
  }> {
    console.log('Running full Supabase test suite...');
    
    const connection = await this.testConnection();
    const auth = await this.testAuth();
    
    const overall = connection.success && auth.success;
    
    console.log('Test Results:', {
      connection: connection.success ? 'PASS' : 'FAIL',
      auth: auth.success ? 'PASS' : 'FAIL',
      overall: overall ? 'All tests passed' : 'Some tests failed'
    });
    
    return {
      connection,
      auth,
      overall
    };
  }
}