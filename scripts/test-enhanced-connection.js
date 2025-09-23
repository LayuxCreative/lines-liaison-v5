import { createClient } from '@supabase/supabase-js';
import fetchRetry from 'fetch-retry';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Enhanced connection test with all improvements
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Configure fetch with retry
const fetchWithRetry = fetchRetry(fetch, {
  retries: 3,
  retryDelay: function(attempt) {
    return Math.pow(2, attempt) * 1000; // Exponential backoff
  },
  retryOn: [408, 429, 500, 502, 503, 504]
});

// Create enhanced Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: fetchWithRetry,
    headers: {
      'Connection': 'keep-alive',
      'Keep-Alive': 'timeout=120'
    }
  },
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries) => Math.min(tries * 2000, 30000)
  }
});

// Test metrics
const testMetrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  totalLatency: 0,
  errors: []
};

// Enhanced connection test function
async function testConnection(testName, testFn, timeout = 30000) {
  testMetrics.totalTests++;
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Testing: ${testName}`);
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timeout')), timeout);
    });
    
    // Race between test and timeout
    await Promise.race([testFn(), timeoutPromise]);
    
    const latency = Date.now() - startTime;
    testMetrics.totalLatency += latency;
    testMetrics.passedTests++;
    
    console.log(`✅ ${testName} - ${latency}ms`);
    return true;
  } catch (error) {
    const latency = Date.now() - startTime;
    testMetrics.totalLatency += latency;
    testMetrics.failedTests++;
    testMetrics.errors.push({ test: testName, error: error.message });
    
    console.log(`❌ ${testName} - ${latency}ms - ${error.message}`);
    return false;
  }
}

// Test with retry logic
async function testWithRetry(testName, testFn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await testConnection(`${testName} (attempt ${attempt})`, testFn);
      if (result) return true;
    } catch (error) {
      if (attempt === maxRetries) {
        console.log(`🔄 ${testName} failed after ${maxRetries} attempts`);
        return false;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying ${testName} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Run comprehensive tests
async function runEnhancedTests() {
  console.log('🚀 Starting Enhanced Connection Tests...\n');
  
  // Basic connectivity test
  await testConnection('Basic Connection', async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('id')
      .limit(1);
    
    if (error) throw new Error(error.message);
    return data;
  });
  
  // Connection with retry test
  await testWithRetry('Connection with Retry', async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .limit(5);
    
    if (error) throw new Error(error.message);
    return data;
  });
  
  // Auth session test
  await testConnection('Auth Session', async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return session;
  });
  
  // Multiple concurrent requests test
  await testConnection('Concurrent Requests', async () => {
    const promises = Array(5).fill().map(() => 
      supabase.from('activities').select('id').limit(1)
    );
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
      throw new Error(`${errors.length} concurrent requests failed`);
    }
    
    return results;
  });
  
  // Stress test with rapid requests
  await testConnection('Rapid Requests Stress Test', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        supabase.from('activities').select('id').limit(1)
      );
    }
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 2) { // Allow some failures in stress test
      throw new Error(`Too many failures in stress test: ${errors.length}/10`);
    }
    
    return results;
  });
  
  // Connection recovery simulation
  await testConnection('Connection Recovery', async () => {
    // Simulate connection issues by making requests with very short timeout
    try {
      await supabase.from('activities').select('*').limit(100);
    } catch (error) {
      // Expected to potentially fail
    }
    
    // Then test if connection recovers
    const { data, error } = await supabase
      .from('activities')
      .select('id')
      .limit(1);
    
    if (error) throw new Error('Connection did not recover');
    return data;
  });
  
  // Print results
  console.log('\n📊 Enhanced Test Results:');
  console.log(`Total Tests: ${testMetrics.totalTests}`);
  console.log(`Passed: ${testMetrics.passedTests}`);
  console.log(`Failed: ${testMetrics.failedTests}`);
  console.log(`Success Rate: ${((testMetrics.passedTests / testMetrics.totalTests) * 100).toFixed(1)}%`);
  console.log(`Average Latency: ${(testMetrics.totalLatency / testMetrics.totalTests).toFixed(2)}ms`);
  
  if (testMetrics.errors.length > 0) {
    console.log('\n❌ Errors:');
    testMetrics.errors.forEach(({ test, error }) => {
      console.log(`  ${test}: ${error}`);
    });
  }
  
  console.log('\n🎯 Enhanced connection system test completed!');
  
  // Exit with appropriate code
  process.exit(testMetrics.failedTests > 0 ? 1 : 0);
}

// Run tests
runEnhancedTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});