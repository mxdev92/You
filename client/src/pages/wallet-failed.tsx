import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function WalletFailed() {
  const [, setLocation] = useLocation();
  
  // Get error from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error') || 'payment_failed';

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'missing_token':
        return 'رمز المعاملة مفقود';
      case 'invalid_token':
        return 'رمز المعاملة غير صحيح';
      case 'transaction_not_found':
        return 'المعاملة غير موجودة';
      case 'payment_failed':
        return 'فشل في عملية الدفع';
      case 'callback_error':
        return 'خطأ في تأكيد الدفع';
      default:
        return 'حدث خطأ في عملية الدفع';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">فشل في شحن المحفظة</h1>
          <p className="text-lg text-red-600">
            {getErrorMessage(error)}
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">
            لم يتم خصم أي مبلغ من محفظتك. يمكنك المحاولة مرة أخرى بأمان.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation('/wallet')} 
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            المحاولة مرة أخرى
          </Button>
          
          <Button 
            onClick={() => setLocation('/')} 
            variant="outline" 
            className="w-full"
          >
            العودة للتسوق
          </Button>
        </div>
      </div>
    </div>
  );
}