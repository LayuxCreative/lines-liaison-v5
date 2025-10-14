# دليل استخدام HTTP Requests مع Supabase

## 📋 الوصف
هذا المثال يوضح كيفية استخدام HTTP requests مباشرة مع Supabase REST API باستخدام `fetch()` في المتصفح.

## 📁 الملفات
- `supabase-http-example.html` - صفحة HTML تفاعلية لاختبار HTTP requests

## 🚀 كيفية الاستخدام

### 1. فتح الصفحة
```bash
# فتح الملف مباشرة في المتصفح
open supabase-http-example.html

# أو استخدام خادم محلي
python -m http.server 8000
# ثم افتح http://localhost:8000/supabase-http-example.html
```

### 2. إعداد الاتصال
1. أدخل رابط مشروع Supabase الخاص بك
2. أدخل مفتاح anon key
3. اضغط "حفظ الإعدادات"

### 3. استخدام الأدوات
- **بناء URL**: اختر الجدول وطريقة HTTP والمعاملات
- **إرسال الطلب**: تنفيذ HTTP request مخصص
- **اختبار todos**: فحص وجود جدول todos
- **إنشاء جدول**: الحصول على SQL لإنشاء جدول todos

## 🛠️ الميزات

### واجهة المستخدم
- تصميم Glassmorphism عصري
- واجهة عربية كاملة
- حفظ الإعدادات في localStorage
- عرض النتائج في الوقت الفعلي

### العمليات المتاحة
- **GET**: جلب البيانات من الجدول
- **POST**: إضافة بيانات جديدة
- **PATCH**: تحديث البيانات الموجودة
- **DELETE**: حذف البيانات

### أمثلة على URLs
```
# جلب جميع البيانات
GET /rest/v1/todos

# جلب بيانات محددة
GET /rest/v1/todos?select=*&limit=10

# ترتيب البيانات
GET /rest/v1/todos?order=created_at.desc

# فلترة البيانات
GET /rest/v1/todos?completed=eq.false
```

## 🗄️ إعداد قاعدة البيانات

### إنشاء جدول todos
```sql
-- إنشاء الجدول
CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول (للاختبار فقط)
CREATE POLICY "Enable read access for all users" ON todos
FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON todos
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON todos
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON todos
FOR DELETE USING (true);
```

### إدراج بيانات تجريبية
```sql
INSERT INTO todos (title, completed) VALUES
('مهمة تجريبية 1', false),
('مهمة تجريبية 2', true),
('مهمة تجريبية 3', false);
```

## 🔒 الأمان

### تحذيرات مهمة
- **لا تعرض مفاتيح API في الكود المصدري**
- استخدم متغيرات البيئة في الإنتاج
- فعّل Row Level Security (RLS)
- استخدم سياسات أمان مناسبة

### أفضل الممارسات
```javascript
// استخدام متغيرات البيئة
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Headers آمنة
const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};
```

## 🔧 استكشاف الأخطاء

### أخطاء شائعة

#### 1. خطأ CORS
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**الحل**: استخدم خادم محلي بدلاً من فتح الملف مباشرة

#### 2. جدول غير موجود
```json
{
  "code": "PGRST205",
  "message": "relation \"public.todos\" does not exist"
}
```
**الحل**: أنشئ الجدول باستخدام SQL المقدم

#### 3. خطأ في المصادقة
```json
{
  "code": "401",
  "message": "Invalid API key"
}
```
**الحل**: تأكد من صحة anon key

#### 4. خطأ في الصلاحيات
```json
{
  "code": "403",
  "message": "insufficient_privilege"
}
```
**الحل**: تحقق من سياسات RLS

### نصائح للتشخيص
1. افتح Developer Tools في المتصفح
2. تحقق من تبويب Network للطلبات
3. راجع تبويب Console للأخطاء
4. تأكد من صحة URL وHeaders

## 📊 مقارنة الطرق

| الطريقة | المزايا | العيوب | الاستخدام |
|---------|---------|--------|----------|
| **HTTP Direct** | بساطة، تحكم كامل | إدارة يدوية للأخطاء | APIs، تطبيقات بسيطة |
| **Supabase Client** | ميزات متقدمة، TypeScript | حجم أكبر | تطبيقات معقدة |
| **CDN Import** | سرعة التحميل | اعتماد على الشبكة | نماذج أولية |

## 🆘 الدعم

### الموارد المفيدة
- [Supabase REST API Documentation](https://supabase.com/docs/guides/api)
- [PostgREST Documentation](https://postgrest.org/en/stable/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

### أمثلة إضافية
```javascript
// جلب بيانات مع فلترة
fetch(`${url}/rest/v1/todos?completed=eq.false`, {
  headers: { 'apikey': key }
});

// إضافة بيانات جديدة
fetch(`${url}/rest/v1/todos`, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ title: 'مهمة جديدة' })
});

// تحديث بيانات
fetch(`${url}/rest/v1/todos?id=eq.1`, {
  method: 'PATCH',
  headers: {
    'apikey': key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ completed: true })
});
```

---

**ملاحظة**: هذا المثال مخصص للتعلم والاختبار. في الإنتاج، استخدم ممارسات أمان أقوى وإدارة أفضل للأخطاء.