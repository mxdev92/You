import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Bell, Car, MapPin, DollarSign, Package, LogOut, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Driver {
  id: number;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  vehicleType: string;
  vehicleModel: string;
  licensePlate: string;
  isOnline: boolean;
  isActive: boolean;
  totalDeliveries: number;
  totalEarnings: string;
  rating: string;
  profileImage?: string;
  fcmToken?: string;
  createdAt: string;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  address: {
    governorate: string;
    district: string;
    notes?: string;
  };
  items: Array<{
    productName: string;
    quantity: string;
    price: string;
  }>;
  totalAmount: number;
  deliveryFee: number;
  status: string;
}

interface OrderNotification {
  order: Order;
  timestamp: number;
}

export default function DriverPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [isOnline, setIsOnline] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [currentNotification, setCurrentNotification] = useState<OrderNotification | null>(null);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    totalDeliveries: 0,
    totalEarnings: 0,
    rating: 0
  });

  // WebSocket for real-time notifications
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  // Notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // Enhanced notification audio system
  const [notificationAudio] = useState(() => {
    const audio = new Audio();
    // Professional urgent notification sound (base64 encoded WAV)
    audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSMFMnHF8N6LNwcYZ7zq5Z9NEAtQp+LvtmQcBjiR1/LNeSMFMnHF8N6LNwcYZ7zq5Z9NEAtQp+LvtmQcBjiR1/LNeSMF";
    audio.volume = 0.9; // High volume for urgent notifications
    audio.loop = false;
    return audio;
  });

  // Vibration pattern for urgent notifications
  const urgentVibrationPattern = [200, 100, 200, 100, 400, 100, 200];

  // Check authentication on mount
  useEffect(() => {
    checkDriverAuth();
    requestNotificationPermission();
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      // Check current permission without requesting
      const currentPermission = Notification.permission;
      setNotificationPermission(currentPermission);
      console.log("🔔 Current notification permission:", currentPermission);
      
      // Only request if not already determined
      if (currentPermission === "default") {
        console.log("🔔 Permission is default, will request when needed");
      }
    } else {
      console.error("🚫 Browser doesn't support notifications");
    }
  };

  // Show browser notification
  const showBrowserNotification = (title: string, body: string, order?: any) => {
    if (notificationPermission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "pakety-order",
        requireInteraction: true,
        vibrate: urgentVibrationPattern,
        data: order
      });

      // Play notification sound
      notificationAudio.play().catch(console.error);

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (order) {
          setCurrentNotification({ order, timestamp: Date.now() });
        }
      };

      return notification;
    } else {
      console.warn("🚫 Notification permission not granted");
      return null;
    }
  };

  // Setup WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && driver) {
      setupWebSocket();
      loadDashboardData();
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isAuthenticated, driver]);

  const checkDriverAuth = async () => {
    try {
      const response = await apiRequest("GET", "/api/driver/session");
      const data = await response.json();
      if (data.driver) {
        setDriver(data.driver);
        setIsAuthenticated(true);
        setIsOnline(data.driver.isOnline);
      }
    } catch (error) {
      console.log("No driver session found");
    }
  };

  const setupWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("Driver WebSocket connected");
      // Register as driver for notifications
      websocket.send(JSON.stringify({
        type: "DRIVER_CONNECT",
        driverId: driver?.id
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📥 WebSocket message received:", data);
        
        if (data.type === "NEW_ORDER_ASSIGNMENT" && isOnline) {
          console.log("🚨 New order assignment for driver:", data.order);
          handleOrderNotification(data.order);
        } else if (data.type === "ORDER_CANCELLED") {
          // Handle order cancellation
          setCurrentNotification(null);
          setPendingOrders(prev => prev.filter(order => order.id !== data.orderId));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    websocket.onclose = () => {
      console.log("Driver WebSocket disconnected");
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (isAuthenticated) {
          setupWebSocket();
        }
      }, 3000);
    };

    setWs(websocket);
  };

  const handleOrderNotification = (order: Order) => {
    console.log("🚨 URGENT ORDER NOTIFICATION:", order);
    
    // Play urgent notification sound multiple times
    const playUrgentSound = () => {
      notificationAudio.currentTime = 0;
      notificationAudio.play().catch(console.error);
    };
    
    playUrgentSound();
    // Repeat sound 3 times with 1-second intervals
    setTimeout(playUrgentSound, 1000);
    setTimeout(playUrgentSound, 2000);
    
    // Strong vibration pattern for urgent notifications
    if (navigator.vibrate) {
      navigator.vibrate(urgentVibrationPattern);
      // Repeat vibration after 2 seconds
      setTimeout(() => navigator.vibrate(urgentVibrationPattern), 2000);
    }

    // Flash the screen for visual alert
    document.body.style.backgroundColor = '#ff4444';
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 200);

    // Show urgent notification popup
    setCurrentNotification({
      order,
      timestamp: Date.now()
    });

    // Auto-decline after 45 seconds if no action (extended time for important orders)
    setTimeout(() => {
      if (currentNotification?.timestamp === Date.now()) {
        handleDeclineOrder(order.id);
        setCurrentNotification(null);
      }
    }, 45000);
  };

  const loadDashboardData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        apiRequest("GET", "/api/driver/pending-orders"),
        apiRequest("GET", "/api/driver/stats")
      ]);
      
      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      
      setPendingOrders(ordersData.orders || []);
      setStats(statsData.stats || stats);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await apiRequest("POST", "/api/driver/login", {
        email: email.trim(),
        password
      });
      
      const data = await response.json();
      console.log("Login response data:", data);

      if (data.driver) {
        setDriver(data.driver);
        setIsAuthenticated(true);
        setIsOnline(data.driver.isOnline);
      } else {
        setLoginError("بيانات تسجيل الدخول غير صحيحة");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "خطأ في تسجيل الدخول");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/driver/logout");
      setIsAuthenticated(false);
      setDriver(null);
      setIsOnline(false);
      if (ws) {
        ws.close();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      await apiRequest("PATCH", `/api/driver/status`, {
        isOnline: newStatus
      });
      setIsOnline(newStatus);
      
      if (newStatus) {
        // Request location permission for online drivers
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              updateDriverLocation(position.coords.latitude, position.coords.longitude);
            },
            (error) => console.error("Location error:", error)
          );
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const updateDriverLocation = async (latitude: number, longitude: number) => {
    try {
      await apiRequest("POST", "/api/driver/location", {
        latitude,
        longitude
      });
      console.log(`📍 Location updated: ${latitude}, ${longitude}`);
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      const response = await apiRequest("POST", `/api/driver/orders/${orderId}/accept`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentNotification(null);
        loadDashboardData(); // Refresh orders
        
        // Play success sound
        const successAudio = new Audio();
        successAudio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSMF";
        successAudio.volume = 0.5;
        successAudio.play().catch(console.error);
        
        console.log("✅ Order accepted successfully");
      }
    } catch (error) {
      console.error("Failed to accept order:", error);
    }
  };

  const handleDeclineOrder = async (orderId: number) => {
    try {
      const response = await apiRequest("POST", `/api/driver/orders/${orderId}/decline`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentNotification(null);
        loadDashboardData(); // Refresh orders
        console.log("❌ Order declined");
      }
    } catch (error) {
      console.error("Failed to decline order:", error);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string, notes?: string) => {
    try {
      const response = await apiRequest("POST", `/api/driver/orders/${orderId}/status`, {
        status,
        notes
      });
      const data = await response.json();
      
      if (data.success) {
        loadDashboardData(); // Refresh data
        setStats(prev => ({
          ...prev,
          todayDeliveries: status === 'delivered' ? prev.todayDeliveries + 1 : prev.todayDeliveries,
          todayEarnings: status === 'delivered' ? prev.todayEarnings + 2500 : prev.todayEarnings
        }));
        console.log(`📦 Order ${orderId} status updated to: ${status}`);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };;



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Car className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              لوحة تحكم السائق
            </CardTitle>
            <p className="text-gray-600 mt-2">سجل دخولك للبدء في استقبال الطلبات</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-right"
                  dir="ltr"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-right"
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-right">
                    {loginError}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-green-600 text-white">
                {driver?.fullName?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                مرحباً، {driver?.fullName}
              </h1>
              <p className="text-gray-600">
                {driver?.vehicleType} - {driver?.licensePlate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Online/Offline Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isOnline ? "متصل" : "غير متصل"}
              </span>
              <Switch
                checked={isOnline}
                onCheckedChange={toggleOnlineStatus}
                className="data-[state=checked]:bg-green-600"
              />
              <Badge variant={isOnline ? "default" : "secondary"} className={isOnline ? "bg-green-600" : ""}>
                {isOnline ? "متاح" : "غير متاح"}
              </Badge>
            </div>
            <Button
              onClick={async () => {
                try {
                  // Always request permission first, don't rely on state
                  console.log("🔔 Requesting notification permission...");
                  
                  if (!("Notification" in window)) {
                    console.error("Browser doesn't support notifications");
                    return;
                  }

                  // Force permission request
                  const permission = await Notification.requestPermission();
                  setNotificationPermission(permission);
                  console.log("🔔 Permission result:", permission);

                  const response = await apiRequest("POST", "/api/driver/test-notification");
                  const data = await response.json();
                  console.log("🧪 Test notification triggered:", data);
                  
                  if (data.success && data.testOrder) {
                    // Show browser notification if permission granted
                    if (permission === "granted") {
                      showBrowserNotification(
                        "🚨 طلب جديد - باكيتي",
                        `طلب من ${data.testOrder.customerName}\nالمبلغ: ${data.testOrder.totalAmount.toLocaleString()} IQD\nالعنوان: ${data.testOrder.address.governorate} - ${data.testOrder.address.district}`,
                        data.testOrder
                      );
                    }
                    
                    // Always show in-app notification
                    setCurrentNotification({ 
                      order: data.testOrder, 
                      timestamp: Date.now() 
                    });
                  }
                } catch (error) {
                  console.error("Test notification failed:", error);
                }
              }}
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              🧪 اختبار التنبيه
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل خروج
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">اليوم</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayDeliveries}</p>
                <p className="text-sm text-gray-500">توصيلة</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">أرباح اليوم</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayEarnings.toLocaleString()}</p>
                <p className="text-sm text-gray-500">دينار</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي التوصيلات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
                <p className="text-sm text-gray-500">توصيلة</p>
              </div>
              <Car className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">التقييم</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating}</p>
                <p className="text-sm text-gray-500">من 5</p>
              </div>
              <Bell className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            الطلبات المعلقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد طلبات معلقة حالياً</p>
              {!isOnline && (
                <p className="text-sm text-gray-500 mt-2">
                  قم بتفعيل حالة الاتصال لاستقبال الطلبات
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">طلب #{order.id}</h3>
                      <p className="text-gray-600">{order.customerName}</p>
                    </div>
                    <Badge>معلق</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    {order.address.governorate} - {order.address.district}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-600">
                      {order.totalAmount.toLocaleString()} دينار
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptOrder(order.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineOrder(order.id)}
                      >
                        رفض
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* URGENT Order Notification Popup */}
      {currentNotification && (
        <div className="fixed inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center z-50 p-4 animate-pulse">
          <Card className="w-full max-w-md bg-white shadow-2xl border-4 border-red-500 animate-bounce">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <CardTitle className="text-xl flex items-center gap-2">
                <Bell className="w-6 h-6 animate-ping" />
                🚨 طلب عاجل - URGENT ORDER
              </CardTitle>
              <p className="text-red-200 text-sm">45 ثانية للرد قبل الإلغاء التلقائي</p>
            </CardHeader>
            <CardContent className="p-6 bg-yellow-50">
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                  <h3 className="font-bold text-lg text-red-800">العميل: {currentNotification.order.customerName}</h3>
                  <p className="text-red-600 font-semibold">{currentNotification.order.customerPhone}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border-l-4 border-orange-500">
                  <p className="font-bold text-orange-800">📍 العنوان:</p>
                  <p className="text-orange-700 font-semibold">
                    {currentNotification.order.address.governorate} - {currentNotification.order.address.district}
                    {currentNotification.order.address.notes && (
                      <span className="block text-sm text-orange-600 mt-1">{currentNotification.order.address.notes}</span>
                    )}
                  </p>
                </div>
                
                <div className="bg-green-100 p-3 rounded-lg border-l-4 border-green-500">
                  <p className="font-bold text-green-800">💰 المبلغ الإجمالي:</p>
                  <p className="text-2xl font-bold text-green-700">
                    {currentNotification.order.totalAmount.toLocaleString()} IQD
                  </p>
                  <p className="text-sm text-green-600">+ رسوم توصيل 2,500 IQD</p>
                </div>

                <div className="bg-blue-100 p-3 rounded-lg border-l-4 border-blue-500">
                  <p className="font-bold text-blue-800">📦 عدد المنتجات:</p>
                  <p className="text-blue-700">{currentNotification.order.items.length} منتج</p>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={() => handleAcceptOrder(currentNotification.order.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg animate-pulse"
                  >
                    ✅ قبول الطلب فوراً
                  </Button>
                  <Button 
                    onClick={() => handleDeclineOrder(currentNotification.order.id)}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-600 hover:bg-red-50 font-bold py-3"
                  >
                    ❌ رفض الطلب
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}