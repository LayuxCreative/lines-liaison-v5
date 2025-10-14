# 🌐 أمثلة Fetch API مع Supabase

## 📋 الوصف
مجموعة شاملة من الأمثلة لاستخدام Fetch API مع قاعدة بيانات Supabase، تشمل أمثلة لـ Node.js والمتصفح.

## 📁 الملفات المتضمنة

### 1. `supabase-fetch-example.js` - مثال Node.js
- **الوصف**: مثال كامل لاستخدام Fetch API في بيئة Node.js
- **المميزات**:
  - استخدام متغيرات البيئة للحماية الأمنية
  - دوال للعمليات الأساسية (CRUD)
  - معالجة شاملة للأخطاء
  - رسائل واضحة باللغة العربية

### 2. `supabase-fetch-browser.html` - مثال المتصفح
- **الوصف**: صفحة HTML تفاعلية لاستخدام Fetch API في المتصفح
- **المميزات**:
  - واجهة مستخدم عربية جميلة
  - تأثيرات Glassmorphism
  - حفظ الإعدادات في localStorage
  - أزرار تفاعلية للعمليات المختلفة

## 🚀 كيفية الاستخدام

### Node.js Example

1. **تثبيت المتطلبات**:
```bash
npm install dotenv
```

2. **إعداد متغيرات البيئة**:
```bash
# في ملف .env
VITE_SUPABASE_URL=https://mtpnlowzrbdqkbxjgpvm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. **تشغيل المثال**:
```bash
node supabase-fetch-example.js
```

### Browser Example

1. **فتح الملف**:
   - افتح `supabase-fetch-browser.html` في المتصفح مباشرة
   - أو استخدم خادم محلي:
   ```bash
   python -m http.server 8000
   # ثم افتح http://localhost:8000/supabase-fetch-browser.html
   ```

2. **إدخال الإعدادات**:
   - أدخل رابط Supabase
   - أدخل مفتاح Supabase (anon key)
   - اضغط "حفظ الإعدادات"

3. **استخدام الوظائف**:
   - **جلب الدول**: لعرض جميع البيانات من جدول countries
   - **إضافة دولة**: لإضافة دولة جديدة
   - **اختبار الاتصال**: للتحقق من صحة الاتصال
   - **مسح النتائج**: لمسح منطقة الإخراج

## 🔧 الوظائف المتاحة

### Node.js Functions
```javascript
// جلب جميع الدول
await fetchCountries();

// إضافة دولة جديدة
await addCountry({
  name: 'مصر',
  code: 'EG'
});

// تحديث دولة
await updateCountry(1, { name: 'مصر المحدثة' });

// حذف دولة
await deleteCountry(1);
```

### Browser Functions
- `testConnection()` - اختبار الاتصال
- `fetchCountries()` - جلب البيانات
- `addCountry()` - إضافة دولة جديدة
- `saveConfig()` - حفظ الإعدادات
- `clearOutput()` - مسح النتائج

## 🗄️ إعداد قاعدة البيانات

### إنشاء جدول countries
```sql
-- إنشاء جدول الدول
CREATE TABLE countries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج بيانات تجريبية
INSERT INTO countries (name, code) VALUES
('السعودية', 'SA'),
('الإمارات', 'AE'),
('مصر', 'EG'),
('الأردن', 'JO');
```

### إعداد Row Level Security (RLS)
```sql
-- تفعيل RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع
CREATE POLICY "Enable read access for all users" ON countries
FOR SELECT USING (true);

-- سياسة الكتابة للمستخدمين المصرح لهم
CREATE POLICY "Enable insert for authenticated users only" ON countries
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 🔒 الأمان

### ⚠️ تحذيرات مهمة
- **لا تكشف مفاتيح API**: استخدم متغيرات البيئة دائماً
- **استخدم HTTPS**: تأكد من استخدام اتصالات آمنة
- **فعّل RLS**: قم بتفعيل Row Level Security في Supabase

### 🛡️ أفضل الممارسات
- احفظ المفاتيح في ملف `.env` وأضفه إلى `.gitignore`
- استخدم مفاتيح مختلفة للتطوير والإنتاج
- راجع سياسات الأمان بانتظام

## 🐛 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### خطأ "No API key found"
```
الحل: تأكد من إضافة مفتاح API في headers
```

#### خطأ CORS في المتصفح
```
الحل: تأكد من إعداد CORS في Supabase أو استخدم خادم محلي
```

#### خطأ في الاتصال
```
الحل: تحقق من صحة رابط Supabase ومفتاح API
```

#### خطأ في قاعدة البيانات
```
الحل: تأكد من وجود جدول countries وإعداد RLS بشكل صحيح
```

## 📊 مقارنة الطرق

| الطريقة | المميزات | العيوب | الاستخدام المناسب |
|---------|----------|--------|------------------|
| **Fetch API** | بساطة، مدمج في JavaScript، مرونة عالية | يتطلب إعداد headers يدوياً | التطبيقات البسيطة، التحكم الكامل |
| **Supabase Client** | سهولة الاستخدام، مميزات إضافية | حجم أكبر، تعقيد إضافي | التطبيقات المعقدة، الميزات المتقدمة |

## 🔗 روابط مفيدة
- [Supabase REST API Documentation](https://supabase.com/docs/guides/api)
- [Fetch API MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [JavaScript Promises Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)

## 📞 الدعم
إذا واجهت أي مشاكل أو لديك أسئلة، يرجى:
1. مراجعة قسم استكشاف الأخطاء أعلاه
2. التحقق من إعدادات Supabase
3. مراجعة console المتصفح للأخطاء التفصيلية