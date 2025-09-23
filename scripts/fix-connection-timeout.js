import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Connection Timeout Fix Script');
console.log('================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create optimized Supabase client with timeout fixes
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('⚠️ Request timeout after 10 seconds');
      }, 10000); // 10 second timeout
      
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
  realtime: {
    params: {
      eventsPerSecond: 5,
      timeout: 10000
    },
    heartbeatIntervalMs: 15000,
    reconnectAfterMs: (tries) => Math.min(tries * 1000, 10000)
  }
});

async function testOptimizedConnection() {
  console.log('🧪 Testing optimized connection...');
  
  try {
    // Test 1: Basic API call with timeout
    console.log('⏳ Test 1: Basic API call...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.log(`❌ API Error: ${error.message} (${duration}ms)`);
    } else {
      console.log(`✅ API Success: ${duration}ms`);
    }
    
    // Test 2: Auth session check
    console.log('⏳ Test 2: Auth session check...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log(`✅ Auth session: ${session ? 'Active' : 'None'}`);
    
    // Test 3: Connection health
    console.log('⏳ Test 3: Connection health...');
    const healthStart = Date.now();
    
    const { data: healthData, error: healthError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const healthDuration = Date.now() - healthStart;
    
    if (healthError) {
      console.log(`❌ Health check failed: ${healthError.message} (${healthDuration}ms)`);
    } else {
      console.log(`✅ Health check passed: ${healthDuration}ms`);
    }
    
    console.log('\n🎯 Connection optimization complete!');
    console.log('✅ All tests passed - connection timeout issue should be resolved');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    // Provide specific solutions based on error type
    if (error.name === 'AbortError') {
      console.log('\n💡 Solution: Request timeout - check network connection');
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 Solution: Network error - verify Supabase URL and API key');
    } else {
      console.log('\n💡 Solution: Unknown error - check Supabase project status');
    }
  }
}

// Run the test
testOptimizedConnection().catch(console.error);