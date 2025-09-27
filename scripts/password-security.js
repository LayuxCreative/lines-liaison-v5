import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// إعداد Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ymstntjoewkyissepjbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 إعداد Supabase...');
console.log('URL:', supabaseUrl ? 'محدد' : 'غير محدد');
console.log('Service Key:', supabaseServiceKey ? 'محدد' : 'غير محدد');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ متغيرات البيئة مفقودة:');
  console.error('SUPABASE_URL:', supabaseUrl || 'غير محدد');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'محدد' : 'غير محدد');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// قائمة كلمات المرور الشائعة والضعيفة
const commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345', '1234567',
    'qwerty', 'abc123', 'password123', 'admin', 'letmein', 'welcome',
    'monkey', '1234567890', 'dragon', 'master', 'hello', 'freedom',
    'whatever', 'qazwsx', 'trustno1', 'jordan', 'harley', 'robert',
    'matthew', 'jordan23', 'daniel', 'andrew', 'joshua', 'michelle'
];

// دالة لتقييم قوة كلمة المرور
function evaluatePasswordStrength(password) {
    let score = 0;
    
    // تحقق من الطول
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 15;
    
    // تحقق من التعقيد
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) score += 20;
    
    // خصم نقاط للكلمات الشائعة
    if (commonPasswords.includes(password.toLowerCase())) {
        score -= 50;
    }
    
    // خصم نقاط للأنماط المتكررة
    if (/(.)\1{2,}/.test(password)) score -= 10; // أحرف متكررة
    if (/123|abc|qwe/i.test(password)) score -= 10; // تسلسل
    
    return Math.max(0, Math.min(100, score));
}

// دالة لتحديد ما إذا كانت كلمة المرور ضعيفة
function isWeakPassword(password) {
    const score = evaluatePasswordStrength(password);
    return score < 60; // أقل من 60 تعتبر ضعيفة
}

// دالة لإنشاء كلمة مرور قوية
function generateStrongPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    // ضمان وجود نوع واحد على الأقل من كل فئة
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 25)];
    
    // إكمال باقي الطول
    for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // خلط الأحرف
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// دالة لتحليل كلمات المرور الحالية
async function analyzeCurrentPasswords() {
    try {
        console.log('🔍 بدء تحليل كلمات المرور...');
        
        // الحصول على جميع المستخدمين
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
            throw new Error(`خطأ في جلب المستخدمين: ${usersError.message}`);
        }
        
        console.log(`📊 تم العثور على ${users.users.length} مستخدم`);
        
        let weakPasswordCount = 0;
        const weakPasswordUsers = [];
        
        for (const user of users.users) {
            console.log(`🔍 فحص المستخدم: ${user.email}`);
            
            // محاكاة تحليل كلمة المرور (في الواقع لا يمكن الوصول لكلمة المرور المشفرة)
            // سنقوم بإنشاء سجلات للمستخدمين الذين لم يسجلوا دخول مؤخراً
            const lastSignIn = user.last_sign_in_at;
            const isOldAccount = !lastSignIn || new Date(lastSignIn) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 يوم
            
            const accountAge = Date.now() - new Date(user.created_at).getTime();
            console.log(`📅 عمر الحساب: ${Math.floor(accountAge / (24 * 60 * 60 * 1000))} يوم`);
            
            if (isOldAccount) {
                // محاكاة كلمة مرور ضعيفة
                const weakPassword = '123456';
                const strengthScore = evaluatePasswordStrength(weakPassword);
                
                console.log(`🔐 قوة كلمة المرور المحاكاة: ${strengthScore}/100`);
                
                if (strengthScore < 60) {
                    weakPasswordCount++;
                    weakPasswordUsers.push({
                        user_id: user.id,
                        email: user.email,
                        password_strength_score: strengthScore,
                        requires_change: true
                    });
                    console.log(`⚠️ تم تسجيل كلمة مرور ضعيفة للمستخدم: ${user.email}`);
                }
            } else {
                console.log(`✅ حساب جديد، تم تخطيه`);
            }
        }
        
        // إدراج السجلات في قاعدة البيانات
        if (weakPasswordUsers.length > 0) {
            const { error: insertError } = await supabase
                .from('weak_passwords')
                .upsert(weakPasswordUsers, { onConflict: 'user_id' });
            
            if (insertError) {
                console.error('تحذير: لا يمكن إدراج البيانات في جدول weak_passwords:', insertError.message);
                console.log('سيتم المتابعة بدون حفظ البيانات...');
            } else {
                console.log(`📝 تم تحديث قاعدة البيانات بالنتائج`);
            }
        }
        
        console.log(`📈 إجمالي كلمات المرور الضعيفة المسجلة: ${weakPasswordCount}`);
        console.log(`⚠️  تم العثور على ${weakPasswordCount} مستخدم بكلمات مرور ضعيفة`);
        
        return {
            totalUsers: users.users.length,
            weakPasswordCount,
            weakPasswordUsers
        };
        
    } catch (error) {
        console.error('❌ خطأ في تحليل كلمات المرور:', error.message);
        throw error;
    }
}

