import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Bell, CheckCircle, XCircle, MapPin, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Driver {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  vehicleType: string;
  isActive: boolean;
  isOnline: boolean;
  totalDeliveries: number;
  totalEarnings: number;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  address: {
    fullAddress: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryFee: number;
  status: string;
  orderDate: string;
}

interface OrderNotification {
  orderId: number;
  customerName: string;
  totalAmount: number;
  address: string;
  timestamp: string;
}

// Order Notification Modal Component
const OrderNotificationModal: React.FC<{
  notification: OrderNotification;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}> = ({ notification, onAccept, onDecline, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 second auto-decline

  useEffect(() => {
    // Play notification sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(console.error);

    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Auto-decline timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="bg-green-500 text-white text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Bell className="w-6 h-6" />
            طلب توصيل جديد!
          </CardTitle>
          <div className="text-sm opacity-90">
            سيتم الرفض تلقائياً خلال {timeLeft} ثانية
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-lg font-bold text-gray-900">
              {notification.customerName}
            </div>
            <div className="text-2xl font-bold text-green-600">
              {notification.totalAmount.toLocaleString()} IQD
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
              <div className="text-right text-gray-700 text-sm leading-relaxed">
                {notification.address}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onDecline}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              رفض
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              قبول
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function DriverPage() {
  const queryClient = useQueryClient();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [orderNotification, setOrderNotification] = useState<OrderNotification | null>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check driver session
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/driver/session'],
    retry: false,
    refetchInterval: isLoggedIn ? 5000 : false, // Check session every 5 seconds when logged in
  });

  // Get driver orders
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/driver/orders'],
    enabled: isLoggedIn,
    refetchInterval: 3000, // Check for new orders every 3 seconds
  });

  // Driver login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest('POST', '/api/driver/login', data);
    },
    onSuccess: (data) => {
      setDriver(data.driver);
      setIsLoggedIn(true);
      queryClient.invalidateQueries({ queryKey: ['/api/driver/session'] });
    },
  });

  // Driver logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/driver/logout', {});
    },
    onSuccess: () => {
      setDriver(null);
      setIsLoggedIn(false);
      setOrderNotification(null);
      queryClient.clear();
    },
  });

  // Update driver status mutation
  const statusMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      return apiRequest('POST', '/api/driver/status', { isOnline });
    },
    onSuccess: (data) => {
      setDriver(data.driver);
      queryClient.invalidateQueries({ queryKey: ['/api/driver/session'] });
    },
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest('POST', `/api/driver/orders/${orderId}/accept`, {});
    },
    onSuccess: () => {
      setOrderNotification(null);
      queryClient.invalidateQueries({ queryKey: ['/api/driver/orders'] });
    },
  });

  // Decline order mutation
  const declineOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest('POST', `/api/driver/orders/${orderId}/decline`, {});
    },
    onSuccess: () => {
      setOrderNotification(null);
      queryClient.invalidateQueries({ queryKey: ['/api/driver/orders'] });
    },
  });

  // Check for session on mount
  useEffect(() => {
    if (sessionData?.driver) {
      setDriver(sessionData.driver);
      setIsLoggedIn(true);
    }
  }, [sessionData]);

  // Simulate order notifications (in real implementation, this would come from WebSocket)
  useEffect(() => {
    if (!isLoggedIn || !driver?.isOnline) return;

    const interval = setInterval(() => {
      // Check for new orders and simulate notification
      if (orders.length > 0 && Math.random() > 0.8) { // 20% chance every 3 seconds
        const randomOrder = orders[Math.floor(Math.random() * orders.length)];
        if (randomOrder.status === 'pending') {
          setOrderNotification({
            orderId: randomOrder.id,
            customerName: randomOrder.customerName,
            totalAmount: randomOrder.totalAmount,
            address: randomOrder.address.fullAddress,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoggedIn, driver?.isOnline, orders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.email && loginData.password) {
      loginMutation.mutate(loginData);
    }
  };

  const handleStatusToggle = (checked: boolean) => {
    statusMutation.mutate(checked);
  };

  const handleAcceptOrder = () => {
    if (orderNotification) {
      acceptOrderMutation.mutate(orderNotification.orderId);
    }
  };

  const handleDeclineOrder = () => {
    if (orderNotification) {
      declineOrderMutation.mutate(orderNotification.orderId);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-12 h-12 text-green-500 animate-pulse mx-auto mb-4" />
          <div className="text-lg">جاري التحقق من الجلسة...</div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Truck className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">PAKETY Driver</CardTitle>
            <div className="text-gray-600">تسجيل دخول السائق</div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="example@pakety.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
              {loginMutation.error && (
                <Alert>
                  <AlertDescription>
                    خطأ في تسجيل الدخول. يرجى التحقق من البيانات.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">مرحباً {driver?.fullName}</h1>
                  <div className="text-gray-600">{driver?.vehicleType} • {driver?.phone}</div>
                </div>
              </div>
              <Button
                onClick={() => logoutMutation.mutate()}
                variant="outline"
                disabled={logoutMutation.isPending}
              >
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              حالة الاستقبال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {driver?.isOnline ? 'متاح لاستقبال الطلبات' : 'غير متاح'}
                </div>
                <div className="text-sm text-gray-600">
                  {driver?.isOnline 
                    ? 'ستتلقى إشعارات الطلبات الجديدة' 
                    : 'لن تتلقى أي طلبات جديدة'
                  }
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={driver?.isOnline ? "default" : "secondary"}>
                  {driver?.isOnline ? 'متصل' : 'غير متصل'}
                </Badge>
                <Switch
                  checked={driver?.isOnline || false}
                  onCheckedChange={handleStatusToggle}
                  disabled={statusMutation.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Truck className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{driver?.totalDeliveries || 0}</div>
              <div className="text-gray-600">إجمالي التوصيلات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{(driver?.totalEarnings || 0).toLocaleString()}</div>
              <div className="text-gray-600">إجمالي الأرباح (IQD)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
              <div className="text-gray-600">الطلبات المتاحة</div>
            </CardContent>
          </Card>
        </div>

        {/* Current Orders */}
        <Card>
          <CardHeader>
            <CardTitle>الطلبات الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد طلبات حالياً
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">طلب #{order.id} - {order.customerName}</div>
                      <Badge variant={order.status === 'pending' ? 'default' : 'secondary'}>
                        {order.status === 'pending' ? 'في الانتظار' : order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {order.address.fullAddress}
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {order.totalAmount.toLocaleString()} IQD
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Notification Modal */}
      <AnimatePresence>
        {orderNotification && (
          <OrderNotificationModal
            notification={orderNotification}
            onAccept={handleAcceptOrder}
            onDecline={handleDeclineOrder}
            onClose={() => setOrderNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}