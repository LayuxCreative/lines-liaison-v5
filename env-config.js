// ملف الإعدادات الآمن - يجب عدم رفعه إلى Git
// أضف هذا الملف إلى .gitignore

// دالة لقراءة الإعدادات من متغيرات البيئة أو localStorage
const loadEnvironmentConfig = () => {
  // محاولة قراءة من متغيرات البيئة أولاً
  const envUrl = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : null;
  const envKey = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : null;
  
  // محاولة قراءة من localStorage كبديل
  const storageUrl = localStorage.getItem('supabase_url');
  const storageKey = localStorage.getItem('supabase_anon_key');
  
  return {
    url: envUrl || storageUrl || 'https://mtpnlowzrbdqkbxjgpvm.supabase.co',
    anonKey: envKey || storageKey || null
  };
};

// تحميل الإعدادات
const config = loadEnvironmentConfig();

// تصدير الإعدادات للاستخدام العام
window.SUPABASE_URL = config.url;
window.SUPABASE_ANON_KEY = config.anonKey;

// رسائل التحقق
if (config.anonKey) {
  console.log('🔧 تم تحميل إعدادات Supabase من env-config.js');
} else {
  console.warn('⚠️ لم يتم العثور على مفتاح Supabase. يرجى إضافته إلى متغيرات البيئة أو localStorage');
}