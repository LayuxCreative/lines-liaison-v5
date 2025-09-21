#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// Supabase configuration
const SUPABASE_URL = 'https://ymstntjoewkyissepjbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3RudGpvZXdreWlzc2VwamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDA0ODgsImV4cCI6MjA3MjgxNjQ4OH0.4wKfqHYlxFE0OWm4VN6rNXqH5tCkjbp7FmF8xDodWjk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnectionSpeed() {
  console.log('🚀 Testing Supabase connection speed...\n');
  
  const tests = [
    {
      name: 'Basic Connection Test',
      test: async () => {
        const start = performance.now();
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        const end = performance.now();
        return { success: !error, latency: end - start, data };
      }
    },
    {
      name: 'Authentication Test',
      test: async () => {
        const start = performance.now();
        const { data, error } = await supabase.auth.getSession();
        const end = performance.now();
        return { success: !error, latency: end - start, data };
      }
    },
    {
      name: 'Projects Query Test',
      test: async () => {
        const start = performance.now();
        const { data, error } = await supabase.from('projects').select('id, name').limit(5);
        const end = performance.now();
        return { success: !error, latency: end - start, data: data?.length || 0 };
      }
    },
    {
      name: 'Tasks Query Test',
      test: async () => {
        const start = performance.now();
        const { data, error } = await supabase.from('tasks').select('id, title').limit(5);
        const end = performance.now();
        return { success: !error, latency: end - start, data: data?.length || 0 };
      }
    },
    {
      name: 'Files Query Test',
      test: async () => {
        const start = performance.now();
        const { data, error } = await supabase.from('files').select('id, name').limit(5);
        const end = performance.now();
        return { success: !error, latency: end - start, data: data?.length || 0 };
      }
    },
    {
      name: 'Realtime Connection Test',
      test: async () => {
        return new Promise((resolve) => {
          const start = performance.now();
          let resolved = false;
          
          const channel = supabase.channel('test-channel-' + Math.random());
          
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              channel.unsubscribe();
              resolve({ success: false, latency: 5000, data: 'timeout' });
            }
          }, 5000);
          
          channel.subscribe((status) => {
            if (!resolved) {
              const end = performance.now();
              resolved = true;
              clearTimeout(timeout);
              channel.unsubscribe();
              resolve({ 
                success: status === 'SUBSCRIBED', 
                latency: end - start, 
                data: status 
              });
            }
          });
        });
      }
    }
  ];

  const results = [];
  let totalLatency = 0;
  let successCount = 0;

  for (const test of tests) {
    try {
      console.log(`⏳ Running ${test.name}...`);
      const result = await test.test();
      
      if (result.success) {
        console.log(`✅ ${test.name}: ${result.latency.toFixed(2)}ms`);
        successCount++;
      } else {
        console.log(`❌ ${test.name}: Failed (${result.latency.toFixed(2)}ms)`);
      }
      
      totalLatency += result.latency;
      results.push({
        name: test.name,
        ...result
      });
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      results.push({
        name: test.name,
        success: false,
        latency: 0,
        error: error.message
      });
    }
  }

  console.log('\n📊 Connection Speed Summary:');
  console.log('═'.repeat(50));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${tests.length - successCount}`);
  console.log(`Average Latency: ${(totalLatency / tests.length).toFixed(2)}ms`);
  console.log(`Success Rate: ${((successCount / tests.length) * 100).toFixed(1)}%`);
  
  const avgLatency = totalLatency / tests.length;
  if (avgLatency < 200) {
    console.log('🚀 Excellent connection speed!');
  } else if (avgLatency < 500) {
    console.log('✅ Good connection speed');
  } else if (avgLatency < 1000) {
    console.log('⚠️ Moderate connection speed');
  } else {
    console.log('🐌 Slow connection speed - consider optimization');
  }

  console.log('\n📋 Detailed Results:');
  console.log('═'.repeat(50));
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.latency.toFixed(2)}ms`);
  });

  return {
    totalTests: tests.length,
    successCount,
    averageLatency: avgLatency,
    successRate: (successCount / tests.length) * 100,
    results
  };
}

// Run the test
testConnectionSpeed()
  .then((summary) => {
    console.log('\n🎯 Test completed successfully!');
    process.exit(summary.successRate >= 80 ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });