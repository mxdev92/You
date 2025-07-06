import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Phone, User, Package, Store, Truck, CheckCircle } from 'lucide-react';

const WhatsAppAdmin: React.FC = () => {
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [testData, setTestData] = useState({
    phoneNumber: '07701234567',
    fullName: 'احمد محمد',
    orderId: '',
    driverPhone: '07709876543',
    storePhone: '07701234567',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ type: 'success' | 'error'; text: string; time: string }[]>([]);

  useEffect(() => {
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();
      setWhatsappStatus(data.connected ? 'connected' : 'disconnected');
    } catch (error) {
      setWhatsappStatus('disconnected');
    }
  };

  const initializeWhatsApp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        addMessage('success', 'تم بدء عملية الاتصال - تحقق من وحدة التحكم لرؤية رمز QR');
      } else {
        addMessage('error', `فشل في الاتصال: ${data.error}`);
      }
    } catch (error) {
      addMessage('error', 'خطأ في تهيئة WhatsApp');
    }
    setIsLoading(false);
  };

  const addMessage = (type: 'success' | 'error', text: string) => {
    const newMessage = {
      type,
      text,
      time: new Date().toLocaleTimeString('ar-IQ')
    };
    setMessages(prev => [newMessage, ...prev].slice(0, 10));
  };

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testData.phoneNumber,
          fullName: testData.fullName
        })
      });

      if (response.ok) {
        const data = await response.json();
        addMessage('success', `تم إرسال رمز OTP: ${data.otp}`);
      } else {
        addMessage('error', 'فشل في إرسال OTP');
      }
    } catch (error) {
      addMessage('error', 'خطأ في الاتصال');
    }
    setIsLoading(false);
  };

  const verifyOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testData.phoneNumber,
          otp: testData.otp
        })
      });

      const data = await response.json();
      if (data.valid) {
        addMessage('success', 'تم التحقق من OTP بنجاح');
      } else {
        addMessage('error', 'OTP غير صحيح أو منتهي الصلاحية');
      }
    } catch (error) {
      addMessage('error', 'خطأ في التحقق');
    }
    setIsLoading(false);
  };

  const sendCustomerInvoice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/send-customer-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: parseInt(testData.orderId) })
      });

      if (response.ok) {
        addMessage('success', 'تم إرسال الفاتورة للعميل');
      } else {
        addMessage('error', 'فشل في إرسال الفاتورة');
      }
    } catch (error) {
      addMessage('error', 'خطأ في الإرسال');
    }
    setIsLoading(false);
  };

  const sendDriverNotification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/send-driver-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: parseInt(testData.orderId),
          driverPhone: testData.driverPhone
        })
      });

      if (response.ok) {
        addMessage('success', 'تم إرسال إشعار للسائق');
      } else {
        addMessage('error', 'فشل في إرسال الإشعار');
      }
    } catch (error) {
      addMessage('error', 'خطأ في الإرسال');
    }
    setIsLoading(false);
  };

  const sendStoreAlert = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/send-store-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: parseInt(testData.orderId),
          storePhone: testData.storePhone
        })
      });

      if (response.ok) {
        addMessage('success', 'تم إرسال إشعار للمتجر');
      } else {
        addMessage('error', 'فشل في إرسال الإشعار');
      }
    } catch (error) {
      addMessage('error', 'خطأ في الإرسال');
    }
    setIsLoading(false);
  };

  const sendStatusUpdate = async (status: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/send-status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: parseInt(testData.orderId),
          status
        })
      });

      if (response.ok) {
        addMessage('success', `تم إرسال تحديث الحالة: ${status}`);
      } else {
        addMessage('error', 'فشل في إرسال التحديث');
      }
    } catch (error) {
      addMessage('error', 'خطأ في الإرسال');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              إدارة WhatsApp - PAKETY
            </h1>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                حالة الاتصال:
              </span>
              <Badge 
                variant={whatsappStatus === 'connected' ? 'default' : 'destructive'}
                className={whatsappStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}
              >
                {whatsappStatus === 'connected' ? 'متصل' : whatsappStatus === 'loading' ? 'جاري التحقق...' : 'غير متصل'}
              </Badge>
            </div>
            
            {whatsappStatus === 'disconnected' && (
              <Button
                onClick={initializeWhatsApp}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                {isLoading ? 'جاري الاتصال...' : 'تهيئة اتصال WhatsApp'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OTP Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                <Phone className="h-5 w-5 text-blue-600" />
                اختبار OTP للتسجيل
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                إرسال والتحقق من رمز OTP عبر WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  رقم الهاتف:
                </label>
                <Input
                  value={testData.phoneNumber}
                  onChange={(e) => setTestData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="07701234567"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  الاسم الكامل:
                </label>
                <Input
                  value={testData.fullName}
                  onChange={(e) => setTestData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="احمد محمد"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={sendOTP} 
                  disabled={isLoading || whatsappStatus !== 'connected'}
                  className="flex-1"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  إرسال OTP
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  رمز OTP للتحقق:
                </label>
                <div className="flex gap-2">
                  <Input
                    value={testData.otp}
                    onChange={(e) => setTestData(prev => ({ ...prev, otp: e.target.value }))}
                    placeholder="123456"
                    maxLength={6}
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button 
                    onClick={verifyOTP}
                    disabled={isLoading || whatsappStatus !== 'connected'}
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    تحقق
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                <Package className="h-5 w-5 text-orange-600" />
                إشعارات الطلبات
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                إرسال الفواتير والإشعارات للطلبات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  رقم الطلب:
                </label>
                <Input
                  value={testData.orderId}
                  onChange={(e) => setTestData(prev => ({ ...prev, orderId: e.target.value }))}
                  placeholder="33"
                  type="number"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={sendCustomerInvoice}
                  disabled={isLoading || whatsappStatus !== 'connected' || !testData.orderId}
                  variant="outline"
                  size="sm"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  <User className="h-4 w-4 mr-1" />
                  فاتورة العميل
                </Button>

                <Button 
                  onClick={sendStoreAlert}
                  disabled={isLoading || whatsappStatus !== 'connected' || !testData.orderId}
                  variant="outline"
                  size="sm"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  <Store className="h-4 w-4 mr-1" />
                  إشعار المتجر
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  رقم السائق:
                </label>
                <div className="flex gap-2">
                  <Input
                    value={testData.driverPhone}
                    onChange={(e) => setTestData(prev => ({ ...prev, driverPhone: e.target.value }))}
                    placeholder="07709876543"
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendDriverNotification}
                    disabled={isLoading || whatsappStatus !== 'connected' || !testData.orderId}
                    size="sm"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    إشعار السائق
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  تحديثات حالة الطلب:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { status: 'confirmed', label: 'مؤكد', color: 'bg-blue-500' },
                    { status: 'preparing', label: 'قيد التحضير', color: 'bg-yellow-500' },
                    { status: 'out_for_delivery', label: 'في الطريق', color: 'bg-purple-500' },
                    { status: 'delivered', label: 'تم التوصيل', color: 'bg-green-500' }
                  ].map(({ status, label, color }) => (
                    <Button
                      key={status}
                      onClick={() => sendStatusUpdate(status)}
                      disabled={isLoading || whatsappStatus !== 'connected' || !testData.orderId}
                      size="sm"
                      variant="outline"
                      className={`text-white border-0 ${color} hover:opacity-80`}
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Log */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              سجل الرسائل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  لا توجد رسائل بعد
                </p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                        {message.text}
                      </span>
                      <span className="text-xs opacity-70">
                        {message.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              تعليمات الاستخدام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              <p>• تأكد من أن WhatsApp متصل (حالة الاتصال: متصل)</p>
              <p>• لاختبار OTP: أدخل رقم هاتف صالح واسم، ثم اضغط "إرسال OTP"</p>
              <p>• لاختبار إشعارات الطلبات: أدخل رقم طلب موجود من قاعدة البيانات</p>
              <p>• ستصل الرسائل إلى رقم WhatsApp المربوط بالنظام</p>
              <p>• يمكن تخصيص أرقام المتجر والسائق في إعدادات النظام</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppAdmin;