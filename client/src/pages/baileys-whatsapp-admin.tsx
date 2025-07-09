import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Smartphone, Wifi, WifiOff, QrCode, Shield, Send, CheckCircle, Package, AlertCircle } from 'lucide-react';

interface WhatsAppStatus {
  connected: boolean;
  connecting: boolean;
  status: string;
}

interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
  timestamp: number;
}

interface TestData {
  phoneNumber: string;
  fullName: string;
  otp: string;
  orderId: string;
}

export default function BaileysWhatsAppAdmin() {
  const [status, setStatus] = useState<WhatsAppStatus>({ 
    connected: false, 
    connecting: false, 
    status: 'disconnected' 
  });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [testData, setTestData] = useState<TestData>({
    phoneNumber: '07701234567',
    fullName: 'اختبار المستخدم',
    otp: '',
    orderId: '1'
  });

  // Check WhatsApp status and QR code every 3 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp/status');
        const data = await response.json();
        setStatus(data);

        // Get QR code if available
        const qrResponse = await fetch('/api/whatsapp/qr');
        const qrData = await qrResponse.json();
        if (qrData.available && qrData.qr) {
          setQrCode(qrData.qr);
        } else {
          setQrCode(null);
        }
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const addMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessages(prev => [...prev, { type, text, timestamp: Date.now() }]);
  };

  const initializeWhatsApp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/initialize', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        addMessage('success', 'تم بدء تشغيل WhatsApp بنجاح');
      } else {
        addMessage('error', 'فشل في تشغيل WhatsApp');
      }
    } catch (error) {
      addMessage('error', 'خطأ في الاتصال');
    }
    setIsLoading(false);
  };

  const resetSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/reset', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        addMessage('success', 'تم إعادة تعيين الجلسة بنجاح');
      } else {
        addMessage('error', 'فشل في إعادة تعيين الجلسة');
      }
    } catch (error) {
      addMessage('error', 'خطأ في إعادة التعيين');
    }
    setIsLoading(false);
  };

  // 1. OTP Testing
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

      const data = await response.json();
      if (response.ok) {
        if (data.otp) {
          addMessage('info', `🔑 OTP Fallback: ${data.otp} (صالح لمدة 10 دقائق)`);
        } else {
          addMessage('success', `تم إرسال رمز OTP عبر WhatsApp إلى ${testData.phoneNumber}`);
        }
      } else {
        addMessage('error', `فشل في إرسال OTP: ${data.message}`);
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
        addMessage('success', 'تم التحقق من OTP بنجاح ✅');
      } else {
        addMessage('error', 'OTP غير صحيح أو منتهي الصلاحية');
      }
    } catch (error) {
      addMessage('error', 'خطأ في التحقق');
    }
    setIsLoading(false);
  };

  // 2. Customer Invoice Testing
  const sendCustomerInvoice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/send-customer-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: parseInt(testData.orderId)
        })
      });

      if (response.ok) {
        addMessage('success', `تم إرسال فاتورة العميل للطلب #${testData.orderId} عبر WhatsApp`);
      } else {
        const errorData = await response.json();
        addMessage('error', `فشل في إرسال فاتورة العميل: ${errorData.message}`);
      }
    } catch (error) {
      addMessage('error', 'خطأ في إرسال فاتورة العميل');
    }
    setIsLoading(false);
  };

  // 3. Admin Notification Testing
  const sendAdminNotification = async () => {
    setIsLoading(true);
    try {
      // Create test order data for admin notification
      const testOrderData = {
        orderId: parseInt(testData.orderId),
        customerName: testData.fullName,
        customerPhone: testData.phoneNumber,
        address: 'بغداد - الكرادة - قرب جامع الحكيم',
        total: 45000,
        itemCount: 3
      };

      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData: testOrderData })
      });

      if (response.ok) {
        addMessage('success', `تم إرسال إشعار الأدمن للطلب #${testData.orderId} إلى 07757250444 🎯`);
      } else {
        const errorData = await response.json();
        addMessage('error', `فشل في إرسال إشعار الأدمن: ${errorData.message}`);
      }
    } catch (error) {
      addMessage('error', 'خطأ في إرسال إشعار الأدمن');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              <Smartphone className="h-6 w-6 text-green-600" />
              لوحة تحكم WhatsApp المحسّنة - مستقرة دائماً
            </CardTitle>
            <CardDescription style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              نظام WhatsApp مع إدارة تلقائية مستقرة - بدون انقطاع أو إعادة تشغيل
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              {status.connected ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
              حالة الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>حالة الاتصال المحسّن:</span>
              <Badge 
                variant={status.connected ? 'default' : 'destructive'} 
                className={`${status.connected ? 'bg-green-500 text-white' : status.connecting ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'} font-semibold animate-pulse`}
              >
                {status.connected ? '🟢 متصل و مستقر بشكل دائم' : status.connecting ? '🟡 جاري الاتصال...' : '🔴 غير متصل'}
              </Badge>
            </div>
            
            {status.connected && (
              <div className="text-sm text-green-600 font-semibold text-center" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                ✅ نظام مستقر - جاهز لإرسال الرسائل بدون انقطاع
              </div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                الاتصال يدار تلقائياً - لا حاجة لإعادة التشغيل اليدوي
              </p>
            </div>

            {/* QR Code Display */}
            {qrCode && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  امسح رمز QR بواسطة WhatsApp على هاتفك:
                </p>
                <div className="flex justify-center">
                  <img src={qrCode} alt="WhatsApp QR Code" className="border rounded-lg" />
                </div>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  افتح WhatsApp {'>'} الإعدادات {'>'} الأجهزة المرتبطة {'>'} ربط جهاز
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. OTP Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                <Shield className="h-5 w-5 text-blue-600" />
                1. اختبار OTP
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                إرسال رمز التحقق للتسجيل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  placeholder="اسم المستخدم"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                />
              </div>

              <Button 
                onClick={sendOTP} 
                disabled={isLoading || !status.connected}
                className="w-full"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                <Send className="h-4 w-4 mr-2" />
                إرسال OTP
              </Button>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  رمز التحقق:
                </label>
                <div className="flex gap-2">
                  <Input
                    value={testData.otp}
                    onChange={(e) => setTestData(prev => ({ ...prev, otp: e.target.value }))}
                    placeholder="1234"
                    maxLength={4}
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button 
                    onClick={verifyOTP}
                    disabled={isLoading || !status.connected}
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    تحقق
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Customer Invoice Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                <Package className="h-5 w-5 text-green-600" />
                2. فاتورة العميل
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                إرسال الفاتورة للعميل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  رقم الطلب:
                </label>
                <Input
                  value={testData.orderId}
                  onChange={(e) => setTestData(prev => ({ ...prev, orderId: e.target.value }))}
                  placeholder="1"
                  type="number"
                  dir="ltr"
                />
              </div>

              <Button 
                onClick={sendCustomerInvoice} 
                disabled={isLoading || !status.connected}
                className="w-full"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                <Package className="h-4 w-4 mr-2" />
                إرسال فاتورة العميل
              </Button>

              <p className="text-xs text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                يتم إرسال الفاتورة مع PDF للعميل
              </p>
            </CardContent>
          </Card>

          {/* 3. Admin Notification Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                <AlertCircle className="h-5 w-5 text-orange-600" />
                3. إشعار الأدمن
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                إرسال إشعار إلى 07757250444
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center bg-orange-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-orange-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  رقم الأدمن الثابت:
                </p>
                <p className="text-lg font-bold text-orange-900" dir="ltr">
                  07757250444
                </p>
              </div>

              <Button 
                onClick={sendAdminNotification} 
                disabled={isLoading || !status.connected}
                className="w-full"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                إرسال إشعار الأدمن
              </Button>

              <p className="text-xs text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                يتم إرسال تفاصيل الطلب + PDF للأدمن
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Messages Log */}
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>سجل الرسائل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  لا توجد رسائل حتى الآن
                </p>
              ) : (
                messages.slice(-10).reverse().map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-sm ${
                      message.type === 'success' ? 'bg-green-50 text-green-800' :
                      message.type === 'error' ? 'bg-red-50 text-red-800' :
                      'bg-blue-50 text-blue-800'
                    }`}
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    <div className="flex justify-between items-start">
                      <span>{message.text}</span>
                      <span className="text-xs opacity-60">
                        {new Date(message.timestamp).toLocaleTimeString('ar-IQ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>تعليمات الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              <p>• تأكد من أن WhatsApp متصل (حالة الاتصال: 🟢 متصل و مستقر بشكل دائم)</p>
              <p>• لاختبار OTP: أدخل رقم هاتف صالح واسم، ثم اضغط "إرسال OTP"</p>
              <p>• لاختبار فاتورة العميل: أدخل رقم طلب موجود من قاعدة البيانات</p>
              <p>• إشعار الأدمن يتم إرساله تلقائياً إلى 07757250444</p>
              <p>• جميع الرسائل تُرسل عبر Baileys WhatsApp API</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};