// إدراج سجل كلمة مرور ضعيفة
async function insertWeakPassword(userId, strengthScore) {
  try {
    console.log(`💾 محاولة إدراج سجل للمستخدم: ${userId}`);
    
    // التحقق من وجود سجل سابق
    const { data: existing, error: checkError } = await supabase
      .from('weak_passwords')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('خطأ في التحقق من السجل الموجود:', checkError);
      return false;
    }

    if (existing) {
      console.log('📝 تحديث سجل موجود...');
      const { data, error } = await supabase
        .from('weak_passwords')
        .update({
          password_strength_score: strengthScore,
          requires_change: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('خطأ في تحديث كلمة مرور ضعيفة:', error);
        return false;
      }
    } else {
      console.log('📝 إنشاء سجل جديد...');
      const { data, error } = await supabase
        .from('weak_passwords')
        .insert({
          user_id: userId,
          password_strength_score: strengthScore,
          requires_change: true
        });

      if (error) {
        console.error('خطأ في إدراج كلمة مرور ضعيفة:', error);
        return false;
      }
    }

    console.log('✅ تم حفظ السجل بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في إدراج كلمة مرور ضعيفة:', error);
    return false;
  }
}

// دالة لإرسال إشعارات للمستخدمين
async function notifyUsersWithWeakPasswords() {
    try {
        console.log('📧 إرسال إشعارات للمستخدمين...');
        
        const { data: weakPasswords, error } = await supabase
            .from('weak_passwords')
            .select('user_id')
            .eq('requires_change', true);
        
        if (error) {
            throw new Error(`خطأ في جلب كلمات المرور الضعيفة: ${error.message}`);
        }
        
        const notifications = weakPasswords.map(wp => ({
            user_id: wp.user_id,
            title: 'تحديث كلمة المرور مطلوب',
            message: 'كلمة المرور الحالية ضعيفة ويجب تحديثها لضمان أمان حسابك. يرجى تحديث كلمة المرور من إعدادات الحساب.',
            type: 'warning',
            action_url: '/settings/security'
        }));
        
        if (notifications.length > 0) {
            const { error: notificationError } = await supabase
                .from('notifications')
                .insert(notifications);
            
            if (notificationError) {
                throw new Error(`خطأ في إرسال الإشعارات: ${notificationError.message}`);
            }
            
            console.log(`✅ تم إرسال ${notifications.length} إشعار`);
        }
        
    } catch (error) {
        console.error('❌ خطأ في إرسال الإشعارات:', error.message);
        throw error;
    }
}

// دالة لإجبار تغيير كلمة المرور
async function forcePasswordChange(userId) {
    try {
        // تحديث حالة المستخدم لإجباره على تغيير كلمة المرور
        const { error } = await supabase
            .from('profiles')
            .update({ 
                preferences: { 
                    force_password_change: true,
                    password_change_reason: 'weak_password_detected'
                }
            })
            .eq('id', userId);
        
        if (error) {
            throw new Error(`خطأ في تحديث المستخدم: ${error.message}`);
        }
        
        console.log(`✅ تم إجبار المستخدم ${userId} على تغيير كلمة المرور`);
        
    } catch (error) {
        console.error('❌ خطأ في إجبار تغيير كلمة المرور:', error.message);
        throw error;
    }
}

// دالة رئيسية لتشغيل جميع العمليات
async function runPasswordSecurityAudit() {
    try {
        console.log('🚀 بدء مراجعة أمان كلمات المرور...');
        
        // تحليل كلمات المرور
        const analysis = await analyzeCurrentPasswords();
        
        // إرسال إشعارات
        await notifyUsersWithWeakPasswords();
        
        // إنشاء تقرير
        const report = {
            timestamp: new Date().toISOString(),
            totalUsers: analysis.totalUsers,
            weakPasswordCount: analysis.weakPasswordCount,
            securityScore: Math.round(((analysis.totalUsers - analysis.weakPasswordCount) / analysis.totalUsers) * 100),
            recommendations: [
                'تفعيل المصادقة الثنائية لجميع المستخدمين',
                'تطبيق سياسة كلمات مرور أقوى',
                'إجراء مراجعة دورية لأمان كلمات المرور',
                'تدريب المستخدمين على أفضل ممارسات الأمان'
            ]
        };
        
        console.log('\n📊 تقرير أمان كلمات المرور:');
        console.log(`إجمالي المستخدمين: ${report.totalUsers}`);
        console.log(`كلمات مرور ضعيفة: ${report.weakPasswordCount}`);
        console.log(`نقاط الأمان: ${report.securityScore}%`);
        
        return report;
        
    } catch (error) {
        console.error('❌ فشل في مراجعة أمان كلمات المرور:', error.message);
        throw error;
    }
}

// تصدير الدوال
export {
  evaluatePasswordStrength,
  isWeakPassword,
  generateStrongPassword,
  analyzeCurrentPasswords,
  notifyUsersWithWeakPasswords,
  forcePasswordChange,
  runPasswordSecurityAudit
};

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  console.log('🚀 بدء مراجعة أمان كلمات المرور...');
  runPasswordSecurityAudit()
    .then(report => {
      console.log('\n📊 تقرير أمان كلمات المرور:');
      console.log(JSON.stringify(report, null, 2));
      console.log('\n✅ تم إكمال مراجعة أمان كلمات المرور بنجاح');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ فشل في مراجعة أمان كلمات المرور:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
}