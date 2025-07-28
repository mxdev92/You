import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Lock, LogOut, Package, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/price-utils';

interface Driver {
  id: number;
  email: string;
  fullName: string;
  phone: string;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">
            تسجيل دخول السائق
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            PAKETY - نظام إدارة التوصيل
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
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
                className="text-right"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
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
                className="text-right"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700" 
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
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
    // Refresh orders every 30 seconds
    const interval = setInterval(loadOrders, 30000);
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

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/driver/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        toast({
          title: "خطأ في تسجيل الخروج",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "خطأ في تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any } } = {
      'pending': { label: 'في الانتظار', variant: 'secondary' },
      'confirmed': { label: 'مؤكد', variant: 'default' },
      'preparing': { label: 'قيد التحضير', variant: 'default' },
      'out-for-delivery': { label: 'في الطريق', variant: 'default' },
      'delivered': { label: 'تم التوصيل', variant: 'default' },
      'cancelled': { label: 'ملغي', variant: 'destructive' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-green-600">
                    مرحباً {driver.fullName}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {driver.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {driver.email}
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                تسجيل الخروج
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              الطلبات الأخيرة ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">جاري تحميل الطلبات...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد طلبات حالياً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          طلب رقم #{order.id}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {order.customerName}
                        </p>
                      </div>
                      <div className="text-left">
                        {getStatusBadge(order.status)}
                        <p className="text-lg font-bold text-green-600 mt-1">
                          {formatPrice(order.totalAmount)} د.ع
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {order.phone}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleString('ar-IQ')}
                      </div>
                    </div>

                    {order.address && (
                      <div className="flex items-start gap-2 text-gray-600 mt-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="text-sm">{order.address}</span>
                      </div>
                    )}

                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-1">المنتجات:</p>
                        <div className="flex flex-wrap gap-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item.name} × {item.quantity}
                            </Badge>
                          ))}
                          {order.items.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{order.items.length - 3} المزيد
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function DriverPage() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    checkDriverSession();
  }, []);

  const checkDriverSession = async () => {
    try {
      const response = await fetch('/api/driver/session', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDriver(data.driver);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return driver ? (
    <DriverDashboard driver={driver} />
  ) : (
    <DriverLogin onLogin={setDriver} />
  );
}