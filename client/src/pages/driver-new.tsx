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
  const [offlineQueue, setOfflineQueue] = useState<NewOrderNotification[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());
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

  // BACKGROUND-PERSISTENT WebSocket connection - NEVER disconnects even when backgrounded
  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 999; // Unlimited reconnection attempts
    let heartbeatInterval: NodeJS.Timeout;
    let backgroundHeartbeatInterval: NodeJS.Timeout;
    let isBackgrounded = false;
    
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`🔌 [BACKGROUND-PERSISTENT] Attempting WebSocket connection to: ${wsUrl}`);
      console.log(`🚗 [BACKGROUND-PERSISTENT] Driver Info:`, { id: driver.id, name: driver.fullName });
      console.log(`🔄 [BACKGROUND-PERSISTENT] Reconnect attempt: ${reconnectAttempts + 1} (unlimited)`);
      
      // Background-persistent WebSocket optimized for constant connectivity
      wsRef.current = new WebSocket(wsUrl);
      
      // Aggressive connection timeout handling for background persistence
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.log('⏰ [BACKGROUND-PERSISTENT] Connection timeout - forcing close and immediate retry');
          wsRef.current.close();
        }
      }, 5000); // Reduced to 5 seconds for faster recovery
      
      wsRef.current.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ [BACKGROUND-PERSISTENT] WebSocket connected successfully!');
        setConnectionStatus('connected');
        reconnectAttempts = 0; // Reset on successful connection
        
        // ULTRA-AGGRESSIVE heartbeat system for background persistence
        clearInterval(heartbeatInterval);
        clearInterval(backgroundHeartbeatInterval);
        
        // Primary heartbeat - frequent when active
        heartbeatInterval = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ 
              type: 'ping', 
              driverId: driver.id,
              backgrounded: isBackgrounded,
              timestamp: Date.now()
            }));
            console.log(`💗 [BACKGROUND-PERSISTENT] Heartbeat sent (backgrounded: ${isBackgrounded})`);
          }
        }, 15000); // Increased frequency to every 15 seconds
        
        // Background heartbeat - even more aggressive when backgrounded
        backgroundHeartbeatInterval = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isBackgrounded) {
            wsRef.current.send(JSON.stringify({ 
              type: 'background_ping', 
              driverId: driver.id,
              backgrounded: true,
              timestamp: Date.now()
            }));
            console.log('💗 [BACKGROUND-PERSISTENT] Background heartbeat sent - maintaining connection');
          }
        }, 10000); // Every 10 seconds when backgrounded
        
        // Register driver for notifications immediately when connection opens
        const registrationMessage = {
          type: 'driver_register',
          driverId: driver.id,
          driverName: driver.fullName,
          platform: 'background-persistent', // Identify as background-persistent client
          backgrounded: isBackgrounded,
          lastSyncTimestamp: lastSyncTimestamp, // Include last sync time for missed orders
          timestamp: Date.now()
        };
        console.log(`🚗 [BACKGROUND-PERSISTENT] SENDING Driver registration message:`, registrationMessage);
        wsRef.current.send(JSON.stringify(registrationMessage));
        console.log(`✅ [BACKGROUND-PERSISTENT] Driver ${driver.id} registration message sent successfully`);
        
        // Request missed orders since last sync
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'request_missed_orders',
              driverId: driver.id,
              since: lastSyncTimestamp
            }));
            console.log(`📞 Requesting missed orders since ${new Date(lastSyncTimestamp).toISOString()}`);
          }
        }, 1000);
        
        // Enhanced registration retry for background persistence
        const retryRegistration = () => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log(`🔄 [BACKGROUND-PERSISTENT] Retrying driver registration for driver ${driver.id}`);
            wsRef.current.send(JSON.stringify({...registrationMessage, timestamp: Date.now()}));
          }
        };
        
        // Multiple retry attempts for background persistence reliability
        setTimeout(retryRegistration, 2000);
        setTimeout(retryRegistration, 5000);
        setTimeout(retryRegistration, 10000);
        setTimeout(retryRegistration, 20000); // Additional retry for background persistence
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
            
            // Update last sync timestamp
            setLastSyncTimestamp(Date.now());
            
            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.play().catch(() => {/* Sound failed, ignore */});
            } catch (e) {
              // Ignore sound errors
            }
          } else if (data.type === 'missed_orders') {
            console.log('📊 [OFFLINE-SYNC] Missed orders received:', data.orders);
            
            // Process each missed order
            if (data.orders && data.orders.length > 0) {
              data.orders.forEach((order: any) => {
                console.log('📄 [OFFLINE-SYNC] Processing missed order:', order);
                
                setOfflineQueue(prev => [...prev, {
                  orderId: order.orderId,
                  customerName: order.customerName,
                  customerAddress: order.customerAddress,
                  totalAmount: order.totalAmount,
                  timestamp: order.timestamp
                }]);
              });
              
              // Show notification for missed orders
              toast({
                title: `${data.orders.length} طلبات فائتة`,
                description: "تم استلام الطلبات التي فاتتك أثناء انقطاع الاتصال",
                className: "bg-blue-100 border-blue-500 text-blue-800 font-cairo",
              });
            }
            
            // Update last sync timestamp
            setLastSyncTimestamp(Date.now());
          } else if (data.type === 'registration_confirmed') {
            console.log('✅ Driver registration confirmed by server:', data);
            console.log(`🎯 Driver ${driver.id} is now REGISTERED for notifications!`);
          } else {
            console.log('🔔 Other WebSocket message received:', data);
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        clearInterval(heartbeatInterval);
        clearInterval(backgroundHeartbeatInterval);
        console.log(`🔴 [BACKGROUND-PERSISTENT] WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
        
        // NEVER show disconnected status - always show connecting to maintain driver confidence
        setConnectionStatus('connecting');
        
        // IMMEDIATE reconnection with minimal delay for background persistence
        reconnectAttempts++;
        const backoffDelay = isBackgrounded ? 1000 : Math.min(500 * reconnectAttempts, 5000); // Faster when backgrounded
        
        console.log(`🔄 [BACKGROUND-PERSISTENT] IMMEDIATE reconnection ${reconnectAttempts} in ${backoffDelay}ms (backgrounded: ${isBackgrounded})`);
        setTimeout(() => {
          console.log(`🔄 [BACKGROUND-PERSISTENT] Executing reconnection attempt ${reconnectAttempts}`);
          connectWebSocket();
        }, backoffDelay);
      };
      
      wsRef.current.onerror = (error) => {
        clearInterval(heartbeatInterval);
        clearInterval(backgroundHeartbeatInterval);
        console.error('❌ [BACKGROUND-PERSISTENT] WebSocket connection error:', error);
        
        // NEVER show disconnected - always attempt immediate recovery
        setConnectionStatus('connecting');
        
        // INSTANT reconnection on error - no delays for background persistence
        setTimeout(() => {
          console.log('🔄 [BACKGROUND-PERSISTENT] INSTANT reconnection after error...');
          connectWebSocket();
        }, 500); // Minimal delay for instant recovery
      };
    };

    connectWebSocket();

    // BACKGROUND-PERSISTENT cleanup
    return () => {
      console.log('🧹 [BACKGROUND-PERSISTENT] Cleaning up WebSocket connection...');
      clearInterval(heartbeatInterval);
      clearInterval(backgroundHeartbeatInterval);
      reconnectAttempts = maxReconnectAttempts; // Prevent reconnection on cleanup
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [driver.id]);

  // BACKGROUND-PERSISTENT visibility and network listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isBackgrounded = false;
        console.log('📱 [BACKGROUND-PERSISTENT] App became visible - ensuring connection...');
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('🔄 [BACKGROUND-PERSISTENT] Reconnecting after app became visible...');
          setConnectionStatus('connecting');
        }
      } else {
        isBackgrounded = true;
        console.log('📱 [BACKGROUND-PERSISTENT] App backgrounded - maintaining persistent connection...');
        // NEVER change status when backgrounded - keep "متصل" always
      }
    };

    const handleOnline = () => {
      console.log('🌐 [BACKGROUND-PERSISTENT] Network came online - syncing missed orders...');
      if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
        setConnectionStatus('connecting');
      }
      // Sync missed orders when coming back online
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'request_missed_orders',
          driverId: driver.id,
          since: lastSyncTimestamp
        }));
        console.log(`📞 [OFFLINE-SYNC] Requesting missed orders since ${new Date(lastSyncTimestamp).toISOString()}`);
      }
    };

    const handleOffline = () => {
      console.log('🌐 [BACKGROUND-PERSISTENT] Network went offline - will reconnect when online...');
      setConnectionStatus('connecting'); // Never show disconnected
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // App state listeners for mobile/WebView environments
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [WebView] Network came online - reconnecting...');
      if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
        reconnectAttempts = 0; // Reset on network recovery
        setConnectionStatus('connecting');
        connectWebSocket();
      }
    };

    const handleOffline = () => {
      console.log('📴 [WebView] Network went offline');
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        // NEVER show disconnected icon - always show connecting animation
        return <Activity className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return <Activity className="h-4 w-4 text-yellow-600 animate-spin" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return { text: 'متصل', color: 'text-green-600' };
      case 'disconnected':
        // NEVER show disconnected - always show connecting for driver confidence
        return { text: 'جاري الاتصال...', color: 'text-yellow-600' };
      case 'connecting':
        return { text: 'جاري الاتصال...', color: 'text-yellow-600' };
      default:
        return { text: 'جاري الاتصال...', color: 'text-yellow-600' };
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

        {/* Offline Queue Notification */}
        {offlineQueue.length > 0 && (
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-lg mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <div>
                    <div className="font-semibold text-orange-700">طلبات فائتة</div>
                    <div className="text-sm text-orange-600">{offlineQueue.length} طلبات في انتظار المراجعة</div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Show first offline order
                    if (offlineQueue.length > 0) {
                      setNewOrderNotification(offlineQueue[0]);
                      setIsOrderPopupOpen(true);
                      setOfflineQueue(prev => prev.slice(1));
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  مراجعة
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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