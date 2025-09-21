#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('🔧 Creating test user...');
  
  try {
    // Create user with admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@linesliaison.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ User already exists, updating profile...');
        
        // Get existing user
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === 'admin@linesliaison.com');
        
        if (user) {
          // Update or create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: 'Admin User',
              email: 'admin@linesliaison.com',
              role: 'admin',
              company: 'LiNES AND LiAiSON',
              department: 'Engineering',
              position: 'Administrator',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('❌ Profile update error:', profileError);
          } else {
            console.log('✅ Profile updated successfully');
          }
        }
        
        return;
      }
      
      console.error('❌ Auth error:', authError);
      return;
    }

    if (authData.user) {
      console.log('✅ User created successfully:', authData.user.email);
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: 'Admin User',
          email: 'admin@linesliaison.com',
          role: 'admin',
          company: 'LiNES AND LiAiSON',
          department: 'Engineering',
          position: 'Administrator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
      } else {
        console.log('✅ Profile created successfully');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
createTestUser().then(() => {
  console.log('🎉 Test user setup complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});