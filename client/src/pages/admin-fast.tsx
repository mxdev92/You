import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, Mail, User, Calendar, DollarSign, List, ShoppingCart, Edit3, Save, X, Search, Tag, Package2, ArrowLeft, Apple, Carrot, Milk, Cookie, Fish, Beef, Grid3X3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Mock data for categories and products
const mockCategories = [
  {
    id: 1,
    name: 'فواكه',
    nameEn: 'Fruits',
    icon: '🍎',
    productsCount: 12
  },
  {
    id: 2,
    name: 'خضروات',
    nameEn: 'Vegetables',
    icon: '🥬',
    productsCount: 15
  },
  {
    id: 3,
    name: 'منتجات الألبان',
    nameEn: 'Dairy Products',
    icon: '🥛',
    productsCount: 8
  },
  {
    id: 4,
    name: 'اللحوم',
    nameEn: 'Meat',
    icon: '🥩',
    productsCount: 10
  }
];

const mockProducts = [
  {
    id: 1,
    name: 'تفاح أحمر عضوي',
    nameEn: 'Organic Red Apples',
    categoryId: 1,
    categoryName: 'فواكه',
    price: 2500,
    unit: 'كيلو',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop'
  },
  {
    id: 2,
    name: 'موز طازج',
    nameEn: 'Fresh Bananas',
    categoryId: 1,
    categoryName: 'فواكه',
    price: 1800,
    unit: 'كيلو',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop'
  },
  {
    id: 3,
    name: 'برتقال طازج',
    nameEn: 'Fresh Oranges',
    categoryId: 1,
    categoryName: 'فواكه',
    price: 2200,
    unit: 'كيلو',
    inStock: false,
    image: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=200&h=200&fit=crop'
  },
  {
    id: 4,
    name: 'طماطم عضوية',
    nameEn: 'Organic Tomatoes',
    categoryId: 2,
    categoryName: 'خضروات',
    price: 2800,
    unit: 'كيلو',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=200&fit=crop'
  },
  {
    id: 5,
    name: 'خس طازج',
    nameEn: 'Fresh Lettuce',
    categoryId: 2,
    categoryName: 'خضروات',
    price: 1500,
    unit: 'حبة',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=200&h=200&fit=crop'
  },
  {
    id: 6,
    name: 'حليب طازج',
    nameEn: 'Fresh Milk',
    categoryId: 3,
    categoryName: 'منتجات الألبان',
    price: 3200,
    unit: 'لتر',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop'
  }
];

