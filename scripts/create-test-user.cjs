const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ymstntjoewkyissepjbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3RudGpvZXdreWlzc2VwamJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI0MDQ4OCwiZXhwIjoyMDcyODE2NDg4fQ.vkqwX6bBBp53ZrFztwrudmn7hhWCVrLafnPUS9QTkjY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('🔄 إنشاء مستخدم اختبار...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'tasktest@test.com',
      password: 'Test123!@#',
      email_confirm: true,
      user_metadata: {
        firstName: 'Test',
        lastName: 'User'
      }
    });

    if (error) {
      console.error('❌ خطأ في إنشاء المستخدم:', error);
      return;
    }

    console.log('✅ تم إنشاء المستخدم بنجاح:', data.user.email);
    console.log('📧 ID المستخدم:', data.user.id);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

createTestUser();