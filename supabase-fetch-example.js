// مثال استخدام Fetch API مع Supabase
// يستخدم متغيرات البيئة للحماية الأمنية

// تحميل متغيرات البيئة
require('dotenv').config();

// إعداد متغيرات Supabase من البيئة
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mtpnlowzrbdqkbxjgpvm.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// التحقق من وجود المفتاح
if (!SUPABASE_ANON_KEY) {
  console.error('❌ خطأ: لم يتم العثور على VITE_SUPABASE_ANON_KEY في متغيرات البيئة');
  console.log('📝 يرجى إضافة المفتاح إلى ملف .env');
  process.exit(1);
}

// دالة لجلب البيانات من جدول countries
async function fetchCountries() {
  try {
    console.log('🔄 جاري جلب البيانات من جدول countries...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/countries`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ تم جلب البيانات بنجاح:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في جلب البيانات:', error.message);
    throw error;
  }
}

// دالة لإضافة دولة جديدة
async function addCountry(countryData) {
  try {
    console.log('🔄 جاري إضافة دولة جديدة...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/countries`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(countryData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ تم إضافة الدولة بنجاح:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في إضافة الدولة:', error.message);
    throw error;
  }
}

// دالة لتحديث دولة
async function updateCountry(id, updateData) {
  try {
    console.log(`🔄 جاري تحديث الدولة رقم ${id}...`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/countries?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ تم تحديث الدولة بنجاح:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في تحديث الدولة:', error.message);
    throw error;
  }
}

// دالة لحذف دولة
async function deleteCountry(id) {
  try {
    console.log(`🔄 جاري حذف الدولة رقم ${id}...`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/countries?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ تم حذف الدولة بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف الدولة:', error.message);
    throw error;
  }
}

// دالة رئيسية لتشغيل الأمثلة
async function main() {
  try {
    console.log('🚀 بدء تشغيل أمثلة Fetch API مع Supabase\n');
    
    // جلب جميع الدول
    await fetchCountries();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // مثال على إضافة دولة جديدة (اختياري)
    // await addCountry({
    //   name: 'مصر',
    //   code: 'EG',
    //   continent: 'أفريقيا'
    // });
    
  } catch (error) {
    console.error('❌ خطأ في التطبيق الرئيسي:', error.message);
  }
}

// تشغيل التطبيق إذا تم استدعاؤه مباشرة
if (require.main === module) {
  main();
}

// تصدير الدوال للاستخدام في ملفات أخرى
module.exports = {
  fetchCountries,
  addCountry,
  updateCountry,
  deleteCountry
};