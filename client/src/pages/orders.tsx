import { useState, useEffect } from "react";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/price-utils";

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryFee: number;
  grandTotal: number;
  createdAt: string;
  address: {
    name: string;
    phone: string;
    fullAddress: string;
  };
}

export default function Orders() {
  const { user } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation('/auth');
      return;
    }

    // TODO: Load orders from Firebase/API
    // For now, show empty state
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [user, setLocation]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'preparing':
        return 'text-purple-600 bg-purple-100';
      case 'out-for-delivery':
        return 'text-orange-600 bg-orange-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'preparing':
        return 'قيد التحضير';
      case 'out-for-delivery':
        return 'في الطريق';
      case 'delivered':
        return 'تم التسليم';
      case 'cancelled':
        return 'ملغي';
      default:
        return 'غير معروف';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'out-for-delivery':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          
          <h1 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            طلباتي
          </h1>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              لا توجد طلبات
            </h3>
            <p className="text-gray-500 mb-6" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              لم تقم بإجراء أي طلبات حتى الآن
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="bg-green-500 hover:bg-green-600 text-white"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              تصفح المنتجات
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      طلب رقم {order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      {new Date(order.createdAt).toLocaleDateString('ar-IQ')}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-gray-900 mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    عنوان التسليم
                  </h4>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {order.address.name} - {order.address.phone}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {order.address.fullAddress}
                  </p>
                </div>

                {/* Order Total */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      مجموع الطلبات
                    </span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      رسوم التوصيل
                    </span>
                    <span>{formatPrice(order.deliveryFee)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      الإجمالي
                    </span>
                    <span className="text-green-600">
                      {formatPrice(order.grandTotal)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}