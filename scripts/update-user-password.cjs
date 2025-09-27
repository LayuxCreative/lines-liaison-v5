const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ymstntjoewkyissepjbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3RudGpvZXdreWlzc2VwamJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI0MDQ4OCwiZXhwIjoyMDcyODE2NDg4fQ.vkqwX6bBBp53ZrFztwrudmn7hhWCVrLafnPUS9QTkjY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserPassword() {
  try {
    console.log('🔄 تحديث كلمة مرور المستخدم...');
    
    const { data, error } = await supabase.auth.admin.updateUserById(
      '64056470-5bfa-4a59-a150-049d6a25d351', // ahmed.hassan@linesliaison.com
      {
        password: 'Ahmed123!@#'
      }
    );

    if (error) {
      console.error('❌ خطأ في تحديث كلمة المرور:', error);
      return;
    }

    console.log('✅ تم تحديث كلمة المرور بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

updateUserPassword();