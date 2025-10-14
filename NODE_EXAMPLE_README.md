# Node.js Supabase Example

هذا مثال لاستخدام Supabase مع Node.js

## التثبيت

```bash
# تثبيت المكتبات المطلوبة
npm install @supabase/supabase-js dotenv
```

## الإعداد

1. تأكد من وجود ملف `.env` مع المتغيرات التالية:
```env
VITE_SUPABASE_URL=https://mtpnlowzrbdqkbxjgpvm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## تشغيل المثال

```bash
node supabase-node-example.js
```

## الملفات

- `supabase-node-example.js` - الملف الرئيسي مع مثال Supabase
- `node-example-package.json` - ملف package.json للمشروع
- `.env` - متغيرات البيئة (موجود بالفعل في المشروع)

## الميزات

- اتصال آمن بـ Supabase باستخدام متغيرات البيئة
- مثال على استعلام البيانات من جدول `todos`
- معالجة الأخطاء
- استخدام ES6 modules

## ملاحظات الأمان

- لا تضع JWT tokens مباشرة في الكود
- استخدم متغيرات البيئة دائماً
- تأكد من إضافة `.env` إلى `.gitignore`