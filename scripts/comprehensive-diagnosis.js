#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ymstntjoewkyissepjbc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3RudGpvZXdreWlzc2VwamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDA0ODgsImV4cCI6MjA3MjgxNjQ4OH0.4wKfqHYlxFE0OWm4VN6rNXqH5tCkjbp7FmF8xDodWjk';

console.log('🔍 COMPREHENSIVE SUPABASE DIAGNOSIS');
console.log('=====================================\n');

// Test 1: Environment Variables
console.log('📋 1. Environment Variables Check:');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`   URL Valid: ${SUPABASE_URL.includes('supabase.co')}`);
console.log(`   Key Valid: ${SUPABASE_ANON_KEY.length > 100}\n`);

// Test 2: Network Connectivity
console.log('🌐 2. Network Connectivity Test:');
try {
  const start = performance.now();
  const response = await fetch(SUPABASE_URL, { 
    method: 'HEAD',
    timeout: 10000 
  });
  const end = performance.now();
  
  console.log(`   ✅ Network: ${response.status} (${Math.round(end - start)}ms)`);
  console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
} catch (error) {
  console.log(`   ❌ Network Error: ${error.message}`);
}
console.log();

// Test 3: Direct API Test
console.log('🔌 3. Direct API Test:');
try {
  const start = performance.now();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });
  const end = performance.now();
  
  console.log(`   ✅ API Response: ${response.status} (${Math.round(end - start)}ms)`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`   ❌ API Error: ${errorText}`);
  }
} catch (error) {
  console.log(`   ❌ API Error: ${error.message}`);
}
console.log();

// Test 4: Supabase Client Test
console.log('🔧 4. Supabase Client Test:');
try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  const start = performance.now();
  const { data, error } = await supabase.from('profiles').select('count').limit(1);
  const end = performance.now();
  
  if (error) {
    console.log(`   ❌ Client Error: ${error.message}`);
    console.log(`   Error Details: ${JSON.stringify(error, null, 2)}`);
  } else {
    console.log(`   ✅ Client Success (${Math.round(end - start)}ms)`);
    console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
  }
} catch (error) {
  console.log(`   ❌ Client Exception: ${error.message}`);
}
console.log();

// Test 5: Authentication Test
console.log('🔐 5. Authentication Test:');
try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const start = performance.now();
  const { data: { user }, error } = await supabase.auth.getUser();
  const end = performance.now();
  
  if (error) {
    console.log(`   ❌ Auth Error: ${error.message}`);
  } else {
    console.log(`   ✅ Auth Success (${Math.round(end - start)}ms)`);
    console.log(`   User: ${user ? 'Authenticated' : 'Anonymous'}`);
  }
} catch (error) {
  console.log(`   ❌ Auth Exception: ${error.message}`);
}
console.log();

// Test 6: CORS and Security Headers
console.log('🛡️ 6. CORS and Security Test:');
try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5174',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'apikey,authorization'
    }
  });
  
  console.log(`   CORS Status: ${response.status}`);
  console.log(`   CORS Headers:`);
  for (const [key, value] of response.headers) {
    if (key.toLowerCase().includes('cors') || key.toLowerCase().includes('access-control')) {
      console.log(`     ${key}: ${value}`);
    }
  }
} catch (error) {
  console.log(`   ❌ CORS Error: ${error.message}`);
}
console.log();

// Test 7: Database Connection Test
console.log('🗄️ 7. Database Connection Test:');
try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const tests = [
    { table: 'profiles', name: 'Profiles' },
    { table: 'projects', name: 'Projects' },
    { table: 'tasks', name: 'Tasks' },
    { table: 'teams', name: 'Teams' }
  ];
  
  for (const test of tests) {
    try {
      const start = performance.now();
      const { data, error, count } = await supabase
        .from(test.table)
        .select('*', { count: 'exact', head: true });
      const end = performance.now();
      
      if (error) {
        console.log(`   ❌ ${test.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${test.name}: ${count} records (${Math.round(end - start)}ms)`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
} catch (error) {
  console.log(`   ❌ Database Error: ${error.message}`);
}
console.log();

// Test 8: Realtime Connection Test
console.log('⚡ 8. Realtime Connection Test:');
try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const start = performance.now();
  const channel = supabase.channel('test-channel');
  
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Realtime connection timeout'));
    }, 10000);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        clearTimeout(timeout);
        const end = performance.now();
        console.log(`   ✅ Realtime Connected (${Math.round(end - start)}ms)`);
        resolve();
      })
      .subscribe((status) => {
        console.log(`   Realtime Status: ${status}`);
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          const end = performance.now();
          console.log(`   ✅ Realtime Subscribed (${Math.round(end - start)}ms)`);
          resolve();
        }
      });
  });
  
  await supabase.removeChannel(channel);
} catch (error) {
  console.log(`   ❌ Realtime Error: ${error.message}`);
}
console.log();

console.log('🎯 DIAGNOSIS COMPLETE');
console.log('====================');
console.log('Check the results above to identify the specific issue.');
console.log('If all tests pass but login still fails, the issue is likely in the frontend authentication flow.');