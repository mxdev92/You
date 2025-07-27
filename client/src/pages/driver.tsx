import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Bell, Car, MapPin, DollarSign, Package, LogOut, CheckCircle, XCircle, Phone } from "lucide-react";
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

  // Extended vibration pattern for urgent notifications (longer and more intense)
  const urgentVibrationPattern = [800, 200, 800, 200, 1000, 200, 800, 200, 800, 200, 1000, 200, 600];

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

  // Show urgent notification with extended sound and vibration
  const showUrgentNotification = (order: any) => {
    // Play urgent notification sound multiple times for longer duration
    try {
      // Play sound immediately
      notificationAudio.currentTime = 0;
      notificationAudio.play().catch(console.error);
      console.log("🔊 Playing urgent notification sound");
      
      // Play sound again after 1 second for extended duration
      setTimeout(() => {
        notificationAudio.currentTime = 0;
        notificationAudio.play().catch(console.error);
        console.log("🔊 Playing second urgent notification sound");
      }, 1000);
      
      // Play sound third time after 2 seconds
      setTimeout(() => {
        notificationAudio.currentTime = 0;
        notificationAudio.play().catch(console.error);
        console.log("🔊 Playing third urgent notification sound");
      }, 2000);
    } catch (error) {
      console.error("Failed to play sound:", error);
    }

    // Trigger extended vibration if supported
    if ("vibrator" in navigator || "vibrate" in navigator) {
      try {
        navigator.vibrate(urgentVibrationPattern);
        console.log("📳 Triggering extended urgent vibration");
        
        // Repeat vibration after 2 seconds for extended duration
        setTimeout(() => {
          navigator.vibrate(urgentVibrationPattern);
          console.log("📳 Triggering second vibration pattern");
        }, 2500);
      } catch (error) {
        console.error("Failed to vibrate:", error);
      }
    }

    // Show in-app notification immediately
    setCurrentNotification({ order, timestamp: Date.now() });
    console.log("🚨 Urgent notification displayed with extended alerts");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Mobile Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-xl">
        <div className="px-4 py-6 safe-area-top">
          {/* Driver Profile Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
              <span className="text-white font-bold text-xl">{driver?.fullName?.charAt(0) || "D"}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-xl text-white mb-1">مرحباً، {driver?.fullName || driver?.email}</h1>
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <Car className="w-4 h-4" />
                <span>ID: {driver?.id}</span>
              </div>
              <div className="flex items-center gap-2 text-green-100 text-sm mt-1">
                <Phone className="w-4 h-4" />
                <span>{driver?.phone || 'غير محدد'}</span>
              </div>
            </div>
          </div>

          {/* Status Controls Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-300 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-400'}`}></div>
                  <span className="text-white font-medium text-sm">
                    {isOnline ? "متاح للتوصيل" : "غير متاح"}
                  </span>
                  <Switch
                    checked={isOnline}
                    onCheckedChange={toggleOnlineStatus}
                    className="data-[state=checked]:bg-green-400 scale-90"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  try {
                    console.log("🧪 Testing urgent notification...");
                    const response = await apiRequest("POST", "/api/driver/test-notification");
                    const data = await response.json();
                    console.log("🧪 Test notification triggered:", data);
                    
                    if (data.success && data.testOrder) {
                      showUrgentNotification(data.testOrder);
                    }
                  } catch (error) {
                    console.error("Test notification failed:", error);
                  }
                }}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                🧪
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline" 
                size="sm"
                className="bg-red-500/20 border-red-400/30 text-red-100 hover:bg-red-500/30 backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 mt-6">

        {/* Modern Mobile Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Today's Deliveries */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{stats.todayDeliveries}</p>
                <p className="text-xs text-gray-500">توصيلة اليوم</p>
              </div>
            </div>
          </div>

          {/* Today's Earnings */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{stats.todayEarnings.toLocaleString()}</p>
                <p className="text-xs text-gray-500">دينار اليوم</p>
              </div>
            </div>
          </div>

          {/* Total Deliveries */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
                <p className="text-xs text-gray-500">إجمالي التوصيلات</p>
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{stats.totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-gray-500">إجمالي الأرباح</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Mobile Orders Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-bold text-gray-900">الطلبات المعلقة</h2>
              {pendingOrders.length > 0 && (
                <div className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                  {pendingOrders.length}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">لا توجد طلبات معلقة حالياً</p>
                {!isOnline && (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    قم بتفعيل حالة الاتصال لاستقبال الطلبات
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <span className="font-bold text-blue-600">#{order.id}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{order.customerName}</h3>
                          <p className="text-sm text-gray-600">{order.customerPhone}</p>
                        </div>
                      </div>
                      <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-medium">
                        معلق
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 bg-white/50 rounded-lg px-3 py-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>{order.address.governorate} - {order.address.district}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg">
                        <span className="font-bold text-lg">{order.totalAmount.toLocaleString()}</span>
                        <span className="text-sm"> دينار</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptOrder(order.id)}
                          className="bg-green-600 hover:bg-green-700 rounded-xl px-4"
                        >
                          <CheckCircle className="w-4 h-4 ml-1" />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineOrder(order.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-4"
                        >
                          <XCircle className="w-4 h-4 ml-1" />
                          رفض
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Order Notification */}
      {currentNotification && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-6 py-4 rounded-t-2xl border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">طلب جديد</h3>
                  <p className="text-sm text-gray-500">منذ {Math.floor((Date.now() - currentNotification.timestamp) / 1000)} ثانية</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Customer & Address Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{currentNotification.order.customerName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{currentNotification.order.customerName}</p>
                      <p className="text-xs text-gray-600">{currentNotification.order.customerPhone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{currentNotification.order.address.governorate}</p>
                      <p className="text-xs text-gray-600">{currentNotification.order.address.district}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">المبلغ الإجمالي</p>
                <p className="text-2xl font-bold text-gray-900">{currentNotification.order.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{currentNotification.order.items.length} منتج • رسوم توصيل 2,500</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    handleAcceptOrder(currentNotification.order.id);
                    setCurrentNotification(null);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl py-3 font-semibold"
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  قبول
                </Button>
                <Button
                  onClick={() => {
                    handleDeclineOrder(currentNotification.order.id);
                    setCurrentNotification(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl py-3 font-semibold"
                >
                  <XCircle className="w-4 h-4 ml-2" />
                  رفض
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}