# دليل استخدام cURL مع Supabase

## 📋 الوصف
هذا المثال يوضح كيفية استخدام cURL للتفاعل مع Supabase REST API من سطر الأوامر.

## 📁 الملفات
- `supabase-curl-examples.sh` - ملف bash script يحتوي على أمثلة cURL شاملة

## 🚀 كيفية الاستخدام

### 1. إعداد متغيرات البيئة
```bash
# تعيين متغيرات البيئة
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key-here"
```

### 2. تشغيل الأمثلة
```bash
# جعل الملف قابل للتنفيذ
chmod +x supabase-curl-examples.sh

# تشغيل جميع الأمثلة
./supabase-curl-examples.sh
```

### 3. تشغيل أمثلة فردية
```bash
# جلب جميع البيانات
curl 'https://your-project.supabase.co/rest/v1/todos' \
  -H 'apikey: your-anon-key' \
  -H 'Authorization: Bearer your-anon-key'
```

## 🛠️ الأمثلة المتاحة

### 1. جلب البيانات (GET)
```bash
# جلب جميع المهام
curl '$SUPABASE_URL/rest/v1/todos' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'

# جلب المهام غير المكتملة
curl '$SUPABASE_URL/rest/v1/todos?completed=eq.false' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'

# جلب مع ترتيب وحد أقصى
curl '$SUPABASE_URL/rest/v1/todos?select=*&order=created_at.desc&limit=5' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'
```

### 2. إضافة البيانات (POST)
```bash
# إضافة مهمة جديدة
curl -X POST '$SUPABASE_URL/rest/v1/todos' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{"title": "مهمة جديدة", "completed": false}'
```

### 3. تحديث البيانات (PATCH)
```bash
# تحديث مهمة محددة
curl -X PATCH '$SUPABASE_URL/rest/v1/todos?id=eq.1' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{"completed": true}'
```

### 4. حذف البيانات (DELETE)
```bash
# حذف المهام المكتملة
curl -X DELETE '$SUPABASE_URL/rest/v1/todos?completed=eq.true' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'
```

### 5. الإحصائيات والعد
```bash
# عدد المهام الإجمالي
curl '$SUPABASE_URL/rest/v1/todos?select=count' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \
  -H 'Prefer: count=exact'
```

## 🔧 معاملات الاستعلام المتقدمة

### فلترة البيانات
```bash
# المساواة
?completed=eq.true

# عدم المساواة
?id=neq.1

# أكبر من
?id=gt.5

# أصغر من
?id=lt.10

# يحتوي على
?title=like.*مهمة*

# في قائمة
?id=in.(1,2,3)
```

### ترتيب البيانات
```bash
# ترتيب تصاعدي
?order=created_at.asc

# ترتيب تنازلي
?order=created_at.desc

# ترتيب متعدد
?order=completed.asc,created_at.desc
```

### تحديد الحقول
```bash
# حقول محددة
?select=id,title,completed

# جميع الحقول
?select=*

# عد فقط
?select=count
```

### التصفح (Pagination)
```bash
# حد أقصى للنتائج
?limit=10

# تخطي نتائج
?offset=20

# نطاق محدد
?limit=10&offset=20
```

## 🔒 Headers مطلوبة

### Headers أساسية
```bash
-H 'apikey: your-anon-key'
-H 'Authorization: Bearer your-anon-key'
```

### Headers إضافية
```bash
# لطلبات POST/PATCH
-H 'Content-Type: application/json'

# لإرجاع البيانات المُدرجة/المُحدثة
-H 'Prefer: return=representation'

# لعد دقيق
-H 'Prefer: count=exact'

# لحل التضارب
-H 'Prefer: resolution=merge-duplicates'
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

## 🔧 استكشاف الأخطاء

### أخطاء شائعة

#### 1. مفتاح API مفقود
```json
{
  "message": "No API key found in request",
  "hint": "No `apikey` request header or url param was found."
}
```
**الحل**: تأكد من إضافة header `apikey`

#### 2. جدول غير موجود
```json
{
  "code": "PGRST205",
  "message": "relation \"public.todos\" does not exist"
}
```
**الحل**: أنشئ الجدول باستخدام SQL المقدم

#### 3. خطأ في JSON
```json
{
  "code": "PGRST102",
  "message": "Could not parse JSON"
}
```
**الحل**: تحقق من صحة JSON في `-d`

#### 4. خطأ في الصلاحيات
```json
{
  "code": "403",
  "message": "insufficient_privilege"
}
```
**الحل**: تحقق من سياسات RLS

### نصائح للتشخيص
```bash
# إضافة معلومات مفصلة
curl -v 'url'

# عرض HTTP status code
curl -w "\nHTTP Status: %{http_code}\n" 'url'

# حفظ headers الاستجابة
curl -D headers.txt 'url'

# تجاهل شهادات SSL (للاختبار فقط)
curl -k 'url'
```

## 📊 أمثلة متقدمة

### استعلامات معقدة
```bash
# البحث في النص
curl '$SUPABASE_URL/rest/v1/todos?title=ilike.*مهمة*' \
  -H 'apikey: $SUPABASE_ANON_KEY'

# فلترة بتاريخ
curl '$SUPABASE_URL/rest/v1/todos?created_at=gte.2024-01-01' \
  -H 'apikey: $SUPABASE_ANON_KEY'

# استعلام مركب
curl '$SUPABASE_URL/rest/v1/todos?and=(completed.eq.false,created_at.gte.2024-01-01)' \
  -H 'apikey: $SUPABASE_ANON_KEY'
```

### عمليات متعددة
```bash
# إدراج متعدد
curl -X POST '$SUPABASE_URL/rest/v1/todos' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '[
    {"title": "مهمة 1", "completed": false},
    {"title": "مهمة 2", "completed": false}
  ]'

# تحديث متعدد
curl -X PATCH '$SUPABASE_URL/rest/v1/todos?completed=eq.false' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"completed": true}'
```

### تصدير البيانات
```bash
# تصدير إلى ملف JSON
curl '$SUPABASE_URL/rest/v1/todos' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  -o todos.json

# تصدير مع تنسيق جميل
curl '$SUPABASE_URL/rest/v1/todos' \
  -H 'apikey: $SUPABASE_ANON_KEY' \
  | jq '.' > todos_formatted.json
```

## 🔒 الأمان

### أفضل الممارسات
- استخدم متغيرات البيئة للمفاتيح
- لا تعرض المفاتيح في التاريخ أو الملفات
- استخدم HTTPS دائماً
- فعّل Row Level Security
- استخدم سياسات أمان مناسبة

### مثال آمن
```bash
# ملف .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# تحميل المتغيرات
source .env

# استخدام آمن
curl "$SUPABASE_URL/rest/v1/todos" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

## 📚 موارد إضافية

### الوثائق الرسمية
- [Supabase REST API](https://supabase.com/docs/guides/api)
- [PostgREST Documentation](https://postgrest.org/en/stable/)
- [cURL Manual](https://curl.se/docs/manual.html)

### أدوات مفيدة
- `jq` - معالج JSON لسطر الأوامر
- `httpie` - بديل أبسط لـ cURL
- `postman` - أداة GUI لاختبار APIs

---

**ملاحظة**: هذا المثال مخصص للتعلم والاختبار. في الإنتاج، استخدم ممارسات أمان أقوى وإدارة أفضل للمفاتيح.