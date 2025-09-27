const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function registerTestUser() {
  try {
    console.log('🔄 تسجيل مستخدم جديد...');
    
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'testuser@gmail.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User'
    });

    console.log('✅ تم تسجيل المستخدم بنجاح:', response.data);
    
  } catch (error) {
    console.error('❌ خطأ في تسجيل المستخدم:');
    console.error('📋 رمز الحالة:', error.response?.status);
    console.error('📋 رسالة الخطأ:', error.response?.data);
  }
}

registerTestUser();