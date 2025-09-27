import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file directly
const envFile = readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Get Supabase credentials from .env file
const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create a direct Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    fetch: (...args) => fetch(...args).catch(err => {
      console.log('Fetch error:', err.message);
      throw err;
    })
  }
});

async function checkAllTables() {
  console.log('🔍 Comprehensive database health check...');
  console.log('Supabase URL:', supabaseUrl);
  
  const tables = [
    'profiles', 'teams', 'team_members', 'projects', 'tasks', 
    'messages', 'notifications', 'files', 'activities',
    'permission_groups', 'user_sessions', 'system_health'
  ];
  
  let totalRecords = 0;
  const results = {};
  
  console.log('\n⏳ Testing all database tables...\n');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
        results[table] = { status: 'error', message: error.message };
      } else {
        console.log(`✅ ${table}: ${data.length} records`);
        results[table] = { status: 'success', count: data.length };
        totalRecords += data.length;
        
        if (data.length > 0) {
          console.log(`   First record ID: ${data[0].id || 'N/A'}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${table}: FAILED - ${error.message}`);
      results[table] = { status: 'failed', message: error.message };
    }
    await new Promise(resolve => setTimeout(resolve, 200)); // Delay between requests
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('============');
  
  Object.entries(results).forEach(([table, result]) => {
    if (result.status === 'success') {
      console.log(`✅ ${table}: ${result.count} records`);
    } else {
      console.log(`❌ ${table}: ${result.message}`);
    }
  });
  
  console.log(`\n📈 Total records across all tables: ${totalRecords}`);
  
  // Check if database is empty
  if (totalRecords === 0) {
    console.log('\n⚠️  DATABASE IS EMPTY - No records found in any table');
    console.log('💡 You need to add data through the application or migrations');
  }
}

checkAllTables();