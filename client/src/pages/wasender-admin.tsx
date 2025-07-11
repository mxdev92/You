import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Phone, MessageSquare, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface WasenderStatus {
  success: boolean;
  message: string;
  data?: any;
}

export function WasenderAdminPage() {
  const [status, setStatus] = useState<WasenderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('07701234567');
  const [testMessage, setTestMessage] = useState('اختبار WasenderAPI - تم الإرسال بنجاح!');
  const [testResult, setTestResult] = useState<any>(null);

  // Fetch initial status
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wasender/status', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      setStatus(data);
    } catch (error: any) {
      setStatus({
        success: false,
        message: error.message || 'Failed to fetch status'
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeSession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wasender/initialize', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setStatus(data);
    } catch (error: any) {
      setStatus({
        success: false,
        message: error.message || 'Failed to initialize session'
      });
    } finally {
      setLoading(false);
    }
  };

  const testWasenderAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wasender/test', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: testMessage
        })
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wasender/stats', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      console.log('WasenderAPI Stats:', data);
    } catch (error: any) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: WasenderStatus | null) => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    
    if (status.success) {
      if (status.data?.status === 'authenticated') {
        return <Badge variant="default" className="bg-green-500">🟢 Connected</Badge>;
      } else if (status.data?.status === 'qr') {
        return <Badge variant="secondary">📱 Scan QR Code</Badge>;
      } else {
        return <Badge variant="outline">⚪ Ready</Badge>;
      }
    } else {
      return <Badge variant="destructive">🔴 Disconnected</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WasenderAPI Admin Panel</h1>
        <p className="text-gray-600">Manage stable WhatsApp API connection for Pakety delivery app</p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Connection Status
            {getStatusBadge(status)}
          </CardTitle>
          <CardDescription>
            Current WasenderAPI session status and connection health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={fetchStatus} disabled={loading} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Refresh Status
              </Button>
              <Button onClick={initializeSession} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Initialize Session
              </Button>
              <Button onClick={getStats} disabled={loading} variant="secondary">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Get Stats
              </Button>
            </div>

            {status && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {status.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    {status.success ? 'Success' : 'Error'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{status.message}</p>
                {status.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600">View Details</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(status.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Testing Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Message Testing
          </CardTitle>
          <CardDescription>
            Test WasenderAPI message delivery to verify connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testPhone">Test Phone Number</Label>
                <Input
                  id="testPhone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="07701234567"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="testMessage">Test Message</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="اختبار WasenderAPI..."
                className="h-20"
              />
            </div>

            <Button onClick={testWasenderAPI} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Test Message
            </Button>

            {testResult && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    Test Result: {testResult.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{testResult.message}</p>
                {testResult.phone && (
                  <p className="text-xs text-gray-500 mt-1">
                    Phone: {testResult.phone} | Service: {testResult.service}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Setup Instructions
          </CardTitle>
          <CardDescription>
            Complete WasenderAPI setup process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-800 mb-2">Required Setup Steps:</h3>
              <ol className="text-sm text-blue-700 space-y-2">
                <li><strong>1.</strong> Sign up at <a href="https://wasenderapi.com" target="_blank" rel="noopener noreferrer" className="underline">wasenderapi.com</a></li>
                <li><strong>2.</strong> Create a new WhatsApp session in the dashboard</li>
                <li><strong>3.</strong> Scan QR code with your WhatsApp mobile app</li>
                <li><strong>4.</strong> Copy session API key and update server configuration</li>
                <li><strong>5.</strong> Test connection using the buttons above</li>
              </ol>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
              <h4 className="font-semibold text-amber-800 mb-2">Current Status:</h4>
              <p className="text-sm text-amber-700">
                WasenderAPI credentials are configured but session needs to be activated on their platform.
                The "Missing or invalid authorization header" error indicates the session isn't properly authenticated yet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            WasenderAPI Benefits
          </CardTitle>
          <CardDescription>
            Why WasenderAPI is better than Baileys for production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">99.5% uptime vs 0% with Baileys</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">$6/month for unlimited messages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">No 440 status errors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Professional support included</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Proxy protection reduces bans</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">PDF invoice delivery guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Cloud-hosted, no maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Solves Baileys 440 timeout issues</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}