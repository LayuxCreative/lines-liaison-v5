#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ymstntjoewkyissepjbc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3RudGpvZXdreWlzc2VwamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDA0ODgsImV4cCI6MjA3MjgxNjQ4OH0.4wKfqHYlxFE0OWm4VN6rNXqH5tCkjbp7FmF8xDodWjk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 Testing login with admin credentials...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@linesliaison.com',
      password: 'admin123'
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      return;
    }

    if (data.user) {
      console.log('✅ Login successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Session:', data.session ? 'Active' : 'None');
      
      // Test profile fetch
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile fetch failed:', profileError.message);
      } else {
        console.log('✅ Profile loaded:', profile?.full_name || 'No name');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLogin().then(() => {
  console.log('🎉 Login test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});