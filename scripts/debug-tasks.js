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

async function debugTasksTable() {
  console.log('🔍 Debugging Tasks table connection...');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('⏳ Testing Supabase connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth connection error:', authError.message);
    } else {
      console.log('✅ Auth connection successful');
    }
    
    // Test 2: Try to access tasks table
    console.log('⏳ Testing tasks table access...');
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Tasks table error:', error);
      console.log('🔧 Error details:', JSON.stringify(error, null, 2));
      
      // Test 3: Try other tables to see if it's specific to tasks
      console.log('⏳ Testing all database tables...');
      
      const tables = [
        'profiles', 'teams', 'team_members', 'projects', 'tasks', 
        'messages', 'notifications', 'files', 'activities',
        'permission_groups', 'user_sessions', 'system_health'
      ];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(3);
          
          if (error) {
            console.log(`❌ ${table} table error:`, error.message);
          } else {
            console.log(`✅ ${table} table accessible. Records: ${data.length}`);
            if (data.length > 0) {
              console.log(`   Sample data:`, JSON.stringify(data[0], null, 2));
            }
          }
        } catch (error) {
          console.log(`❌ ${table} table test failed:`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }
      
    } else {
      console.log('✅ Tasks table accessible. Data:', data);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

debugTasksTable();