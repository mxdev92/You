import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, Plus, History, CreditCard, ArrowUp, ArrowDown, Clock, Smartphone } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';

interface WalletTransaction {
  id: number;
  type: 'deposit' | 'payment' | 'refund';
  amount: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  zaincashTransactionId?: string;
}

interface WalletBalance {
  balance: number;
}

export default function WalletPage() {
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [isCharging, setIsCharging] = useState(false);
  const queryClient = useQueryClient();

  // Get wallet balance
  const { data: walletData, isLoading: isLoadingBalance } = useQuery<WalletBalance>({
    queryKey: ['/api/wallet/balance'],
    retry: 1
  });

  // Get wallet transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<WalletTransaction[]>({
    queryKey: ['/api/wallet/transactions'],
    retry: 1
  });

  // State for payment dialog
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [showPaymentIframe, setShowPaymentIframe] = useState(false);

  // Charge wallet mutation
  const chargeMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/wallet/charge', { amount });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPaymentData(data);
        setIsPaymentDialogOpen(true);
        setIsCharging(false);
      }
    },
    onError: (error: any) => {
      console.error('Charge error:', error);
      setIsCharging(false);
    }
  });

  const handleChargeWallet = async () => {
    const amount = parseInt(chargeAmount);
    
    if (!amount || amount < 250) {
      alert('الحد الأدنى للشحن هو 250 دينار عراقي');
      return;
    }

    setIsCharging(true);
    try {
      await chargeMutation.mutateAsync(amount);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ في شحن المحفظة');
    } finally {
      setIsCharging(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'failed':
        return <Badge variant="destructive">فاشل</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">قيد الانتظار</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'payment':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <ArrowUp className="h-4 w-4 text-blue-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="h-8 w-8 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900">محفظة باكيتي</h1>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            رصيد المحفظة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">
            {isLoadingBalance ? (
              <div className="animate-pulse bg-white/20 h-12 w-48 rounded"></div>
            ) : (
              `${formatPrice(walletData?.balance || 0)} دينار`
            )}
          </div>
          <p className="text-green-100">متاح للاستخدام في جميع طلباتك</p>
        </CardContent>
      </Card>

      {/* Charge Wallet Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            شحن المحفظة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ (دينار عراقي)
            </label>
            <Input
              type="number"
              placeholder="ادخل المبلغ (الحد الأدنى 250 دينار)"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              min="250"
              step="100"
              className="text-right"
            />
            <p className="text-sm text-gray-500 mt-1">
              الحد الأدنى للشحن هو 250 دينار عراقي
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[1000, 5000, 10000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => setChargeAmount(String(amount))}
                className="text-sm"
              >
                {formatPrice(amount)}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleChargeWallet}
            disabled={isCharging || chargeMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isCharging || chargeMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                جاري المعالجة...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                شحن عبر ZainCash
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            سجل المعاملات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 bg-white rounded-full border">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString('ar-IQ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left space-y-1">
                    <p className={`font-bold ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatPrice(parseFloat(transaction.amount))}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد معاملات بعد</p>
              <p className="text-sm">ابدأ بشحن محفظتك</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Dialog - Direct Payment Only */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              دفع مباشر عبر زين كاش
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Smartphone className="h-12 w-12 mx-auto text-blue-500 mb-2" />
              <h3 className="font-semibold text-blue-600">دفع مباشر</h3>
              <p className="text-sm text-gray-600">
                ادفع مباشرة برقم محفظتك وكلمة المرور
              </p>
              <p className="text-lg font-bold mt-2">
                المبلغ: {formatPrice(parseInt(chargeAmount))} دينار عراقي
              </p>
            </div>
            
            <Button 
              onClick={() => {
                if (paymentData?.paymentUrl) {
                  // Show embedded payment iframe within the app
                  setShowPaymentIframe(true);
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              ادفع الآن - {formatPrice(parseInt(chargeAmount))} دينار
            </Button>

            <Button 
              variant="outline" 
              onClick={() => {
                setIsPaymentDialogOpen(false);
                setPaymentData(null);
              }}
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile-Friendly Payment Bottom Sheet */}
      <Dialog open={showPaymentIframe} onOpenChange={setShowPaymentIframe}>
        <DialogContent className="max-w-full w-full h-[95vh] sm:h-[80vh] m-0 sm:m-4 p-0 overflow-hidden rounded-t-3xl sm:rounded-xl">
          <DialogHeader className="p-4 border-b bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                دفع عبر زين كاش
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPaymentIframe(false);
                  setIsPaymentDialogOpen(false);
                  setPaymentData(null);
                  // Refresh wallet data
                  queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                ✕
              </Button>
            </div>
            <p className="text-center text-green-600 font-bold">
              المبلغ: {formatPrice(parseInt(chargeAmount))} دينار عراقي
            </p>
          </DialogHeader>
          
          <div className="flex-1 relative bg-gray-50">
            {paymentData?.paymentUrl ? (
              <iframe
                src={paymentData.paymentUrl}
                className="w-full h-full border-0"
                title="ZainCash Payment"
                onLoad={() => {
                  console.log('Payment iframe loaded successfully');
                }}
                style={{ 
                  minHeight: '400px',
                  background: 'white'
                }}
                allowFullScreen
                allow="payment"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">جاري تحميل صفحة الدفع...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Payment Instructions */}
          <div className="p-4 bg-blue-50 border-t">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                ℹ
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">تعليمات الدفع:</p>
                <p>• ادخل رقم محفظتك زين كاش وكلمة المرور</p>
                <p>• تأكد من المبلغ ثم اضغط تأكيد الدفع</p>
                <p>• سيتم تحديث رصيدك تلقائياً بعد نجاح العملية</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}