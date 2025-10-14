#!/bin/bash

# مثال cURL مع Supabase
# تأكد من تعيين متغيرات البيئة قبل تشغيل هذا الملف

# متغيرات البيئة (يجب تعيينها قبل التشغيل)
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key-here}"

# ألوان للإخراج
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 أمثلة cURL مع Supabase${NC}"
echo "=================================="

# التحقق من متغيرات البيئة
if [[ "$SUPABASE_URL" == "https://your-project.supabase.co" ]] || [[ "$SUPABASE_ANON_KEY" == "your-anon-key-here" ]]; then
    echo -e "${RED}❌ يرجى تعيين متغيرات البيئة أولاً:${NC}"
    echo "export SUPABASE_URL='https://your-project.supabase.co'"
    echo "export SUPABASE_ANON_KEY='your-anon-key'"
    echo ""
    echo -e "${YELLOW}💡 أو قم بتحرير هذا الملف وتعديل القيم مباشرة${NC}"
    exit 1
fi

echo -e "${GREEN}✅ متغيرات البيئة محددة${NC}"
echo "URL: $SUPABASE_URL"
echo "Key: ${SUPABASE_ANON_KEY:0:20}..."
echo ""

# 1. جلب جميع البيانات من جدول todos
echo -e "${BLUE}1️⃣ جلب جميع البيانات من جدول todos${NC}"
echo "curl '$SUPABASE_URL/rest/v1/todos' \\"
echo "  -H 'apikey: $SUPABASE_ANON_KEY' \\"
echo "  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'"
echo ""

curl "$SUPABASE_URL/rest/v1/todos" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# 2. جلب بيانات محددة مع فلترة
echo -e "${BLUE}2️⃣ جلب المهام غير المكتملة فقط${NC}"
echo "curl '$SUPABASE_URL/rest/v1/todos?completed=eq.false' \\"
echo "  -H 'apikey: $SUPABASE_ANON_KEY' \\"
echo "  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'"
echo ""

curl "$SUPABASE_URL/rest/v1/todos?completed=eq.false" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# 3. إضافة مهمة جديدة
echo -e "${BLUE}3️⃣ إضافة مهمة جديدة${NC}"
echo "curl -X POST '$SUPABASE_URL/rest/v1/todos' \\"
echo "  -H 'apikey: $SUPABASE_ANON_KEY' \\"
echo "  -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"title\": \"مهمة من cURL\", \"completed\": false}'"
echo ""

curl -X POST "$SUPABASE_URL/rest/v1/todos" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"title": "مهمة من cURL", "completed": false}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# 4. تحديث مهمة موجودة
echo -e "${BLUE}4️⃣ تحديث المهمة الأولى لتصبح مكتملة${NC}"
echo "curl -X PATCH '$SUPABASE_URL/rest/v1/todos?id=eq.1' \\"
echo "  -H 'apikey: $SUPABASE_ANON_KEY' \\"
echo "  -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"completed\": true}'"
echo ""

curl -X PATCH "$SUPABASE_URL/rest/v1/todos?id=eq.1" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"completed": true}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# 5. حذف مهمة
echo -e "${BLUE}5️⃣ حذف المهام المكتملة${NC}"
echo "curl -X DELETE '$SUPABASE_URL/rest/v1/todos?completed=eq.true' \\"
echo "  -H 'apikey: $SUPABASE_ANON_KEY' \\"
echo "  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'"
echo ""

# تحذير قبل الحذف
read -p "هل تريد حذف المهام المكتملة؟ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    curl -X DELETE "$SUPABASE_URL/rest/v1/todos?completed=eq.true" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -w "\nHTTP Status: %{http_code}\n" \
      -s
else
    echo "تم إلغاء عملية الحذف"
fi
echo ""

# 6. جلب بيانات مع ترتيب وحد أقصى
echo -e "${BLUE}6️⃣ جلب آخر 5 مهام مرتبة حسب تاريخ الإنشاء${NC}"
echo "curl '$SUPABASE_URL/rest/v1/todos?select=*&order=created_at.desc&limit=5' \\"
echo "  -H 'apikey: $SUPABASE_ANON_KEY' \\"
echo "  -H 'Authorization: Bearer $SUPABASE_ANON_KEY'"
echo ""

curl "$SUPABASE_URL/rest/v1/todos?select=*&order=created_at.desc&limit=5" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# 7. إحصائيات
echo -e "${BLUE}7️⃣ عدد المهام الإجمالي${NC}"
echo "curl '$SUPABASE_URL/rest/v1/todos?select=count' \\"
echo "  -H 'apikey: $SUPABASE_ANON_KEY' \\"
echo "  -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \\"
echo "  -H 'Prefer: count=exact'"
echo ""

curl "$SUPABASE_URL/rest/v1/todos?select=count" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Prefer: count=exact" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

echo -e "${GREEN}✅ انتهت جميع الأمثلة${NC}"
echo -e "${YELLOW}💡 لمزيد من المعلومات، راجع: https://supabase.com/docs/guides/api${NC}"