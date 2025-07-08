import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Wifi, WifiOff, QrCode, RotateCcw } from 'lucide-react';

interface BaileysStatus {
  connected: boolean;
  connecting: boolean;
  status: string;
}

export default function BaileysAdmin() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query Baileys status
  const { data: status, isLoading } = useQuery<BaileysStatus>({
    queryKey: ['/api/baileys/status'],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Initialize Baileys
  const initializeMutation = useMutation({
    mutationFn: () => apiRequest('/api/baileys/initialize', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/baileys/status'] });
      // Start polling for QR code
      pollQRCode();
    },
  });

  // Reset Baileys session
  const resetMutation = useMutation({
    mutationFn: () => apiRequest('/api/baileys/reset', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/baileys/status'] });
      setQrCode(null);
    },
  });

  // Poll for QR code
  const pollQRCode = async () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/baileys/qr');
        if (response.ok) {
          const data = await response.json();
          setQrCode(data.qrCode);
        } else {
          setQrCode(null);
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
      }
    }, 2000);

    // Clear interval after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  // Clear QR code when connected
  useEffect(() => {
    if (status?.connected) {
      setQrCode(null);
    }
  }, [status?.connected]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="h-4 w-4" />;
      case 'connecting': return <RotateCcw className="h-4 w-4 animate-spin" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              إدارة WhatsApp للفواتير (Baileys)
            </CardTitle>
            <CardDescription>
              اتصال مجاني لإرسال فواتير PDF عبر واتساب
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Display */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">حالة الاتصال:</span>
                <Badge variant="outline" className={`${getStatusColor(status?.status || 'disconnected')} text-white`}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(status?.status || 'disconnected')}
                    {status?.status === 'connected' && 'متصل'}
                    {status?.status === 'connecting' && 'جاري الاتصال'}
                    {status?.status === 'disconnected' && 'غير متصل'}
                  </span>
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => initializeMutation.mutate()}
                disabled={initializeMutation.isPending || status?.connecting}
                className="flex-1"
              >
                {initializeMutation.isPending ? 'جاري الاتصال...' : 'بدء الاتصال'}
              </Button>
              <Button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                variant="outline"
              >
                {resetMutation.isPending ? 'جاري الإعادة...' : 'إعادة تعيين'}
              </Button>
            </div>

            {/* QR Code Display */}
            {qrCode && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">امسح QR Code بواتساب</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    1. افتح واتساب على هاتفك<br/>
                    2. انقر على النقاط الثلاث → الأجهزة المرتبطة<br/>
                    3. انقر على "ربط جهاز" وامسح الكود أدناه
                  </p>
                </div>
                
                <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="max-w-xs"
                  />
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">🚀 مميزات الاتصال المجاني:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• إرسال فواتير PDF مجاناً للعملاء</li>
                <li>• إشعارات فورية للإدارة مع الفواتير</li>
                <li>• لا توجد رسوم أو اشتراكات</li>
                <li>• يعمل مع أي رقم واتساب</li>
              </ul>
            </div>

            {/* Status Info */}
            {status?.connected && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Wifi className="h-4 w-4" />
                  <span className="font-medium">متصل بنجاح!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  الآن سيتم إرسال فواتير PDF للعملاء والإدارة عبر واتساب مجاناً
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}