import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, Mail, User, Calendar, DollarSign, Plus } from 'lucide-react';
import { format } from 'date-fns';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';

interface MockOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: {
    governorate: string;
    district: string;
    neighborhood: string;
    street: string;
    houseNumber: string;
    floorNumber: string;
    notes: string;
  };
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: string;
    unit: string;
  }>;
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  notes: string;
}

// Mock data for immediate display
const mockOrders: MockOrder[] = [
  {
    id: 'order_001',
    customerName: 'Ahmed Al-Rashid',
    customerEmail: 'ahmed@example.com', 
    customerPhone: '+964 770 123 4567',
    address: {
      governorate: 'بغداد',
      district: 'الكرادة',
      neighborhood: 'الجادرية',
      street: 'شارع الجامعة',
      houseNumber: '15',
      floorNumber: '2',
      notes: 'بناية زرقاء بجانب الصيدلية'
    },
    items: [
      { productId: 1, productName: 'خوخ', quantity: 2, price: '3000', unit: '1kg' },
      { productId: 2, productName: 'تفاح أحمر', quantity: 1, price: '2500', unit: '1kg' }
    ],
    totalAmount: 10000,
    status: 'pending' as const,
    orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    notes: 'تسليم سريع من فضلكم'
  },
  {
    id: 'order_002',
    customerName: 'Fatima Hassan',
    customerEmail: 'fatima@example.com',
    customerPhone: '+964 751 987 6543',
    address: {
      governorate: 'البصرة',
      district: 'الزبير', 
      neighborhood: 'المعقل',
      street: 'شارع الكورنيش',
      houseNumber: '28',
      floorNumber: '',
      notes: 'بيت أبيض مع حديقة صغيرة'
    },
    items: [
      { productId: 3, productName: 'موز', quantity: 3, price: '1800', unit: '1kg' },
      { productId: 4, productName: 'برتقال', quantity: 2, price: '2200', unit: '1kg' }
    ],
    totalAmount: 9900,
    status: 'confirmed' as const,
    orderDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    notes: ''
  },
  {
    id: 'order_003',
    customerName: 'Omar Karim',
    customerEmail: 'omar@example.com',
    customerPhone: '+964 782 456 7890',
    address: {
      governorate: 'أربيل',
      district: 'عنكاوة',
      neighborhood: 'الأندلس',
      street: 'شارع 100 متر',
      houseNumber: '42',
      floorNumber: '3',
      notes: 'الشقة الثالثة على اليمين'
    },
    items: [
      { productId: 5, productName: 'عنب أخضر', quantity: 1, price: '4500', unit: '1kg' },
      { productId: 6, productName: 'كيوي', quantity: 2, price: '3200', unit: '1kg' }
    ],
    totalAmount: 12400,
    status: 'preparing' as const,
    orderDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    notes: 'أفضل التسليم بعد الساعة 6 مساءً'
  },
  {
    id: 'order_004',
    customerName: 'Layla Mahmoud',
    customerEmail: 'layla@example.com',
    customerPhone: '+964 750 321 9876',
    address: {
      governorate: 'النجف',
      district: 'المدينة',
      neighborhood: 'العسكري',
      street: 'شارع الإمام علي',
      houseNumber: '67',
      floorNumber: '1',
      notes: 'بجانب مسجد النور'
    },
    items: [
      { productId: 7, productName: 'فراولة', quantity: 2, price: '5000', unit: '500g' },
      { productId: 8, productName: 'مانجو', quantity: 1, price: '6000', unit: '1kg' }
    ],
    totalAmount: 17500,
    status: 'delivered' as const,
    orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    notes: 'شكراً لكم على الخدمة الممتازة'
  }
];

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-800', icon: Package },
  'out-for-delivery': { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Clock }
};

function OrderCard({ order, onStatusChange }: { 
  order: typeof mockOrders[0], 
  onStatusChange: (orderId: string, status: OrderStatus) => void 
}) {
  const StatusIcon = statusConfig[order.status].icon;

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle className="text-lg">Order #{order.id.slice(-3)}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {format(new Date(order.orderDate), 'MMM dd, yyyy • HH:mm')}
              </p>
            </div>
          </div>
          <Badge className={statusConfig[order.status].color}>
            {statusConfig[order.status].label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{order.customerPhone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{order.customerEmail}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="font-medium">
                {order.address.governorate}, {order.address.district}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-green-600">
                {order.totalAmount.toLocaleString()} IQD
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {order.items.length} item{order.items.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={order.status}
            onValueChange={(status) => onStatusChange(order.id, status as OrderStatus)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderStats({ orders }: { orders: typeof mockOrders }) {
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    outForDelivery: orders.filter(o => o.status === 'out-for-delivery').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0)
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <p className="text-sm text-gray-600">Total Orders</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <p className="text-sm text-gray-600">Pending</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          <p className="text-sm text-gray-600">Delivered</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.totalRevenue.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Revenue (IQD)</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSimple() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState(mockOrders);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">KiwiQ Admin Panel</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {format(new Date(), 'EEEE, MMMM dd, yyyy')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <OrderStats orders={orders} />

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Orders Management</h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Live Demo Mode
                </Badge>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {statusFilter === 'all' 
                    ? 'No orders available in demo mode.'
                    : `No orders with status "${statusFilter}" found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}