const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let sessionToken = null;
let userId = null;

function extractSessionToken(response) {
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader) {
    for (const cookie of setCookieHeader) {
      if (cookie.includes('session_token=')) {
        return cookie.split('session_token=')[1].split(';')[0];
      }
    }
  }
  return null;
}

async function authenticatedRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session_token=${sessionToken}`
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

async function debugProjectCreation() {
  console.log('🔍 تشخيص مشكلة إنشاء المشروع...\n');
  
  // تسجيل الدخول
  console.log('1. تسجيل الدخول...');
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    sessionToken = extractSessionToken(loginResponse);
    console.log('✅ تم تسجيل الدخول بنجاح');
  } catch (error) {
    console.error('❌ فشل تسجيل الدخول:', error.message);
    return;
  }
  
  // الحصول على معلومات المستخدم
  console.log('\n2. الحصول على معلومات المستخدم...');
  try {
    const userResponse = await authenticatedRequest('GET', '/api/auth/me');
    userId = userResponse.data.user.id;
    console.log('✅ معرف المستخدم:', userId);
  } catch (error) {
    console.error('❌ فشل الحصول على معلومات المستخدم:', error.message);
    return;
  }
  
  // محاولة إنشاء مشروع بطرق مختلفة
  const testCases = [
    {
      name: 'بيانات أساسية فقط',
      data: {
        name: 'مشروع تجريبي 1'
      }
    },
    {
      name: 'مع وصف',
      data: {
        name: 'مشروع تجريبي 2',
        description: 'وصف المشروع'
      }
    },
    {
      name: 'مع client_id صريح',
      data: {
        name: 'مشروع تجريبي 3',
        description: 'وصف المشروع',
        client_id: userId
      }
    },
    {
      name: 'مع manager_id صريح',
      data: {
        name: 'مشروع تجريبي 4',
        description: 'وصف المشروع',
        manager_id: userId
      }
    },
    {
      name: 'مع client_id و manager_id',
      data: {
        name: 'مشروع تجريبي 5',
        description: 'وصف المشروع',
        client_id: userId,
        manager_id: userId
      }
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 3}. اختبار إنشاء مشروع - ${testCase.name}:`);
    console.log('📋 البيانات المرسلة:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const response = await authenticatedRequest('POST', '/api/projects', testCase.data);
      console.log('✅ نجح إنشاء المشروع!');
      console.log('📋 الاستجابة:', JSON.stringify(response.data, null, 2));
      break; // إذا نجح، توقف عن المحاولة
    } catch (error) {
      console.error('❌ فشل إنشاء المشروع');
      console.error('📋 كود الخطأ:', error.response?.status);
      console.error('📋 رسالة الخطأ:', error.response?.data?.error || error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.error('📋 تفاصيل الاستجابة:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  console.log('\n🔍 انتهى التشخيص');
}

debugProjectCreation().catch(error => {
  console.error('❌ خطأ عام:', error.message);
});