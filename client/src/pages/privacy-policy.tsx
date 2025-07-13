import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-fresh-green/5 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-fresh-green"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 
            className="text-3xl font-bold text-center text-gray-900 mb-8"
            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
          >
            سياسة الخصوصية
          </h1>

          <div className="space-y-8 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">مقدمة</h2>
              <p className="text-gray-700 leading-relaxed">
                نحن في تطبيق باكيتي للتوصيل السريع نقدر خصوصيتك ونلتزم بحماية معلوماتك الشخصية. 
                هذه السياسة توضح كيفية جمع واستخدام وحماية البيانات في تطبيق التوصيل الخاص بنا.
              </p>
            </section>

            {/* App Type */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">نوع التطبيق</h2>
              <p className="text-gray-700 leading-relaxed">
                باكيتي هو تطبيق توصيل البقالة والمواد الغذائية فقط. نحن نقدم خدمة توصيل المنتجات الغذائية 
                والبقالة إلى منزلك بطريقة سريعة وآمنة.
              </p>
            </section>

            {/* Permissions */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">الصلاحيات المطلوبة</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 mb-3">تطبيقنا لا يطلب أي من الصلاحيات التالية:</h3>
                <ul className="space-y-2 text-green-800">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✗</span>
                    <span>الوصول إلى الموقع الجغرافي (GPS)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✗</span>
                    <span>الوصول إلى جهات الاتصال</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✗</span>
                    <span>الوصول إلى الملفات والصور</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✗</span>
                    <span>الوصول إلى الكاميرا أو الميكروفون</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">البيانات التي نجمعها</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نحن نجمع فقط المعلومات الضرورية لتقديم خدمة التوصيل:
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>الاسم الكامل (لتسليم الطلب)</li>
                <li>رقم الهاتف (للتواصل معك)</li>
                <li>عنوان التوصيل (المحافظة، المنطقة، العلامة المميزة)</li>
                <li>عنوان البريد الإلكتروني (لإنشاء الحساب فقط)</li>
                <li>تفاصيل الطلبات (المنتجات والكميات)</li>
              </ul>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">استخدام البيانات</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نستخدم معلوماتك الشخصية لأغراض محددة فقط:
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>معالجة وتوصيل الطلبات</li>
                <li>التواصل معك بخصوص الطلب</li>
                <li>تحسين جودة الخدمة</li>
                <li>إرسال فواتير الطلبات</li>
              </ul>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">حماية البيانات</h2>
              <p className="text-gray-700 leading-relaxed">
                نحن نتخذ إجراءات أمنية صارمة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الكشف أو التدمير. 
                جميع البيانات محفوظة في خوادم آمنة ومشفرة.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">مشاركة البيانات</h2>
              <p className="text-gray-700 leading-relaxed">
                نحن لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside mt-4">
                <li>مع مندوبي التوصيل (الاسم ورقم الهاتف والعنوان فقط لتسليم الطلب)</li>
                <li>عند الحاجة للامتثال للقوانين المحلية</li>
                <li>لحماية حقوقنا أو سلامة الآخرين</li>
              </ul>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">حقوقك</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                لديك الحق في:
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>الوصول إلى معلوماتك الشخصية المحفوظة لدينا</li>
                <li>تصحيح أو تحديث معلوماتك</li>
                <li>حذف حسابك ومعلوماتك</li>
                <li>الاعتراض على استخدام معلوماتك</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ملفات تعريف الارتباط (Cookies)</h2>
              <p className="text-gray-700 leading-relaxed">
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك في التطبيق والحفاظ على جلسة تسجيل الدخول. 
                يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">التغييرات على هذه السياسة</h2>
              <p className="text-gray-700 leading-relaxed">
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة من خلال التطبيق أو البريد الإلكتروني.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">تواصل معنا</h2>
              <p className="text-gray-700 leading-relaxed">
                إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا من خلال:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">📱 الهاتف: 07511856947</p>
                <p className="text-gray-700">📧 البريد الإلكتروني: info@pakety.delivery</p>
              </div>
            </section>

            {/* Last Updated */}
            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                آخر تحديث: 13 يوليو 2025
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}