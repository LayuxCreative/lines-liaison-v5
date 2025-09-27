import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '../backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to generate strong password
function generateStrongPassword(length = 16) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Function to update user password
async function updateUserPassword(userId, newPassword) {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    
    if (error) {
      console.error(`Error updating password for user ${userId}:`, error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception updating password for user ${userId}:`, error.message);
    return false;
  }
}

// Main function
async function updateAllPasswords() {
  try {
    console.log('🔄 جاري جلب قائمة المستخدمين...');
    
    // Get all users
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error.message);
      return;
    }
    
    console.log(`📋 تم العثور على ${users.users.length} مستخدم`);
    
    const updatedPasswords = [];
    
    for (const user of users.users) {
      const newPassword = generateStrongPassword(16);
      const success = await updateUserPassword(user.id, newPassword);
      
      if (success) {
        updatedPasswords.push({
          email: user.email,
          password: newPassword,
          userId: user.id
        });
        console.log(`✅ تم تحديث كلمة المرور للمستخدم: ${user.email}`);
      } else {
        console.log(`❌ فشل في تحديث كلمة المرور للمستخدم: ${user.email}`);
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🔐 كلمات المرور الجديدة:');
    console.log('='.repeat(60));
    
    updatedPasswords.forEach(user => {
      console.log(`📧 الإيميل: ${user.email}`);
      console.log(`🔑 كلمة المرور: ${user.password}`);
      console.log('-'.repeat(40));
    });
    
    console.log(`\n✅ تم تحديث ${updatedPasswords.length} كلمة مرور بنجاح`);
    
    // Save to file for reference
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `password-updates-${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(updatedPasswords, null, 2));
    console.log(`💾 تم حفظ كلمات المرور في الملف: ${filename}`);
    
  } catch (error) {
    console.error('خطأ في العملية:', error.message);
  }
}

// Run the script
updateAllPasswords();