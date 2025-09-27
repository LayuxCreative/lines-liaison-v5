const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// إنشاء axios instance مع إعدادات cookies وjar
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// إضافة interceptor للتعامل مع cookies
let sessionCookie = null;

axiosInstance.interceptors.response.use(
  (response) => {
    // حفظ session cookie من response headers
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const sessionCookieMatch = setCookieHeader.find(cookie => cookie.includes('session_token'));
      if (sessionCookieMatch) {
        sessionCookie = sessionCookieMatch.split(';')[0];
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.request.use(
  (config) => {
    // إضافة session cookie للطلبات
    if (sessionCookie) {
      config.headers.Cookie = sessionCookie;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function testTaskCreation() {
  console.log('🔍 اختبار إنشاء المهام...\n');

  try {
    // 1. تسجيل الدخول بالمستخدم الجديد
    console.log('1. تسجيل الدخول...');
    const loginResponse = await axiosInstance.post('/auth/login', {
      email: 'testuser@gmail.com',
      password: 'Test123!@#'
    });

    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. الحصول على معلومات المستخدم
    console.log('2. الحصول على معلومات المستخدم...');
    const userResponse = await axiosInstance.get('/auth/me');
    
    const userId = userResponse.data.user.id;
    console.log(`✅ معرف المستخدم: ${userId}\n`);

    // 3. إنشاء مشروع جديد
    console.log('3. إنشاء مشروع جديد...');
    const projectResponse = await axiosInstance.post('/projects', {
      name: 'مشروع اختبار المهام',
      description: 'مشروع لاختبار إنشاء المهام',
      status: 'active'
    });

    const projectId = projectResponse.data.project.id;
    console.log(`✅ تم إنشاء المشروع بنجاح - ID: ${projectId}\n`);

    // 4. إنشاء مهمة جديدة
    console.log('4. إنشاء مهمة جديدة...');
    const taskResponse = await axiosInstance.post('/tasks', {
      title: 'مهمة اختبار',
      description: 'وصف مهمة الاختبار',
      project_id: projectId,
      assignee_id: userId,
      status: 'todo',
      priority: 'medium'
    });

    console.log('✅ تم إنشاء المهمة بنجاح!');
    console.log('📋 المهمة المنشأة:', taskResponse.data);

  } catch (error) {
    console.error('❌ خطأ في اختبار إنشاء المهام:');
    if (error.response) {
      console.error('📋 رمز الحالة:', error.response.status);
      console.error('📋 رسالة الخطأ:', error.response.data);
    } else {
      console.error('📋 تفاصيل الخطأ:', error.message);
    }
  }
}

testTaskCreation();