// إعداد متغيرات Supabase للمثال
// في الإنتاج، يجب استخدام متغيرات البيئة الآمنة

// دالة آمنة لتحميل الإعدادات من متغيرات البيئة
const loadSupabaseConfig = () => {
  // محاولة الحصول على القيم من متغيرات البيئة
  const envUrl = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : null;
  const envKey = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : null;
  
  // القيم الافتراضية للتطوير فقط
  const defaultUrl = 'https://mtpnlowzrbdqkbxjgpvm.supabase.co';
  
  return {
    url: envUrl || defaultUrl,
    key: envKey || null // لا نضع مفتاح افتراضي لأسباب أمنية
  };
};

// تطبيق الإعدادات
const config = loadSupabaseConfig();
window.SUPABASE_URL = config.url;

// التحقق من وجود المفتاح
if (config.key) {
  window.SUPABASE_ANON_KEY = config.key;
  console.log('🔧 تم تحميل إعدادات Supabase من متغيرات البيئة');
} else {
  console.warn('⚠️ لم يتم العثور على VITE_SUPABASE_ANON_KEY في متغيرات البيئة');
  console.warn('📝 يرجى إضافة المفتاح إلى ملف .env أو استخدام المطالبة التفاعلية');
  window.SUPABASE_ANON_KEY = null;
}