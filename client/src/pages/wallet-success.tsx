import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function WalletSuccess() {
  const [, setLocation] = useLocation();
  
  // Get amount from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const amount = urlParams.get('amount') || '0';

  useEffect(() => {
    // Auto-redirect to wallet page after 3 seconds
    const timeout = setTimeout(() => {
      setLocation('/wallet');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">تم شحن المحفظة بنجاح!</h1>
          <p className="text-lg text-green-600 font-semibold">
            تم إضافة {parseInt(amount).toLocaleString('en-US')} دينار عراقي إلى محفظتك
          </p>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation('/wallet')} 
            className="w-full bg-green-500 hover:bg-green-600"
          >
            عرض المحفظة
          </Button>
          
          <Button 
            onClick={() => setLocation('/')} 
            variant="outline" 
            className="w-full"
          >
            العودة للتسوق
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          سيتم توجيهك تلقائياً لصفحة المحفظة خلال 3 ثوانِ...
        </p>
      </div>
    </div>
  );
}