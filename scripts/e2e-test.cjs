const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

// بيانات المستخدم للاختبار
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// متغيرات عامة
let sessionToken = null;
let userId = null;
let projectId = null;

// دالة مساعدة لاستخراج session token من cookies
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

// دالة مساعدة لطلبات مصادقة
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

// اختبار تسجيل الدخول
async function testLogin() {
  console.log('\n🔐 اختبار تسجيل الدخول...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    
    if (response.status === 200) {
      sessionToken = extractSessionToken(response);
      console.log('✅ تم تسجيل الدخول بنجاح');
      console.log(`📝 Session Token: ${sessionToken ? 'موجود' : 'غير موجود'}`);
      return true;
    }
  } catch (error) {
    console.error('❌ فشل تسجيل الدخول:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار الحصول على معلومات المستخدم
async function testGetUserInfo() {
  console.log('\n👤 اختبار الحصول على معلومات المستخدم...');
  
  try {
    const response = await authenticatedRequest('GET', '/api/auth/me');
    
    if (response.status === 200 && response.data.user) {
      userId = response.data.user.id;
      console.log('✅ تم الحصول على معلومات المستخدم بنجاح');
      console.log(`📧 البريد الإلكتروني: ${response.data.user.email}`);
      console.log(`🆔 معرف المستخدم: ${userId}`);
      return true;
    }
  } catch (error) {
    console.error('❌ فشل الحصول على معلومات المستخدم:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار إنشاء مشروع
async function testCreateProject() {
  console.log('\n📁 اختبار إنشاء مشروع...');
  const projectData = {
    name: `مشروع اختبار E2E - ${new Date().toISOString()}`,
    description: 'مشروع تم إنشاؤه لاختبار E2E'
  };
  
  try {
    const response = await authenticatedRequest('POST', '/api/projects', projectData);
    
    if (response.status === 201 && response.data.project) {
      projectId = response.data.project.id;
      console.log('✅ تم إنشاء المشروع بنجاح');
      console.log(`📝 عنوان المشروع: ${response.data.project.title}`);
      console.log(`🆔 معرف المشروع: ${projectId}`);
      return true;
    }
  } catch (error) {
    console.error('❌ فشل إنشاء المشروع:', error.response?.data?.error || error.response?.data?.message || error.message);
    console.error('📋 بيانات المشروع المرسلة:', projectData);
    if (error.response?.data) {
      console.error('📋 استجابة الخادم:', error.response.data);
    }
    return false;
  }
}

// اختبار استرجاع المشاريع
async function testGetProjects() {
  console.log('\n📋 اختبار استرجاع المشاريع...');
  
  try {
    const response = await authenticatedRequest('GET', `/api/projects/${userId}`);
    
    if (response.status === 200) {
      const projects = response.data.projects || [];
      console.log(`✅ تم استرجاع المشاريع بنجاح (${projects.length} مشروع)`);
      
      if (projects.length > 0) {
        console.log('📋 قائمة المشاريع:');
        projects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.title} (ID: ${project.id})`);
        });
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ فشل استرجاع المشاريع:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار إنشاء مهمة
async function testCreateTask() {
  console.log('\n✅ اختبار إنشاء مهمة...');
  
  if (!projectId) {
    console.log('⚠️ لا يوجد مشروع لإنشاء مهمة فيه');
    return false;
  }
  
  const taskData = {
    title: 'مهمة اختبار E2E',
    description: 'مهمة تم إنشاؤها لاختبار E2E',
    project_id: projectId,
    priority: 'medium',
    status: 'pending'
  };
  
  try {
    const response = await authenticatedRequest('POST', '/api/tasks', taskData);
    
    if (response.status === 201 && response.data.task) {
      console.log('✅ تم إنشاء المهمة بنجاح');
      console.log(`📝 عنوان المهمة: ${response.data.task.title}`);
      console.log(`🆔 معرف المهمة: ${response.data.task.id}`);
      return true;
    }
  } catch (error) {
    console.error('❌ فشل إنشاء المهمة:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار استرجاع المهام
async function testGetTasks() {
  console.log('\n📝 اختبار استرجاع المهام...');
  
  if (!projectId) {
    console.log('⚠️ لا يوجد مشروع لاسترجاع المهام منه');
    return false;
  }
  
  try {
    const response = await authenticatedRequest('GET', `/api/tasks/project/${projectId}`);
    
    if (response.status === 200) {
      const tasks = response.data.tasks || [];
      console.log(`✅ تم استرجاع المهام بنجاح (${tasks.length} مهمة)`);
      
      if (tasks.length > 0) {
        console.log('📝 قائمة المهام:');
        tasks.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.title} - ${task.status} (ID: ${task.id})`);
        });
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ فشل استرجاع المهام:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار الملف الشخصي
async function testProfile() {
  console.log('\n👤 اختبار الملف الشخصي...');
  
  try {
    const response = await authenticatedRequest('GET', `/api/profiles/${userId}`);
    
    if (response.status === 200 && response.data.profile) {
      console.log('✅ تم استرجاع الملف الشخصي بنجاح');
      console.log(`📧 البريد الإلكتروني: ${response.data.profile.email}`);
      console.log(`👤 الاسم الكامل: ${response.data.profile.full_name || 'غير محدد'}`);
      return true;
    }
  } catch (error) {
    console.error('❌ فشل استرجاع الملف الشخصي:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار تسجيل الخروج
async function testLogout() {
  console.log('\n🚪 اختبار تسجيل الخروج...');
  
  try {
    const response = await authenticatedRequest('POST', '/api/auth/logout');
    
    if (response.status === 200) {
      console.log('✅ تم تسجيل الخروج بنجاح');
      sessionToken = null;
      return true;
    }
  } catch (error) {
    console.error('❌ فشل تسجيل الخروج:', error.response?.data?.message || error.message);
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runE2ETests() {
  console.log('🚀 بدء اختبارات E2E لنظام Lines Liaison V5');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'تسجيل الدخول', fn: testLogin },
    { name: 'معلومات المستخدم', fn: testGetUserInfo },
    { name: 'إنشاء مشروع', fn: testCreateProject },
    { name: 'استرجاع المشاريع', fn: testGetProjects },
    { name: 'إنشاء مهمة', fn: testCreateTask },
    { name: 'استرجاع المهام', fn: testGetTasks },
    { name: 'الملف الشخصي', fn: testProfile },
    { name: 'تسجيل الخروج', fn: testLogout }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      console.error(`❌ خطأ في اختبار ${test.name}:`, error.message);
      failedTests++;
    }
    
    // انتظار قصير بين الاختبارات
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 نتائج اختبارات E2E:');
  console.log(`✅ اختبارات نجحت: ${passedTests}`);
  console.log(`❌ اختبارات فشلت: ${failedTests}`);
  console.log(`📈 معدل النجاح: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 جميع اختبارات E2E نجحت! النظام يعمل بشكل مثالي.');
  } else {
    console.log('\n⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
  }
}

// تشغيل الاختبارات
if (require.main === module) {
  runE2ETests().catch(error => {
    console.error('❌ خطأ عام في اختبارات E2E:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runE2ETests,
  testLogin,
  testGetUserInfo,
  testCreateProject,
  testGetProjects,
  testCreateTask,
  testGetTasks,
  testProfile,
  testLogout
};