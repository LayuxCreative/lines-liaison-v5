# 🚀 Environment Setup Guide - Lines Liaison

## 📋 Overview

This guide explains how to set up environment variables for the Lines Liaison project (React + Vite + Node.js + Supabase).

## 🏗️ Project Structure

```
lines-liaison/
├── .env                    # متغيرات البيئة (لا ترفع إلى Git)
├── .env.example           # نموذج المتغيرات
├── backend/
│   ├── server.js          # خادم Node.js
│   └── utils/
│       ├── checkEnv.js    # فحص المتغيرات (JavaScript)
│       └── checkEnv.ts    # فحص المتغيرات (TypeScript)
└── src/                   # تطبيق React
```

## ⚙️ Local Setup

### 1. Copy Environment File

```bash
cp .env.example .env
```

### 2. Get Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project or create a new one
3. From Settings > API:
   - Copy `Project URL` to `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - Copy `anon public` to `VITE_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - Copy `service_role` to `SUPABASE_SERVICE_ROLE_KEY` (for server only)

### 3. توليد JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

انسخ النتيجة إلى `JWT_SECRET` في ملف `.env`.

### 4. تحديث URLs

```env
# للتطوير المحلي
VITE_API_URL=http://localhost:3001/api
API_ORIGIN=http://localhost:3001
WEB_ORIGIN=http://localhost:5174
```

### 5. فحص الإعداد

```bash
node backend/utils/checkEnv.js
```

### 6. تشغيل المشروع

```bash
# تشغيل الخادم (Terminal 1)
cd backend
npm start

# تشغيل الواجهة (Terminal 2)
npm run dev
```

## 🔒 الأمان

### متغيرات عامة (Frontend)
- تبدأ بـ `VITE_`
- مرئية في المتصفح
- **لا تضع مفاتيح سرية هنا**

### متغيرات سرية (Backend)
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- **لا تصل للمتصفح أبداً**

## 🌐 النشر

### Vercel (Frontend)

1. في Vercel Dashboard > Settings > Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-api-domain.com/api
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_NAME=LiNES AND LiAiSON Professional Platform
```

2. **لا تضع** `SUPABASE_SERVICE_ROLE_KEY` في Vercel

### خادم منفصل (Backend)

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_ORIGIN=https://your-api-domain.com
WEB_ORIGIN=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com
JWT_SECRET=your_production_jwt_secret
```

### Railway/Render/DigitalOcean

1. أضف جميع المتغيرات في لوحة التحكم
2. غيّر URLs إلى نطاقات الإنتاج
3. استخدم HTTPS في الإنتاج

## 🧪 اختبار الإعداد

### 1. فحص الاتصال بـ Supabase

```bash
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://your-project.supabase.co/rest/v1/
```

### 2. فحص API المحلي

```bash
curl http://localhost:3001/api/health
```

### 3. فحص API مع JWT

```bash
# احصل على JWT من تسجيل الدخول أولاً
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/tasks
```

## 🐛 حل المشاكل

### خطأ CORS

```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:5174' has been blocked by CORS policy
```

**الحل:**
- تأكد من `ALLOWED_ORIGINS=http://localhost:5174` في `.env`
- أعد تشغيل الخادم

### خطأ Supabase Connection

```
Invalid API key or URL
```

**الحل:**
- تحقق من `SUPABASE_URL` و `SUPABASE_ANON_KEY`
- تأكد من أن المشروع نشط في Supabase

### خطأ JWT

```
JsonWebTokenError: invalid token
```

**الحل:**
- تأكد من `JWT_SECRET` في الخادم
- تحقق من صحة الـ token المرسل

### صفحة بيضاء

**الحل:**
1. افتح Developer Tools (F12)
2. تحقق من Console للأخطاء
3. تأكد من متغيرات `VITE_*`
4. أعد بناء المشروع: `npm run build`

## 📝 ملاحظات مهمة

1. **لا ترفع `.env` إلى Git**
2. استخدم `.env.local` للتطوير المحلي
3. استخدم Secrets في منصات النشر
4. غيّر `JWT_SECRET` في الإنتاج
5. استخدم HTTPS في الإنتاج

## 🆘 الدعم

إذا واجهت مشاكل:

1. شغّل `node backend/utils/checkEnv.js`
2. تحقق من السجلات: `npm run dev`
3. تأكد من إعدادات Supabase
4. راجع هذا الدليل

---

**تم إنشاؤه بواسطة:** مهندس DevOps  
**التاريخ:** يناير 2025  
**الإصدار:** 1.0