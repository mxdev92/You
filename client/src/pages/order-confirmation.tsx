import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Home, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderConfirmationProps {
  orderId?: string;
  totalAmount?: number;
}

export default function OrderConfirmation() {
  const [, setLocation] = useLocation();
  
  // Get order details from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId') || localStorage.getItem('lastOrderId') || 'غير محدد';
  const totalAmount = parseFloat(urlParams.get('totalAmount') || localStorage.getItem('lastOrderTotal') || '0');

  // Clear stored order data after component mounts
  useEffect(() => {
    localStorage.removeItem('lastOrderId');
    localStorage.removeItem('lastOrderTotal');
  }, []);

  const formatPrice = (price: number) => {
    return price.toFixed(0);
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardContent className="p-8 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>

            {/* Success Message */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              dir="rtl"
            >
              تم استلام طلبك بنجاح
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="text-gray-600 mb-8 text-sm"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              dir="rtl"
            >
              شكراً لك، سيتم تحضير طلبك وتوصيله في أقرب وقت
            </motion.p>

            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="bg-gray-50 rounded-lg p-4 mb-8 text-right"
              dir="rtl"
            >
              <div className="space-y-3">
                {/* Order ID */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      رقم الطلب
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    #{orderId}
                  </span>
                </div>

                {/* Total Amount */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    المبلغ الإجمالي
                  </span>
                  <span className="font-bold text-green-600 text-lg" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {formatPrice(totalAmount)} دينار
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Home Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <Button
                onClick={handleGoHome}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                data-testid="home-button"
              >
                <Home className="w-5 h-5" />
                الصفحة الرئيسية
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}