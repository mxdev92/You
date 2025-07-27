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

  // Audio for notifications
  const [notificationAudio] = useState(() => {
    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSMFl+3NmDx2T1uJR8dLHV6jKfvUMWqnFzNmJNvBqGOkNf3LMm5HJWMQJmRGASFWdROKGlRHuGPARY/DKj7x1K9rwbhqb5aR";
    audio.volume = 0.7;
    return audio;
  });

  // Check authentication on mount
  useEffect(() => {
    checkDriverAuth();
  }, []);

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
      if (response.driver) {
        setDriver(response.driver);
        setIsAuthenticated(true);
        setIsOnline(response.driver.isOnline);
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
        if (data.type === "NEW_ORDER_ASSIGNMENT" && isOnline) {
          handleOrderNotification(data.order);
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
    // Play notification sound
    notificationAudio.play().catch(console.error);
    
    // Trigger vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Show notification popup
    setCurrentNotification({
      order,
      timestamp: Date.now()
    });

    // Auto-decline after 30 seconds if no action
    setTimeout(() => {
      setCurrentNotification(null);
    }, 30000);
  };

  const loadDashboardData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        apiRequest("GET", "/api/driver/pending-orders"),
        apiRequest("GET", "/api/driver/stats")
      ]);
      
      setPendingOrders(ordersRes.orders || []);
      setStats(statsRes.stats || stats);
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

      if (response.driver) {
        setDriver(response.driver);
        setIsAuthenticated(true);
        setIsOnline(response.driver.isOnline);
      } else {
        setLoginError("بيانات تسجيل الدخول غير صحيحة");
      }
    } catch (error: any) {
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
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  const handleOrderResponse = async (orderId: number, action: "accept" | "decline") => {
    try {
      await apiRequest("POST", "/api/driver/order-response", {
        orderId,
        action
      });
      
      setCurrentNotification(null);
      
      if (action === "accept") {
        // Refresh dashboard data
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to respond to order:", error);
    }
  };

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
                        onClick={() => handleOrderResponse(order.id, "accept")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOrderResponse(order.id, "decline")}
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

      {/* Order Notification Popup */}
      {currentNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-300">
            <CardHeader className="text-center bg-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center justify-center gap-2">
                <Bell className="w-5 h-5" />
                طلب جديد!
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {currentNotification.order.customerName}
                  </h3>
                  <p className="text-gray-600">{currentNotification.order.customerPhone}</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">
                      {currentNotification.order.address.governorate} - {currentNotification.order.address.district}
                    </p>
                    {currentNotification.order.address.notes && (
                      <p className="text-sm text-gray-600">
                        {currentNotification.order.address.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-semibold text-green-800 text-xl text-center">
                    {currentNotification.order.totalAmount.toLocaleString()} دينار
                  </p>
                  <p className="text-sm text-green-600 text-center">
                    المبلغ الإجمالي
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleOrderResponse(currentNotification.order.id, "accept")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    قبول
                  </Button>
                  <Button
                    onClick={() => handleOrderResponse(currentNotification.order.id, "decline")}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 ml-2" />
                    رفض
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