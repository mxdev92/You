import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Phone, Mail, Lock, LogOut, Package, Clock, MapPin, Send, Bell, CheckCircle, XCircle, DollarSign, Truck, AlertCircle, Activity, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/price-utils';

interface Driver {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  isActive?: boolean;
  notificationToken?: string;
}

interface Order {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: any[];
}

interface NewOrderNotification {
  orderId: number;
  customerName: string;
  customerAddress: string;
  totalAmount: number;
  timestamp: string;
}

// Professional Order Popup Component
const OrderNotificationPopup = ({ 
  notification, 
  isOpen, 
  onAccept, 
  onReject, 
  onClose 
}: {
  notification: NewOrderNotification | null;
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}) => {
  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto animate-in slide-in-from-top-4 rounded-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl font-bold text-green-600 flex items-center justify-center gap-2">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
            طلب جديد
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-3">
          {/* Customer Name */}
          <div className="space-y-1">
            <Label className="text-gray-700 font-semibold flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-blue-600" />
              اسم صاحب الطلبية
            </Label>
            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-900 text-sm">{notification.customerName}</p>
            </div>
          </div>

          {/* Customer Address */}
          <div className="space-y-1">
            <Label className="text-gray-700 font-semibold flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-orange-600" />
              عنوان صاحب الطلبية
            </Label>
            <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-200">
              <p className="font-medium text-orange-900 text-sm leading-relaxed">{notification.customerAddress}</p>
            </div>
          </div>

          {/* Total Price */}
          <div className="space-y-1">
            <Label className="text-gray-700 font-semibold flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              السعر الكلي
            </Label>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="font-bold text-green-700 text-lg text-center">
                {formatPrice(notification.totalAmount)} دينار عراقي
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3">
            <Button
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base shadow-lg hover:shadow-xl transition-all touch-manipulation"
              size="lg"
            >
              <CheckCircle className="h-4 w-4 ml-2" />
              قبول
            </Button>
            <Button
              onClick={onReject}
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-base shadow-lg hover:shadow-xl transition-all touch-manipulation"
              size="lg"
            >
              <XCircle className="h-4 w-4 ml-2" />
              رفض
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DriverLogin = ({ onLogin }: { onLogin: (driver: Driver) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/driver/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${data.driver.fullName}`,
        });
        onLogin(data.driver);
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: data.message || "تحقق من بيانات تسجيل الدخول",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تحقق من اتصالك بالإنترنت",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-3">
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardHeader className="text-center bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg p-4">
          <CardTitle className="text-xl sm:text-2xl font-bold">
            تسجيل دخول السائق
          </CardTitle>
          <p className="text-green-100 text-sm">
            PAKETY - نظام إدارة التوصيل
          </p>
          <p className="text-xs text-green-200 mt-2">
            للاختبار: driver@pakety.com / driver123
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@pakety.com"
                required
                className="text-left h-11 border-2 focus:border-green-500 text-base"
                dir="ltr"
                autoComplete="email"
                inputMode="email"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                <Lock className="w-4 h-4" />
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-left h-11 border-2 focus:border-green-500 text-base"
                autoComplete="current-password"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 h-11 text-base font-semibold shadow-lg touch-manipulation mt-6" 
              disabled={isLoading}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const DriverDashboard = ({ driver }: { driver: Driver }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrderNotification, setNewOrderNotification] = useState<NewOrderNotification | null>(null);
  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [stats, setStats] = useState({
    todayOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0
  });
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Helper function to format address objects
  const formatAddress = (address: any): string => {
    if (!address) return 'لا يوجد عنوان';
    
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      const parts = [
        address.governorate,
        address.district, 
        address.neighborhood
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(' - ') : 'لا يوجد عنوان';
    }
    
    return 'لا يوجد عنوان';
  };

  // Real-time WebSocket connection for order notifications
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for driver notifications');
        setConnectionStatus('connected');
        
        // Register as driver for notifications
        wsRef.current?.send(JSON.stringify({
          type: 'driver_register',
          driverId: driver.id
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          console.log('🔔 RAW WebSocket message received:', event.data);
          const data = JSON.parse(event.data);
          console.log('🔔 PARSED WebSocket message:', data);
          
          if (data.type === 'new_order') {
            console.log('✅ NEW ORDER notification received - showing popup!');
            console.log('📋 Order data:', {
              orderId: data.orderId,
              customerName: data.customerName,
              customerAddress: data.customerAddress,
              totalAmount: data.totalAmount
            });
            
            // Show order notification popup
            setNewOrderNotification({
              orderId: data.orderId,
              customerName: data.customerName,
              customerAddress: data.customerAddress,
              totalAmount: data.totalAmount,
              timestamp: new Date().toISOString()
            });
            setIsOrderPopupOpen(true);
            console.log('🎯 Popup state set to TRUE - should appear now!');
            
            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.play().catch(() => {/* Sound failed, ignore */});
            } catch (e) {
              // Ignore sound errors
            }
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setConnectionStatus('disconnected');
        
        // Reconnect after 3 seconds
        setTimeout(() => {
          setConnectionStatus('connecting');
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [driver.id]);

  useEffect(() => {
    loadOrders();
    loadStats();
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadOrders();
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/driver/orders', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/driver/stats', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAcceptOrder = async () => {
    if (!newOrderNotification) return;

    try {
      const response = await fetch(`/api/orders/${newOrderNotification.orderId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ driverId: driver.id })
      });

      if (response.ok) {
        toast({
          title: "تم قبول الطلب",
          description: "تم قبول الطلب بنجاح وسيتم إشعار العميل",
        });
        loadOrders(); // Refresh orders list
        loadStats(); // Refresh stats
      } else {
        toast({
          title: "خطأ",
          description: "فشل في قبول الطلب",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Accept order error:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تحقق من اتصالك بالإنترنت",
        variant: "destructive",
      });
    } finally {
      setIsOrderPopupOpen(false);
      setNewOrderNotification(null);
    }
  };

  const handleRejectOrder = async () => {
    if (!newOrderNotification) return;

    try {
      const response = await fetch(`/api/orders/${newOrderNotification.orderId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ driverId: driver.id })
      });

      if (response.ok) {
        toast({
          title: "تم رفض الطلب",
          description: "تم رفض الطلب وسيتم إشعار العميل",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في رفض الطلب",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Reject order error:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تحقق من اتصالك بالإنترنت",
        variant: "destructive",
      });
    } finally {
      setIsOrderPopupOpen(false);
      setNewOrderNotification(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/driver/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Clear driver session and redirect to login
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any; color: string } } = {
      'pending': { label: 'في الانتظار', variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { label: 'مؤكد', variant: 'default', color: 'bg-blue-100 text-blue-800' },
      'preparing': { label: 'قيد التحضير', variant: 'default', color: 'bg-orange-100 text-orange-800' },
      'out-for-delivery': { label: 'في الطريق', variant: 'default', color: 'bg-purple-100 text-purple-800' },
      'delivered': { label: 'تم التوصيل', variant: 'default', color: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'ملغي', variant: 'destructive', color: 'bg-red-100 text-red-800' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary', color: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={`${statusInfo.color} border-none font-medium`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return { text: 'متصل', color: 'text-green-600' };
      case 'disconnected':
        return { text: 'غير متصل', color: 'text-red-600' };
      case 'connecting':
        return { text: 'جاري الاتصال...', color: 'text-yellow-600' };
      default:
        return { text: 'غير معروف', color: 'text-gray-600' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const connectionStatusInfo = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 gap-3">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-blue-500">
                <AvatarFallback className="text-white font-bold text-sm sm:text-lg">
                  {driver.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{driver.fullName}</h1>
                <p className="text-xs sm:text-sm text-gray-600">{driver.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-2 space-x-reverse">
                {getConnectionIcon()}
                <span className={`text-xs sm:text-sm font-medium ${connectionStatusInfo.color}`}>
                  {connectionStatusInfo.text}
                </span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0">
                <div className="text-center sm:text-right">
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">طلبات اليوم</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.todayOrders}</p>
                </div>
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0">
                <div className="text-center sm:text-right">
                  <p className="text-green-100 text-xs sm:text-sm font-medium">مكتملة</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.completedOrders}</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0">
                <div className="text-center sm:text-right">
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">في الانتظار</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.pendingOrders}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0">
                <div className="text-center sm:text-right">
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">الأرباح</p>
                  <p className="text-lg sm:text-2xl font-bold">{formatPrice(stats.totalEarnings)}</p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List - Mobile Optimized */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
              الطلبات الحالية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-base sm:text-lg font-medium">لا توجد طلبات حالياً</p>
                <p className="text-gray-400 text-sm sm:text-base">ستظهر الطلبات الجديدة هنا تلقائياً</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <div key={order.id} className="p-3 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">طلب رقم #{order.id}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{order.customerName}</p>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{order.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                        <span className="text-gray-700 truncate">
                          {formatAddress(order.address)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                        <span className="font-medium text-green-700">{formatPrice(order.totalAmount)} د.ع</span>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse text-xs sm:text-sm text-gray-500">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString('ar-IQ')}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {order.items?.length || 0} عنصر
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Notification Popup */}
      <OrderNotificationPopup
        notification={newOrderNotification}
        isOpen={isOrderPopupOpen}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        onClose={() => {
          setIsOrderPopupOpen(false);
          setNewOrderNotification(null);
        }}
      />
    </div>
  );
};

const DriverPage = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if driver is already logged in
    checkDriverAuth();
  }, []);

  const checkDriverAuth = async () => {
    try {
      const response = await fetch('/api/driver/auth-check', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.driver) {
          setDriver(data.driver);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = (driverData: Driver) => {
    setDriver(driverData);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  return driver ? (
    <DriverDashboard driver={driver} />
  ) : (
    <DriverLogin onLogin={handleLogin} />
  );
};

export default DriverPage;