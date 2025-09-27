const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '../backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = 'http://localhost:3001';

async function runDiagnostics() {
  console.log('🔍 Running comprehensive diagnostics...\n');

  try {
    // 1. Test Supabase connection
    console.log('1. Testing Supabase connection...');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: healthCheck, error: healthError } = await adminClient
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Supabase connection failed:', healthError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // 2. Test backend server
    console.log('\n2. Testing backend server...');
    try {
      const response = await axios.get(`${backendUrl}/api/auth/me`);
      // If we get 401, server is running but not authenticated (expected)
      console.log('✅ Backend server is running');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Backend server is running');
      } else {
        console.error('❌ Backend server not responding:', error.message);
        return;
      }
    }

    // 3. Test with existing user or create new one
    console.log('\n3. Testing user authentication...');
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';

    // Try to create user first (might fail if exists)
    try {
      const registerResponse = await axios.post(`${backendUrl}/api/auth/register`, {
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      });
      console.log('✅ User registration successful');
    } catch (error) {
      console.log('ℹ️ User might already exist, proceeding with login...');
    }

    // Login and get session
    let sessionToken;
    try {
      const loginResponse = await axios.post(`${backendUrl}/api/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      
      // Extract session token from cookie
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        const sessionCookie = cookies.find(cookie => cookie.startsWith('session_token='));
        if (sessionCookie) {
          sessionToken = sessionCookie.split('=')[1].split(';')[0];
        }
      }
      
      console.log('✅ Login successful, session token obtained');
      console.log('   Session token:', sessionToken ? 'Found' : 'Not found');
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      return;
    }

    // 4. Test authenticated endpoints
    console.log('\n4. Testing authenticated endpoints...');
    const authHeaders = {
      'Content-Type': 'application/json',
      'Cookie': `session_token=${sessionToken}`
    };

    // Test /me endpoint
    try {
      const meResponse = await axios.get(`${backendUrl}/api/auth/me`, { headers: authHeaders });
      console.log('✅ /api/auth/me endpoint working');
      console.log('   User ID:', meResponse.data.id);
    } catch (error) {
      console.error('❌ /api/auth/me failed:', error.response?.data || error.message);
    }

    // 5. Test data operations
    console.log('\n5. Testing data operations...');
    
    // First get user info to get user ID
    let userId;
    try {
      const meResponse = await axios.get(`${backendUrl}/api/auth/me`, {
        headers: { 'Cookie': `session_token=${sessionToken}` }
      });
      userId = meResponse.data.user?.id;
      console.log('   User ID for testing:', userId);
    } catch (error) {
      console.error('❌ Could not get user ID:', error.response?.data || error.message);
      return;
    }
    
    // Create project
    let projectId;
    try {
      const projectResponse = await axios.post(`${backendUrl}/api/projects`, {
        title: 'Diagnostic Test Project',
        description: 'Project created for diagnostic testing',
        status: 'active'
      }, { headers: authHeaders });
      
      projectId = projectResponse.data.id;
      console.log('✅ Project creation successful');
      console.log('   Project ID:', projectId);
    } catch (error) {
      console.error('❌ Project creation failed:', error.response?.data || error.message);
    }

    // Get projects
    if (userId) {
      try {
        const projectsResponse = await axios.get(`${backendUrl}/api/projects/${userId}`, { headers: authHeaders });
        console.log('✅ Projects retrieval successful');
        console.log('   Found projects:', projectsResponse.data.length);
      } catch (error) {
        console.error('❌ Projects retrieval failed:', error.response?.data || error.message);
      }
    }

    // Create task if project exists
    if (projectId) {
      try {
        const taskResponse = await axios.post(`${backendUrl}/api/tasks`, {
          title: 'Diagnostic Test Task',
          description: 'Task created for diagnostic testing',
          project_id: projectId,
          status: 'pending',
          priority: 'medium'
        }, { headers: authHeaders });
        
        console.log('✅ Task creation successful');
        console.log('   Task ID:', taskResponse.data.id);
      } catch (error) {
        console.error('❌ Task creation failed:', error.response?.data || error.message);
      }

      // Get tasks
      try {
        const tasksResponse = await axios.get(`${backendUrl}/api/tasks?projectId=${projectId}`, { headers: authHeaders });
        console.log('✅ Tasks retrieval successful');
        console.log('   Found tasks:', tasksResponse.data.length);
      } catch (error) {
        console.error('❌ Tasks retrieval failed:', error.response?.data || error.message);
      }

      // Create message
      try {
        const messageResponse = await axios.post(`${backendUrl}/api/messages`, {
          content: 'Diagnostic test message',
          project_id: projectId
        }, { headers: authHeaders });
        
        console.log('✅ Message creation successful');
        console.log('   Message ID:', messageResponse.data.id);
      } catch (error) {
        console.error('❌ Message creation failed:', error.response?.data || error.message);
      }

      // Get messages
      try {
        const messagesResponse = await axios.get(`${backendUrl}/api/messages?projectId=${projectId}`, { headers: authHeaders });
        console.log('✅ Messages retrieval successful');
        console.log('   Found messages:', messagesResponse.data.length);
      } catch (error) {
        console.error('❌ Messages retrieval failed:', error.response?.data || error.message);
      }
    }

    // 6. Test session validation
    console.log('\n6. Testing session validation...');
    try {
      const validationResponse = await axios.get(`${backendUrl}/api/auth/me`, { headers: authHeaders });
      console.log('✅ Session validation successful');
    } catch (error) {
      console.error('❌ Session validation failed:', error.response?.data || error.message);
    }

    // 7. Test logout
    console.log('\n7. Testing logout...');
    try {
      await axios.post(`${backendUrl}/api/auth/logout`, {}, { headers: authHeaders });
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error.response?.data || error.message);
    }

    // 8. Test session after logout
    console.log('\n8. Testing session after logout...');
    try {
      const postLogoutResponse = await axios.get(`${backendUrl}/api/auth/me`, { headers: authHeaders });
      console.error('❌ Session still valid after logout (this should fail)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Session properly invalidated after logout');
      } else {
        console.error('❌ Unexpected error after logout:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Diagnostic testing completed!');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

runDiagnostics();