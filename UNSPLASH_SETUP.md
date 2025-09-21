# إعداد Unsplash API

## المشكلة
ظهور خطأ 401 عند محاولة استخدام خاصية "Select Image from Unsplash" يعني أن مفتاح API غير موجود أو غير صحيح.

## الحل

### 1. إنشاء حساب مطور في Unsplash
1. اذهب إلى [Unsplash Developers](https://unsplash.com/developers)
2. قم بإنشاء حساب جديد أو تسجيل الدخول
3. اذهب إلى [Your Apps](https://unsplash.com/oauth/applications)
4. اضغط على "New Application"

### 2. إنشاء تطبيق جديد
1. اقرأ ووافق على الشروط والأحكام
2. أدخل اسم التطبيق (مثل: "Lines Liaison App")
3. أدخل وصف التطبيق (مثل: "Communication platform with image selection")
4. اضغط "Create application"

### 3. الحصول على مفتاح API
1. في صفحة التطبيق، ستجد "Access Key"
2. انسخ هذا المفتاح

### 4. إضافة المفتاح إلى المشروع
1. افتح ملف `.env` في جذر المشروع
2. أضف مفتاح API:
```
VITE_UNSPLASH_ACCESS_KEY=your_actual_access_key_here
```
3. احفظ الملف
4. أعد تشغيل الخادم:
```bash
npm run dev
```

## ملاحظات مهمة

### حدود الاستخدام
- **وضع التطوير**: 50 طلب في الساعة (مجاني)
- **وضع الإنتاج**: يتطلب موافقة من Unsplash لزيادة الحد

### الأمان
- لا تشارك مفتاح API مع أحد
- لا تضعه في الكود المصدري العام
- استخدم متغيرات البيئة فقط

### استكشاف الأخطاء
- **خطأ 401**: مفتاح API غير صحيح أو مفقود
- **خطأ 403**: تم تجاوز حد الطلبات
- **خطأ 404**: الصورة غير موجودة

## اختبار الإعداد
1. افتح التطبيق في المتصفح
2. اذهب إلى صفحة الملف الشخصي
3. اضغط على "Edit" للصورة
4. اضغط على "Select from Unsplash"
5. يجب أن تظهر الصور بدون أخطاء

## روابط مفيدة
- [Unsplash API Documentation](https://unsplash.com/documentation)
- [Unsplash Developers](https://unsplash.com/developers)
- [API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)