import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Package, List, ShoppingCart, X, ArrowLeft, Search, Apple, Carrot, Milk, Beef, Package2 } from 'lucide-react';

// Mock orders data
const mockOrders = [
  {
    id: '1',
    customerName: 'Ahmed Hassan',
    customerEmail: 'ahmed@example.com',
    customerPhone: '+964 770 123 4567',
    address: {
      governorate: 'Baghdad',
      district: 'Karrada',
      neighborhood: 'Al-Jadriya',
      street: 'Main Street',
      houseNumber: '15',
      floorNumber: '2',
      notes: 'Near the main mosque'
    },
    items: [
      { productId: 1, productName: 'Organic Apples', quantity: 2, price: '12.50', unit: 'kg' },
      { productId: 2, productName: 'Fresh Spinach', quantity: 1, price: '8.00', unit: 'bunch' }
    ],
    totalAmount: 33.00,
    status: 'pending' as const,
    orderDate: '2025-01-01T10:30:00Z',
    notes: 'Please deliver in the morning'
  },
  {
    id: '2',
    customerName: 'Fatima Ali',
    customerEmail: 'fatima@example.com',
    customerPhone: '+964 771 234 5678',
    address: {
      governorate: 'Baghdad',
      district: 'Mansour',
      neighborhood: 'Al-Yarmuk',
      street: 'Secondary Street',
      houseNumber: '22',
      floorNumber: '1',
      notes: 'Blue gate'
    },
    items: [
      { productId: 3, productName: 'Bananas', quantity: 3, price: '6.75', unit: 'kg' }
    ],
    totalAmount: 20.25,
    status: 'confirmed' as const,
    orderDate: '2025-01-01T14:15:00Z',
    notes: ''
  }
];

// Order Stats Component
function OrderStats({ orders }: { orders: typeof mockOrders }) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-sm text-gray-600">Pending Orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="ml-4">
              <div className="text-2xl font-bold">IQD {totalRevenue.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Order Card Component
function OrderCard({ order, onStatusChange }: any) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
            <p className="text-sm text-gray-600">{order.customerName}</p>
          </div>
          <Badge variant={order.status === 'pending' ? 'destructive' : 'default'}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Phone:</strong> {order.customerPhone}</p>
          <p><strong>Address:</strong> {order.address.street}, {order.address.neighborhood}</p>
          <p><strong>Total:</strong> IQD {order.totalAmount.toLocaleString()}</p>
        </div>
        <div className="mt-4">
          <Select value={order.status} onValueChange={(newStatus) => onStatusChange(order.id, newStatus)}>
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

// Items Management Component
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
    <div className="min-h-screen bg-gray-50">
      {/* Single App Bar - Back + Search only */}
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
                {category.count > 0 && (
                  <span className="bg-white text-gray-600 text-xs px-1.5 py-0.5 rounded-full ml-1">
                    {category.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products List */}
      <div className="p-4">
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2">
                {/* Product Image */}
                <div className="w-10 h-10 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Product Name */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                </div>
                
                {/* Price */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">IQD</span>
                  <Input
                    type="number"
                    value={product.price}
                    onChange={(e) => updateProductPrice(product.id, e.target.value)}
                    className="w-14 h-6 text-xs text-center border-gray-300 focus:border-blue-500"
                    step="0.25"
                  />
                </div>
                
                {/* Availability */}
                <select
                  value={product.available ? 'Available' : 'Unavailable'}
                  onChange={(e) => updateProductAvailability(product.id, e.target.value === 'Available')}
                  className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
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
      <div className="bg-white border-t border-gray-200 px-4 py-2 mt-auto">
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
          </div>
        </div>
      </div>
    </>
  );
}

// Main Admin Panel Component
export default function AdminPanel() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState(mockOrders);
  const [currentView, setCurrentView] = useState<'orders' | 'items'>('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus as any } : order
    ));
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with List Icon */}
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

      {/* Content Area */}
      {currentView === 'orders' ? (
        <div className="max-w-7xl mx-auto p-6">
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
        </div>
      ) : (
        <ItemsManagement />
      )}

      {/* Admin Sidebar */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        setCurrentView={setCurrentView}
      />
    </div>
  );
}