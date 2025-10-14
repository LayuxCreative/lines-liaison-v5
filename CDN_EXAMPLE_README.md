# مثال Supabase CDN

## الوصف
مثال HTML بسيط يوضح كيفية استخدام Supabase مع CDN في المتصفح مباشرة.

## الملفات
- `supabase-cdn-example.html` - الصفحة الرئيسية مع الواجهة التفاعلية
- `supabase-config.js` - ملف إعدادات Supabase (يحتوي على المفاتيح)

## كيفية الاستخدام

### 1. فتح الملف
```bash
# افتح الملف في المتصفح مباشرة
open supabase-cdn-example.html
```

### 2. أو استخدام خادم محلي
```bash
# باستخدام Python
python -m http.server 8000

# باستخدام Node.js
npx serve .

# ثم افتح http://localhost:8000/supabase-cdn-example.html
```

## الميزات

### 🚀 استيراد من CDN
```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
```

### 📋 العمليات المتاحة
- **جلب المهام**: استعلام جدول `todos`
- **إضافة مهمة**: إدراج سجل جديد
- **اختبار الاتصال**: فحص حالة قاعدة البيانات

### 🎨 التصميم
- واجهة عربية مع دعم RTL
- تأثيرات Glassmorphism
- تدرجات لونية حديثة
- استجابة للأجهزة المختلفة

## إعداد قاعدة البيانات

### إنشاء جدول todos
```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تمكين RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة العامة
CREATE POLICY "Allow public read" ON todos
  FOR SELECT USING (true);

-- سياسة للإدراج العام
CREATE POLICY "Allow public insert" ON todos
  FOR INSERT WITH CHECK (true);
```

## الأمان

⚠️ **تحذير**: هذا المثال يحتوي على مفاتيح مكشوفة لأغراض التوضيح فقط.

### في الإنتاج:
1. استخدم متغيرات البيئة
2. قم بإعداد RLS بشكل صحيح
3. استخدم مفاتيح منفصلة للبيئات المختلفة

## استكشاف الأخطاء

### خطأ CORS
إذا واجهت مشاكل CORS، استخدم خادم محلي بدلاً من فتح الملف مباشرة.

### خطأ في الاستيراد
تأكد من اتصال الإنترنت لتحميل المكتبة من CDN.

### خطأ في قاعدة البيانات
تحقق من:
- صحة URL و Anon Key
- وجود جدول `todos`
- إعدادات RLS

## مقارنة مع الطرق الأخرى

| الطريقة | المزايا | العيوب |
|---------|---------|--------|
| **CDN** | سهولة الاستخدام، لا يحتاج build | يتطلب اتصال إنترنت |
| **npm** | تحكم أكبر، عمل offline | يحتاج build process |
| **Deno** | أمان أكبر، TypeScript | بيئة جديدة |

## الدعم
- ✅ جميع المتصفحات الحديثة
- ✅ ES6 Modules
- ✅ Async/Await
- ✅ RTL Support