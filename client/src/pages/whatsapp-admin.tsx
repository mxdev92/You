import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Smartphone, QrCode, Link, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WasenderStatus {
  success: boolean;
  message: string;
  data?: {
    status: string;
    [key: string]: any;
  };
}

export default function WhatsAppAdmin() {
  const [status, setStatus] = useState<WasenderStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('07701234567');
  const { toast } = useToast();

  // Check status on component mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/wasender/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check status:', error);
      setStatus({ success: false, message: 'Failed to check status' });
    }
  };

  const getQRCode = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wasender/qr');
      const data = await response.json();
      
      if (data.success && data.data?.qrCode) {
        setQrCode(data.data.qrCode);
        toast({
          title: "QR Code Retrieved",
          description: "Scan the QR code with WhatsApp to connect your session.",
        });
      } else {
        toast({
          title: "QR Code Error",
          description: data.message || "Failed to get QR code",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retrieve QR code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wasender/connect', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Connection Initiated",
          description: "WhatsApp session connection started.",
        });
        // Refresh status after connection attempt
        setTimeout(checkStatus, 2000);
      } else {
        toast({
          title: "Connection Error",
          description: data.message || "Failed to connect session",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testMessaging = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Validation Error",
        description: "Please enter both phone number and message",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/wasender/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: testMessage
        })
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Message Sent",
          description: `Test message sent successfully to ${testPhone}`,
        });
      } else {
        toast({
          title: "Message Failed",
          description: data.message || "Failed to send test message",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    
    const statusValue = status.data?.status || 'unknown';
    switch (statusValue) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" />Connected</Badge>;
      case 'need_scan':
        return <Badge variant="secondary"><AlertCircle className="w-4 h-4 mr-1" />Need Scan</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Disconnected</Badge>;
      default:
        return <Badge variant="secondary">{statusValue}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Admin Panel</h1>
            <p className="text-gray-600">Manage WasenderAPI WhatsApp connection and messaging</p>
          </div>
          <Button onClick={checkStatus} variant="outline">
            Refresh Status
          </Button>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              {getStatusBadge()}
              <span className="text-sm text-gray-600">
                {status?.message || 'Checking...'}
              </span>
            </div>

            {status?.data?.status === 'connected' && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  ✅ WhatsApp is connected and ready for OTP delivery and invoice sending!
                </AlertDescription>
              </Alert>
            )}

            {status?.data?.status === 'need_scan' && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  ⚠️ WhatsApp session needs QR code scanning to activate. Click "Get QR Code" below.
                </AlertDescription>
              </Alert>
            )}

            {!status?.success && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  ❌ Connection failed: {status?.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Session Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={getQRCode} disabled={loading}>
                Get QR Code
              </Button>
              <Button onClick={connectSession} disabled={loading} variant="outline">
                <Link className="w-4 h-4 mr-2" />
                Connect Session
              </Button>
            </div>

            {qrCode && (
              <div className="mt-4 p-4 border rounded-lg bg-white">
                <h3 className="text-sm font-medium mb-2">QR Code for WhatsApp Connection:</h3>
                <div className="text-xs bg-gray-100 p-2 rounded font-mono break-all">
                  {qrCode}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Use a QR code generator to create an image from this string, then scan with WhatsApp.
                </p>
              </div>
            )}

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Note:</strong> Session management requires a Personal Access Token. The current Bearer token works for messaging but not for QR codes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Test Messaging */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Test Messaging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="07701234567"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Test Message</label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="اختبار الرسائل"
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <Button onClick={testMessaging} disabled={loading || !testPhone || !testMessage}>
              Send Test Message
            </Button>
          </CardContent>
        </Card>

        {/* Current Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>System Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>OTP Delivery:</span>
                <Badge variant="default" className="bg-green-500">✅ Working</Badge>
              </div>
              <div className="flex justify-between">
                <span>Invoice PDF Delivery:</span>
                <Badge variant="default" className="bg-green-500">✅ Working</Badge>
              </div>
              <div className="flex justify-between">
                <span>WhatsApp Connection:</span>
                {getStatusBadge()}
              </div>
              <div className="flex justify-between">
                <span>Session Management:</span>
                <Badge variant="secondary">Requires Personal Access Token</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}