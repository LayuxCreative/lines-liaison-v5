# Deno Supabase Example

هذا مثال لاستخدام Supabase مع Deno

## المتطلبات

- Deno 1.40+ مثبت على النظام
- ملف `.env` مع متغيرات Supabase

## التثبيت

لا حاجة لتثبيت مكتبات إضافية، Deno سيقوم بتحميل المكتبات تلقائياً من JSR.

## الإعداد

1. تأكد من وجود ملف `.env` مع المتغيرات التالية:
```env
VITE_SUPABASE_URL=https://mtpnlowzrbdqkbxjgpvm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## تشغيل المثال

```bash
# تشغيل مباشر
deno run --allow-net --allow-env supabase-deno-example.ts

# أو استخدام المهام المعرفة في deno.json
deno task start

# للتطوير مع المراقبة التلقائية
deno task dev
```

## الملفات

- `supabase-deno-example.ts` - الملف الرئيسي مع مثال Supabase
- `deno.json` - ملف التكوين لـ Deno
- `.env` - متغيرات البيئة (موجود بالفعل في المشروع)

## الميزات

- ✅ اتصال آمن بـ Supabase باستخدام متغيرات البيئة
- ✅ مثال على استعلام البيانات من جدول `todos`
- ✅ مثال على إدراج بيانات جديدة
- ✅ معالجة الأخطاء
- ✅ استخدام TypeScript
- ✅ استيراد المكتبات من JSR

## الأذونات المطلوبة

- `--allow-net` - للاتصال بـ Supabase
- `--allow-env` - لقراءة متغيرات البيئة

## ملاحظات الأمان

- 🔒 لا تضع JWT tokens مباشرة في الكود
- 🔒 استخدم متغيرات البيئة دائماً
- 🔒 تأكد من إضافة `.env` إلى `.gitignore`

## مقارنة مع Node.js

| الميزة | Deno | Node.js |
|--------|------|---------|
| إدارة المكتبات | JSR/URL | npm |
| TypeScript | مدمج | يحتاج تكوين |
| الأذونات | صريحة | مفتوحة |
| الأمان | أعلى | أقل |