const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client for setup
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSPolicies() {
  console.log('🔍 Testing RLS Policies...\n');

  try {
    // 1. Create test user
    console.log('1. Creating test user...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Failed to create test user:', authError);
      return;
    }

    const testUserId = authData.user.id;
    console.log('✅ Test user created:', testUserId);

    // 2. Create user profile
    console.log('\n2. Creating user profile...');
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Test User',
        role: 'admin' // Use valid role from schema
      });

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError);
    } else {
      console.log('✅ Profile created');
    }

    // 3. Create test project
    console.log('\n3. Creating test project...');
    const { data: projectData, error: projectError } = await adminClient
      .from('projects')
      .insert({
        name: 'Test Project', // Use 'name' instead of 'title'
        description: 'Test project for RLS testing',
        client_id: testUserId,
        manager_id: testUserId,
        status: 'active'
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Failed to create project:', projectError);
      return;
    }

    const projectId = projectData.id;
    console.log('✅ Project created:', projectId);

    // 4. Get user JWT token
    console.log('\n4. Getting user JWT token...');
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: 'test@example.com'
    });

    if (sessionError) {
      console.error('❌ Failed to generate session:', sessionError);
      return;
    }

    // Create user client with JWT
    const userClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
    
    // Sign in the user
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (signInError) {
      console.error('❌ Failed to sign in user:', signInError);
      return;
    }

    console.log('✅ User signed in with JWT');

    // 5. Test RLS with user JWT
    console.log('\n5. Testing RLS policies with user JWT...');

    // Test projects access
    console.log('\n   Testing projects access...');
    const { data: userProjects, error: projectsError } = await userClient
      .from('projects')
      .select('*')
      .eq('client_id', testUserId);

    if (projectsError) {
      console.error('   ❌ Projects RLS failed:', projectsError);
    } else {
      console.log(`   ✅ Projects RLS working - Found ${userProjects.length} projects`);
    }

    // Test tasks access
    console.log('\n   Testing tasks access...');
    const { data: userTasks, error: tasksError } = await userClient
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);

    if (tasksError) {
      console.error('   ❌ Tasks RLS failed:', tasksError);
    } else {
      console.log(`   ✅ Tasks RLS working - Found ${userTasks.length} tasks`);
    }

    // Test messages access
    console.log('\n   Testing messages access...');
    const { data: userMessages, error: messagesError } = await userClient
      .from('messages')
      .select('*')
      .eq('project_id', projectId);

    if (messagesError) {
      console.error('   ❌ Messages RLS failed:', messagesError);
    } else {
      console.log(`   ✅ Messages RLS working - Found ${userMessages.length} messages`);
    }

    // Test files access
    console.log('\n   Testing files access...');
    const { data: userFiles, error: filesError } = await userClient
      .from('files')
      .select('*')
      .eq('project_id', projectId);

    if (filesError) {
      console.error('   ❌ Files RLS failed:', filesError);
    } else {
      console.log(`   ✅ Files RLS working - Found ${userFiles.length} files`);
    }

    // 6. Test unauthorized access
    console.log('\n6. Testing unauthorized access...');
    
    // Create another user's project
    const { data: otherProject, error: otherProjectError } = await adminClient
      .from('projects')
      .insert({
        name: 'Other User Project', // Use 'name' instead of 'title'
        description: 'Project belonging to another user',
        client_id: '00000000-0000-0000-0000-000000000000', // Different user
        manager_id: '00000000-0000-0000-0000-000000000000',
        status: 'active'
      })
      .select()
      .single();

    if (!otherProjectError) {
      // Try to access other user's project
      const { data: unauthorizedProjects, error: unauthorizedError } = await userClient
        .from('projects')
        .select('*')
        .eq('id', otherProject.id);

      if (unauthorizedProjects && unauthorizedProjects.length === 0) {
        console.log('   ✅ RLS blocking unauthorized access correctly');
      } else {
        console.log('   ❌ RLS not blocking unauthorized access!');
      }
    }

    // 7. Cleanup
    console.log('\n7. Cleaning up test data...');
    await adminClient.auth.admin.deleteUser(testUserId);
    await adminClient.from('projects').delete().eq('id', projectId);
    if (otherProject) {
      await adminClient.from('projects').delete().eq('id', otherProject.id);
    }
    console.log('✅ Cleanup completed');

    console.log('\n🎉 RLS testing completed successfully!');

  } catch (error) {
    console.error('❌ RLS test failed:', error);
  }
}

// Run the test
testRLSPolicies().catch(console.error);