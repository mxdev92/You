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

  // Get wallet balance with user-specific cache key
  const { data: walletData, isLoading: isLoadingBalance } = useQuery<WalletBalance>({
    queryKey: ['/api/wallet/balance', 'user-specific'],
    retry: 1,
    staleTime: 0, // Always fetch fresh data for wallet balance
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Get wallet transactions with user-specific cache key
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<WalletTransaction[]>({
    queryKey: ['/api/wallet/transactions', 'user-specific'],
    retry: 1,
    staleTime: 0, // Always fetch fresh data for transactions
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // State for payment dialog
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [showPaymentIframe, setShowPaymentIframe] = useState(false);
  
  // Real-time payment status monitoring
  const [monitoringOrderId, setMonitoringOrderId] = useState<string | null>(null);
  
  // Real-time status check with faster polling
  const { data: paymentStatus } = useQuery({
    queryKey: ['/api/wallet/transaction-status', monitoringOrderId],
    enabled: !!monitoringOrderId,
    refetchInterval: 3000, // Check every 3 seconds for real-time updates
    retry: 10, // Keep trying for real-time monitoring
    staleTime: 0 // Always fetch fresh status
  });

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
        
        // Start monitoring payment status in real-time
        if (data.orderId) {
          setMonitoringOrderId(data.orderId);
          console.log('🔄 Started real-time payment monitoring for:', data.orderId);
        }
      }
    },
    onError: (error: any) => {
      console.error('Charge error:', error);
      setIsCharging(false);
    }
  });

  // Monitor payment status changes for real-time updates
  useEffect(() => {
    if (paymentStatus && monitoringOrderId && typeof paymentStatus === 'object' && 'status' in paymentStatus) {
      console.log('💰 Real-time payment status update:', paymentStatus);
      
      if ((paymentStatus as any).status === 'completed') {
        console.log('✅ Payment completed! Refreshing wallet data...');
        // Stop monitoring and refresh wallet data
        setMonitoringOrderId(null);
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
        setIsPaymentDialogOpen(false);
        setPaymentData(null);
      } else if ((paymentStatus as any).status === 'failed') {
        console.log('❌ Payment failed! Stopping monitoring...');
        // Stop monitoring on failure
        setMonitoringOrderId(null);
        setIsPaymentDialogOpen(false);
        setPaymentData(null);
      }
    }
  }, [paymentStatus, monitoringOrderId, queryClient]);

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
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">مكتمل</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">فاشل</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">معلق</span>;
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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">محفظة باكيتي</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Modern Balance Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Wallet className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium opacity-90">رصيد المحفظة</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {isLoadingBalance ? (
                <div className="animate-pulse bg-white/20 h-8 w-32 rounded-lg"></div>
              ) : (
                `${formatPrice(walletData?.balance || 0)} دينار`
              )}
            </div>
            <p className="text-xs text-green-100 opacity-80">متاح للاستخدام في جميع طلباتك</p>
          </div>
        </div>

        {/* Modern Charge Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Plus className="h-4 w-4 text-green-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">شحن المحفظة</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  المبلغ (دينار عراقي)
                </label>
                <input
                  type="number"
                  placeholder="1000"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  min="250"
                  step="100"
                  className="w-full px-4 py-3 text-right text-base font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  الحد الأدنى للشحن هو 250 دينار عراقي
                </p>
              </div>

              {/* Modern Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setChargeAmount(String(amount))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 mobile-scale"
                  >
                    {formatPrice(amount)}
                  </button>
                ))}
              </div>

              <button
                onClick={handleChargeWallet}
                disabled={isCharging || chargeMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl button-press shadow-sm"
              >
                {isCharging || chargeMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="text-sm">جاري المعالجة...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm">شحن عبر ZainCash</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modern Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <History className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">سجل المعاملات</h2>
            </div>

            {isLoadingTransactions ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                        <div className="space-y-1">
                          <div className="h-3 w-24 bg-gray-200 rounded"></div>
                          <div className="h-2 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="h-3 w-12 bg-gray-200 rounded"></div>
                        <div className="h-2 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-150 mobile-scale"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.3s ease-out forwards'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 bg-white rounded-lg border shadow-sm">
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('ar-IQ', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left space-y-1">
                      <p className={`text-sm font-bold ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'deposit' ? '+' : '-'}{formatPrice(parseFloat(transaction.amount))}
                      </p>
                      <div className="flex justify-end">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium">لا توجد معاملات بعد</p>
                <p className="text-xs text-gray-400 mt-1">ابدأ بشحن محفظتك</p>
              </div>
            )}
          </div>
        </div>
      </div>

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