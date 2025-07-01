import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, Mail, User, Calendar, DollarSign, List, ShoppingCart, Edit3, Save, X, Search, Tag, Package2, ArrowLeft, Apple, Carrot, Milk, Cookie, Fish, Beef } from 'lucide-react';
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

// Items Management Components  
function ItemsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Use real API data
  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/products", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/products?categoryId=${selectedCategory}`
        : "/api/products";
      
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Icon mapping from main app
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Apple,
    Carrot,
    Milk,
    Cookie,
    Fish,
    Beef,
  };

  const filteredProducts = products?.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handlePriceChange = (productId: number, newPrice: string) => {
    // TODO: Implement API call to update price
    console.log('Price change:', productId, newPrice);
  };

  const handleStockToggle = (productId: number, inStock: boolean) => {
    // TODO: Implement API call to update stock status
    console.log('Stock toggle:', productId, inStock);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Bar - Back + Search + Save */}
      <div className="bg-white shadow-sm sticky top-0 z-40 safe-area-inset rounded-b-3xl">
        <div className="flex items-center justify-between px-4 py-3 touch-action-manipulation">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 rounded-lg touch-action-manipulation min-h-11 min-w-11"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>

          {/* Search Bar - identical to main app */}
          <div className="flex-1 mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-fresh-green focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-gray-100 rounded-lg touch-action-manipulation min-h-11 min-w-11"
          >
            <Save className="h-6 w-6 text-gray-700" />
          </Button>
        </div>
      </div>

      {/* Categories Section */}
      <section className="bg-white px-4 py-0.5 border-b">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-0.5 touch-action-pan-x">
            {categories?.map((category: any, index: number) => {
              const IconComponent = iconMap[category.icon];
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 flex flex-col items-center min-w-14"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 cursor-pointer transition-all duration-200 relative touch-action-manipulation min-h-10 min-w-10 ${
                      selectedCategory === category.id
                        ? "bg-fresh-green text-white shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                    }`}
                  >
                    {IconComponent && <IconComponent className="h-5 w-5" />}
                  </motion.div>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight px-1">
                    {category.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>

      {/* Products List - Very small elements, professional design */}
      <main className="pb-8">
        {selectedCategory ? (
          <section className="px-4 py-6">
            <div className="space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No products found</h3>
                  <p className="text-xs text-gray-600">Try adjusting your search criteria</p>
                </div>
              ) : (
                filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      {/* Very small product image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product name - compact */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-xs truncate">{product.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{product.nameEn}</p>
                      </div>

                      {/* Price input - very small */}
                      <div className="flex-shrink-0 w-16">
                        <Input
                          type="number"
                          value={product.price}
                          onChange={(e) => handlePriceChange(product.id, e.target.value)}
                          className="h-7 text-xs text-center border-gray-200"
                          placeholder="0"
                        />
                      </div>

                      {/* Availability dropdown - compact */}
                      <div className="flex-shrink-0">
                        <Select 
                          value={product.inStock ? "available" : "out-of-stock"}
                          onValueChange={(value) => handleStockToggle(product.id, value === "available")}
                        >
                          <SelectTrigger className="w-20 h-7 text-xs border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available" className="text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Available
                              </div>
                            </SelectItem>
                            <SelectItem value="out-of-stock" className="text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Out
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Save icon - small */}
                      <div className="flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        ) : (
          <div className="text-center py-12">
            <Tag className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Select a Category</h3>
            <p className="text-xs text-gray-600">Choose a category above to manage its products</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminFast() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState(mockOrders);
  const [currentView, setCurrentView] = useState<'orders' | 'items'>('orders');

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
              onClick={() => setCurrentView(currentView === 'orders' ? 'items' : 'orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {currentView === 'orders' ? (
                <List className="h-5 w-5 text-gray-700" />
              ) : (
                <ShoppingCart className="h-5 w-5 text-gray-700" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <Badge variant={currentView === 'orders' ? 'default' : 'secondary'} className="text-xs">
                {currentView === 'orders' ? 'Orders' : 'Items'}
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
    </div>
  );
}