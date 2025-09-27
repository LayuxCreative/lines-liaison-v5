const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// إنشاء axios instance مع إعدادات cookies
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// متغير لحفظ cookies
let sessionCookies = '';

// إضافة interceptor لمعالجة cookies
axiosInstance.interceptors.response.use(
  (response) => {
    // حفظ cookies من response headers
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      sessionCookies = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.request.use(
  (config) => {
    // إضافة cookies إلى كل request
    if (sessionCookies) {
      config.headers.Cookie = sessionCookies;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function testTasksWithProjectNames() {
  try {
    console.log('🔍 اختبار جلب المهام مع أسماء المشاريع...');

    // 1. تسجيل الدخول
    console.log('1. تسجيل الدخول...');
    const loginResponse = await axiosInstance.post('/auth/login', {
      email: 'testuser@gmail.com',
      password: 'Test123!@#'
    });

    console.log('✅ تم تسجيل الدخول بنجاح');

    // 2. الحصول على معلومات المستخدم
    console.log('2. الحصول على معلومات المستخدم...');
    const userResponse = await axiosInstance.get('/auth/me');
    const userId = userResponse.data.user.id;
    console.log('✅ معرف المستخدم:', userId);

    // 3. جلب جميع المهام
    console.log('3. جلب جميع المهام...');
    const allTasksResponse = await axiosInstance.get('/tasks');
    console.log('✅ تم جلب المهام بنجاح!');
    console.log('📋 عدد المهام:', allTasksResponse.data.length);
    
    if (allTasksResponse.data.length > 0) {
      console.log('📋 أول مهمة:', JSON.stringify(allTasksResponse.data[0], null, 2));
    }

    // 4. جلب المهام حسب المستخدم
    console.log('4. جلب المهام حسب المستخدم...');
    const userTasksResponse = await axiosInstance.get(`/tasks?assigneeId=${userId}`);
    console.log('✅ تم جلب مهام المستخدم بنجاح!');
    console.log('📋 عدد مهام المستخدم:', userTasksResponse.data.length);
    
    if (userTasksResponse.data.length > 0) {
      console.log('📋 أول مهمة للمستخدم:', JSON.stringify(userTasksResponse.data[0], null, 2));
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار جلب المهام:');
    console.log('📋 رمز الحالة:', error.response?.status);
    console.log('📋 رسالة الخطأ:', error.response?.data);
  }
}

testTasksWithProjectNames();