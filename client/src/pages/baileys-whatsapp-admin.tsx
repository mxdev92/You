import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Smartphone, Wifi, WifiOff, QrCode, Shield } from 'lucide-react';

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
    otp: ''
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
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          setQrCode(qrData.qr);
        }
      } catch (error) {
        console.error('Failed to check status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const addMessage = (type: Message['type'], text: string) => {
    const message: Message = {
      type,
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [message, ...prev].slice(0, 20));
  };

  const initializeWhatsApp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/initialize', {
        method: 'POST'
      });

      if (response.ok) {
        addMessage('success', 'تم بدء تشغيل خدمة Baileys WhatsApp - انتظر رمز QR');
      } else {
        addMessage('error', 'فشل في تشغيل خدمة WhatsApp');
      }
    } catch (error) {
      addMessage('error', 'خطأ في الاتصال');
    }
    setIsLoading(false);
  };

  const resetSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/reset-session', {
        method: 'POST'
      });

      if (response.ok) {
        addMessage('success', 'تم إعادة تعيين الجلسة - سيتم إنشاء QR جديد');
        setQrCode(null);
      } else {
        addMessage('error', 'فشل في إعادة تعيين الجلسة');
      }
    } catch (error) {
      addMessage('error', 'خطأ في الاتصال');
    }
    setIsLoading(false);
  };

  const sendOTP = async () => {
    if (!testData.phoneNumber || !testData.fullName) {
      addMessage('error', 'يرجى إدخال رقم الهاتف والاسم');
      return;
    }

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
        
        // Clear OTP input - user must enter manually
        setTestData(prev => ({ ...prev, otp: '' }));
        
        if (data.note) {
          // Fallback mode
          addMessage('error', `⚠️ فشل إرسال OTP عبر WhatsApp - الرمز المؤقت: ${data.otp}`);
        } else {
          // Normal delivery
          addMessage('success', `تم إرسال رمز OTP عبر Baileys WhatsApp إلى ${testData.phoneNumber}`);
          addMessage('info', 'يرجى إدخال الرمز المرسل إلى WhatsApp يدوياً');
        }
      } else {
        const errorData = await response.json();
        addMessage('error', `فشل في إرسال OTP: ${errorData.message}`);
      }
    } catch (error) {
      addMessage('error', 'خطأ في الاتصال');
    }
    setIsLoading(false);
  };

  const verifyOTP = async () => {
    if (!testData.phoneNumber || !testData.otp) {
      addMessage('error', 'يرجى إدخال رقم الهاتف و رمز OTP');
      return;
    }

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
        setTestData(prev => ({ ...prev, otp: '' }));
      } else {
        addMessage('error', data.message);
      }
    } catch (error) {
      addMessage('error', 'خطأ في التحقق من OTP');
    }
    setIsLoading(false);
  };

  const getStatusColor = () => {
    if (status.connected) return 'bg-green-500';
    if (status.connecting) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (status.connected) return <Wifi className="h-4 w-4" />;
    if (status.connecting) return <RefreshCw className="h-4 w-4 animate-spin" />;
    return <WifiOff className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-green-600" />
                <CardTitle className="text-xl">إدارة Baileys WhatsApp Business</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <Badge className={`${getStatusColor()} text-white`}>
                  {status.connected ? 'متصل' : status.connecting ? 'جاري الاتصال' : 'غير متصل'}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* QR Code Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                مصادقة WhatsApp Business
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {qrCode ? (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block border-2 border-green-200">
                    <img 
                      src={qrCode} 
                      alt="WhatsApp QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-2">تعليمات المسح:</p>
                        <ol className="space-y-1 text-right">
                          <li>1. افتح تطبيق WhatsApp Business على هاتفك</li>
                          <li>2. انقر على القائمة (ثلاث نقاط) → الأجهزة المرتبطة</li>
                          <li>3. انقر على "ربط جهاز"</li>
                          <li>4. امسح رمز QR أعلاه</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">لا يوجد رمز QR متاح</p>
                  <p className="text-sm text-gray-400">انقر على "تشغيل WhatsApp" لإنشاء رمز جديد</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={initializeWhatsApp}
                  disabled={isLoading || status.connected}
                  className="flex-1"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                  تشغيل WhatsApp
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={resetSession}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* OTP Testing */}
          <Card>
            <CardHeader>
              <CardTitle>اختبار نظام OTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    رقم الهاتف (مثال: 07701234567)
                  </label>
                  <Input
                    value={testData.phoneNumber}
                    onChange={(e) => setTestData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="07701234567"
                    className="text-right"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    الاسم الكامل
                  </label>
                  <Input
                    value={testData.fullName}
                    onChange={(e) => setTestData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="اختبار المستخدم"
                    className="text-right"
                  />
                </div>

                <Button 
                  onClick={sendOTP}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : null}
                  إرسال رمز التأكيد
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    رمز OTP (4 أرقام)
                  </label>
                  <Input
                    value={testData.otp}
                    onChange={(e) => setTestData(prev => ({ ...prev, otp: e.target.value }))}
                    placeholder="1234"
                    maxLength={4}
                    className="text-center text-lg font-mono"
                  />
                </div>

                <Button 
                  onClick={verifyOTP}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : null}
                  تأكيد الرمز
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Messages Log */}
        <Card>
          <CardHeader>
            <CardTitle>سجل الرسائل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-4">لا توجد رسائل</p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      message.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : message.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm">{message.text}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(message.timestamp).toLocaleTimeString('ar-IQ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}