const mockOrders = [
  {
    id: 'order_001',
    customerName: 'Ahmed Al-Rashid',
    customerEmail: 'ahmed@example.com', 
    customerPhone: '+964 770 123 4567',
    governorate: 'بغداد',
    district: 'الكرادة',
    totalAmount: 10000,
    status: 'pending',
    orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    itemsCount: 3
  },
  {
    id: 'order_002',
    customerName: 'Fatima Hassan',
    customerEmail: 'fatima@example.com',
    customerPhone: '+964 751 987 6543',
    governorate: 'البصرة',
    district: 'الزبير',
    totalAmount: 9900,
    status: 'confirmed',
    orderDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    itemsCount: 5
  },
  {
    id: 'order_003',
    customerName: 'Omar Karim',
    customerEmail: 'omar@example.com',
    customerPhone: '+964 782 456 7890',
    governorate: 'أربيل',
    district: 'عنكاوة',
    totalAmount: 12400,
    status: 'preparing',
    orderDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    itemsCount: 3
  },
  {
    id: 'order_004',
    customerName: 'Layla Mahmoud',
    customerEmail: 'layla@example.com',
    customerPhone: '+964 750 321 9876',
    governorate: 'النجف',
    district: 'المدينة',
    totalAmount: 17500,
    status: 'delivered',
    orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    itemsCount: 2
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

function OrderCard({ order, onStatusChange }: any) {
  const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;

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
          <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
            {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
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
              <span className="font-medium">{order.governorate}, {order.district}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-green-600">
                {order.totalAmount.toLocaleString()} IQD
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {order.itemsCount} item{order.itemsCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <Select
          value={order.status}
          onValueChange={(status) => onStatusChange(order.id, status)}
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
      </CardContent>
    </Card>
  );
}

function OrderStats({ orders }: any) {
  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'pending').length,
    confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
    preparing: orders.filter((o: any) => o.status === 'preparing').length,
    delivered: orders.filter((o: any) => o.status === 'delivered').length,
    totalRevenue: orders
      .filter((o: any) => o.status === 'delivered')
      .reduce((sum: number, order: any) => sum + order.totalAmount, 0)
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

// Simple Items Management placeholder
function ItemsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [products, setProducts] = useState([
    { id: 1, name: 'Organic Apples', category: 'Fruits', price: '12.50', unit: 'kg', available: true, image: '/api/placeholder/60/60' },
    { id: 2, name: 'Fresh Spinach', category: 'Vegetables', price: '8.00', unit: 'bunch', available: true, image: '/api/placeholder/60/60' },
    { id: 3, name: 'Bananas', category: 'Fruits', price: '6.75', unit: 'kg', available: false, image: '/api/placeholder/60/60' },
    { id: 4, name: 'Carrots', category: 'Vegetables', price: '4.25', unit: 'kg', available: true, image: '/api/placeholder/60/60' },
    { id: 5, name: 'Oranges', category: 'Fruits', price: '15.00', unit: 'kg', available: true, image: '/api/placeholder/60/60' },
    { id: 6, name: 'Broccoli', category: 'Vegetables', price: '9.50', unit: 'piece', available: true, image: '/api/placeholder/60/60' }
  ]);

  const categories = [
    { id: 1, name: 'Fruits', icon: Apple, count: 3 },
    { id: 2, name: 'Vegetables', icon: Carrot, count: 3 },
    { id: 3, name: 'Dairy', icon: Milk, count: 0 },
    { id: 4, name: 'Meat', icon: Beef, count: 0 }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || 
      (selectedCategory === 1 && product.category === 'Fruits') ||
      (selectedCategory === 2 && product.category === 'Vegetables');
    return matchesSearch && matchesCategory;
  });

  const updateProductPrice = (id: number, newPrice: string) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, price: newPrice } : product
    ));
  };

  const updateProductAvailability = (id: number, available: boolean) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, available } : product
    ));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* App Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm border-gray-300 focus:border-blue-500"
            />
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Save className="h-5 w-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === null 
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package2 className="h-4 w-4" />
            All Items
          </button>
          
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === category.id 
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {category.name}
                <span className="bg-white text-gray-600 text-xs px-1.5 py-0.5 rounded-full ml-1">
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products List */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">IQD</span>
                    <Input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProductPrice(product.id, e.target.value)}
                      className="w-16 h-7 text-xs text-center border-gray-300 focus:border-blue-500"
                      step="0.25"
                    />
                    <span className="text-xs text-gray-500">/{product.unit}</span>
                  </div>
                  
                  <select
                    value={product.available ? 'available' : 'unavailable'}
                    onChange={(e) => updateProductAvailability(product.id, e.target.value === 'available')}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    product.available ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No products found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <p className="text-center text-xs text-gray-500">
          This app was built by MX 2025 • mxdev92@gmail.com
        </p>
      </div>
    </div>
  );
}

// Admin Sidebar Component
function AdminSidebar({ isOpen, onClose, setCurrentView }: { 
  isOpen: boolean; 
  onClose: () => void; 
  setCurrentView: (view: 'orders' | 'items') => void;
}) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 rounded-l-2xl ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Admin Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto rounded-xl"
              onClick={() => {
                setCurrentView('orders');
                onClose();
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Orders Management</div>
                <div className="text-sm text-gray-500">View and manage orders</div>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto rounded-xl"
              onClick={() => {
                setCurrentView('items');
                onClose();
              }}
            >
              <Package className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Items Management</div>
                <div className="text-sm text-gray-500">Manage products and inventory</div>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto rounded-xl"
              onClick={onClose}
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Orders</div>
                <div className="text-sm text-gray-500">View and manage orders</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminFast() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState(mockOrders);
  const [currentView, setCurrentView] = useState<'orders' | 'items'>('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleStatusChange = (orderId: string, newStatus: string) => {
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
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <List className="h-5 w-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                {currentView === 'orders' ? 'Orders Dashboard' : 'Items Management'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {currentView === 'orders' ? (
          <>
            <OrderStats orders={orders} />

            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Orders Management</h2>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Fast Loading Demo
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
                        ? 'No orders available.'
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
          </>
        ) : (
          <ItemsManagement />
        )}
      </div>

      {/* Admin Sidebar */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        setCurrentView={setCurrentView}
      />
    </div>
  );
}