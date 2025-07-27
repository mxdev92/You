import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, Plus, History, CreditCard, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/price-utils';

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

  // Charge wallet mutation
  const chargeMutation = useMutation({
    mutationFn: async (amount: number) => {
      return await apiRequest('/api/wallet/charge', {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        // Redirect to Zaincash payment page
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      console.error('Charge error:', error);
    }
  });

  const handleChargeWallet = async () => {
    const amount = parseInt(chargeAmount);
    
    if (!amount || amount < 5000) {
      alert('الحد الأدنى للشحن هو 5,000 دينار عراقي');
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
              placeholder="ادخل المبلغ (الحد الأدنى 5,000 دينار)"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              min="5000"
              step="1000"
              className="text-right"
            />
            <p className="text-sm text-gray-500 mt-1">
              الحد الأدنى للشحن هو 5,000 دينار عراقي
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[5000, 10000, 25000].map((amount) => (
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
    </div>
  );
}