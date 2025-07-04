import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Package, List, ShoppingCart, X, ArrowLeft, Search, Apple, Carrot, Milk, Beef, Package2, Plus, Upload, Save, Edit, LogOut, Download, Printer, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getOrders, updateOrderStatus, deleteOrder, Order } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Product, InsertProduct } from '@shared/schema';

// Helper functions for product operations
const uploadProductImage = async (file: File): Promise<string> => {
  // Create a data URL from the file for immediate display
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
};



// Helper function to map category names to IDs
const getCategoryId = (categoryName: string): number => {
  const mapping: { [key: string]: number } = {
    'Vegetables': 2,
    'Fruits': 1,
    'Dairy': 3,
    'Meat': 4,
    'Seafood': 5,
    'Bakery': 6
  };
  return mapping[categoryName] || 2; // Default to Vegetables
};

// Helper function to map category IDs to names
const getCategoryName = (categoryId: number | null): string => {
  const mapping: { [key: number]: string } = {
    1: 'Fruits',
    2: 'Vegetables', 
    3: 'Dairy',
    4: 'Meat',
    5: 'Seafood',
    6: 'Bakery'
  };
  return mapping[categoryId || 2] || 'Vegetables'; // Default to Vegetables
};

const createProduct = async (productData: any): Promise<Product> => {
  // Map category names to category IDs
  const categoryMapping: { [key: string]: number } = {
    'Vegetables': 2,
    'Fruits': 1,
    'Dairy': 4,
    'Meat': 6,
    'Seafood': 5,
    'Bakery': 3
  };
  
  const insertProduct: InsertProduct = {
    name: productData.name,
    price: productData.price.toString(),
    unit: productData.unit,
    imageUrl: productData.imageUrl,
    categoryId: categoryMapping[productData.category] || 2, // Default to Vegetables
    available: productData.available,
    displayOrder: 0
  };
  
  return await apiRequest('POST', '/api/products', insertProduct);
};

// Mock orders data
const mockOrders = [
  {
    id: '1',
    customerName: 'محمد علي',
    customerEmail: 'ahmed@example.com',
    customerPhone: '07708080080',
    address: {
      governorate: 'كركوك',
      district: 'طريق بغداد',
      neighborhood: 'الحي الصناعي',
      street: 'شارع الرئيسي',
      houseNumber: '15',
      floorNumber: '2',
      notes: 'قرب المسجد الكبير'
    },
    items: [
      { productId: 1, productName: 'تفاح عضوي', quantity: 2, price: '12.50', unit: 'kg' },
      { productId: 2, productName: 'سبانخ طازجة', quantity: 1, price: '8.00', unit: 'bunch' }
    ],
    totalAmount: 33.00,
    status: 'pending' as const,
    orderDate: '2025-01-01T10:30:00Z',
    notes: 'Please deliver in the morning'
  },
  {
    id: '2',
    customerName: 'فاطمة أحمد',
    customerEmail: 'fatima@example.com',
    customerPhone: '07717654321',
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
      { productId: 3, productName: 'موز', quantity: 3, price: '6.75', unit: 'kg' }
    ],
    totalAmount: 20.25,
    status: 'confirmed' as const,
    orderDate: '2025-01-01T14:15:00Z',
    notes: ''
  },
  {
    id: '3',
    customerName: 'Omar Khalil',
    customerEmail: 'omar@example.com',
    customerPhone: '+964 772 345 6789',
    address: {
      governorate: 'Baghdad',
      district: 'Sadr City',
      neighborhood: 'Al-Thawra',
      street: 'Market Street',
      houseNumber: '8',
      floorNumber: '3',
      notes: 'Opposite the pharmacy'
    },
    items: [
      { productId: 1, productName: 'Banana', quantity: 3, price: '4.50', unit: 'kg' },
      { productId: 2, productName: 'Tomatoes', quantity: 2, price: '6.00', unit: 'kg' },
      { productId: 3, productName: 'Onions', quantity: 1, price: '3.00', unit: 'kg' }
    ],
    totalAmount: 13.50,
    status: 'preparing' as const,
    orderDate: '2025-01-01T16:45:00Z',
    notes: 'Fresh vegetables only'
  },
  {
    id: '4',
    customerName: 'Sara Mohammed',
    customerEmail: 'sara@example.com',
    customerPhone: '+964 773 456 7890',
    address: {
      governorate: 'Baghdad',
      district: 'Karkh',
      neighborhood: 'Al-Adhamiya',
      street: 'University Street',
      houseNumber: '25',
      floorNumber: '1',
      notes: 'Green door, ground floor'
    },
    items: [
      { productId: 1, productName: 'Oranges', quantity: 2, price: '5.00', unit: 'kg' },
      { productId: 2, productName: 'Carrots', quantity: 1, price: '2.50', unit: 'kg' },
      { productId: 3, productName: 'Cucumber', quantity: 3, price: '4.50', unit: 'kg' }
    ],
    totalAmount: 12.00,
    status: 'out-for-delivery' as const,
    orderDate: '2025-01-01T12:20:00Z',
    notes: 'Delivery between 2-4 PM'
  },
  {
    id: '5',
    customerName: 'Ali Rashid',
    customerEmail: 'ali@example.com',
    customerPhone: '+964 774 567 8901',
    address: {
      governorate: 'Baghdad',
      district: 'Rusafa',
      neighborhood: 'Bab Al-Sharqi',
      street: 'Commercial Street',
      houseNumber: '12',
      floorNumber: '2',
      notes: 'Above the grocery store'
    },
    items: [
      { productId: 1, productName: 'Apples', quantity: 1, price: '4.00', unit: 'kg' },
      { productId: 2, productName: 'Potatoes', quantity: 2, price: '3.00', unit: 'kg' },
      { productId: 3, productName: 'Bell Peppers', quantity: 1, price: '5.00', unit: 'kg' }
    ],
    totalAmount: 12.00,
    status: 'delivered' as const,
    orderDate: '2025-01-01T09:30:00Z',
    notes: 'Thank you for the quick service!'
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
        <div className="mt-4 flex gap-2">
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log('📄 Manual printing invoice for order:', order.id);
              try {
                const response = await fetch('/api/generate-invoice-pdf', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    orderIds: [order.id]
                  })
                });

                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  
                  // Download PDF for Brother DCP-T520W printer
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `invoice-order-${order.id}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  // Clean up the URL object
                  window.URL.revokeObjectURL(url);
                  
                  console.log('✅ PDF downloaded successfully for printing');
                } else {
                  console.error('❌ Print error:', {});
                }
              } catch (error) {
                console.error('❌ Print error:', {});
              }
            }}
          >
            📄 Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Add Item Popup Component
function AddItemPopup({ isOpen, onClose, onAddItem }: {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: any) => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Vegetables',
    unit: 'kg',
    available: true,
    image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const imageUrl = productData.image ? await uploadProductImage(productData.image) : '/api/placeholder/60/60';
      
      const newProduct = {
        name: productData.name,
        description: productData.description || '',
        price: productData.price, // Keep as string for Zod validation
        unit: productData.unit,
        imageUrl,
        categoryId: getCategoryId(productData.category),
        available: productData.available,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      return response.json();
    },
    onSuccess: (savedProduct) => {
      // Invalidate and refetch products to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      onAddItem(savedProduct);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Vegetables',
        unit: 'kg',
        available: true,
        image: null
      });
      setImagePreview(null);
    },
    onError: (error) => {
      console.error('Error creating product:', error);
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    createProductMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl bg-white p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Plus className="h-4 w-4 text-green-600" />
            </div>
            Add New Item
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
              className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Short Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the product"
              className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price (IQD)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
              step="0.25"
              className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Category and Unit Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Fruits">Fruits</SelectItem>
                  <SelectItem value="Vegetables">Vegetables</SelectItem>
                  <SelectItem value="Dairy">Dairy</SelectItem>
                  <SelectItem value="Meat">Meat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium text-gray-700">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="bunch">Bunch</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm font-medium text-gray-700">Product Image</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="flex items-center gap-2 rounded-xl border-gray-200 hover:border-green-300"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview && (
                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden border-2 border-green-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-xl border-gray-200 hover:border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createProductMutation.isPending} 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 rounded-xl"
            >
              {createProductMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {createProductMutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Item Popup Component
function EditItemPopup({ isOpen, onClose, onUpdateItem, product }: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateItem: (item: any) => void;
  product: Product | null;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Vegetables',
    unit: 'kg',
    available: true,
    image: null as File | null,
    imageUrl: '' // Store the uploaded image URL
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      try {
        // Use the new image URL if available, otherwise keep existing image URL  
        const imageUrl = productData.imageUrl || product?.imageUrl || '/api/placeholder/60/60';
        
        const updatedProduct = {
          name: productData.name,
          description: productData.description || '',
          price: parseFloat(productData.price),
          // Convert category string to categoryId number
          categoryId: getCategoryId(productData.category),
          unit: productData.unit,
          available: productData.available,
          imageUrl
        };

        console.log('Updating product with data:', updatedProduct);

        const response = await fetch(`/api/products/${product?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`Failed to update product: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Product updated successfully:', result);
        return result;
      } catch (error) {
        console.error('Error in updateProductMutation:', error);
        throw error;
      }
    },
    onSuccess: (updatedProduct) => {
      console.log('Mutation onSuccess called with:', updatedProduct);
      // Invalidate and refetch products to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      onUpdateItem(updatedProduct);
      onClose();
      
      // Reset form state
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Vegetables',
        unit: 'kg',
        available: true,
        image: null,
        imageUrl: ''
      });
      setImagePreview(null);
    },
    onError: (error) => {
      console.error('Failed to update product:', error);
      // You could add a toast notification here
    }
  });

  // Initialize form with product data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        category: getCategoryName(product.categoryId),
        unit: product.unit,
        available: product.available,
        image: null,
        imageUrl: product.imageUrl
      });
      setImagePreview(product.imageUrl);
    }
  }, [product]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      try {
        // Create preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload image and get URL for storage across entire app
        const uploadedImageUrl = await uploadProductImage(file);
        setFormData(prev => ({ 
          ...prev, 
          image: file,
          imageUrl: uploadedImageUrl 
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    updateProductMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl bg-white p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Edit className="h-4 w-4 text-blue-600" />
            </div>
            Edit Item
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">Product Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
              className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">Short Description</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the product"
              className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="edit-price" className="text-sm font-medium text-gray-700">Price (IQD)</Label>
            <Input
              id="edit-price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
              step="0.25"
              className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Category and Unit Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-sm font-medium text-gray-700">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Fruits">Fruits</SelectItem>
                  <SelectItem value="Vegetables">Vegetables</SelectItem>
                  <SelectItem value="Dairy">Dairy</SelectItem>
                  <SelectItem value="Meat">Meat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="edit-unit" className="text-sm font-medium text-gray-700">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="bunch">Bunch</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="edit-image" className="text-sm font-medium text-gray-700">Product Image</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingImage}
                onClick={() => document.getElementById('edit-image-upload')?.click()}
                className="flex items-center gap-2 rounded-xl border-gray-200 hover:border-blue-300 disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploadingImage ? 'Uploading...' : 'Change Image'}
              </Button>
              <input
                id="edit-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview && (
                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden border-2 border-blue-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            {isUploadingImage && (
              <p className="text-xs text-blue-600">Uploading image... Preview will update automatically.</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-xl border-gray-200 hover:border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateProductMutation.isPending} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {updateProductMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {updateProductMutation.isPending ? 'Updating...' : 'Update Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Items Management Component
function ItemsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from backend API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products', { credentials: 'include' });
        if (response.ok) {
          const backendProducts = await response.json();
          // Convert backend products to Firebase-compatible format
          const convertedProducts = backendProducts.map((product: any) => ({
            id: product.id.toString(),
            name: product.name,
            description: product.name, // Use name as description for now
            price: parseFloat(product.price),
            category: getCategoryName(product.categoryId),
            unit: product.unit,
            available: product.available ?? true, // Use actual availability from database
            displayOrder: product.displayOrder ?? 0, // Add display order
            imageUrl: product.imageUrl,
            createdAt: new Date().toISOString()
          }));
          setProducts(convertedProducts);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };

    loadProducts();
  }, []);



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
      (selectedCategory === 2 && product.category === 'Vegetables') ||
      (selectedCategory === 3 && product.category === 'Dairy') ||
      (selectedCategory === 4 && product.category === 'Meat') ||
      (selectedCategory === 5 && product.category === 'Seafood') ||
      (selectedCategory === 6 && product.category === 'Bakery');
    return matchesSearch && matchesCategory;
  });

  const updateProductPrice = async (id: string, newPrice: string) => {
    const numericPrice = parseFloat(newPrice);
    if (isNaN(numericPrice)) return;
    
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, price: numericPrice } : product
    ));
    
    // TODO: Update in Firebase (will implement if needed)
  };

  const updateProductAvailability = async (id: string, available: boolean) => {
    try {
      // Update backend first
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ available }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to update product availability');

      // Update local state only after successful backend update
      setProducts(prev => prev.map(product => 
        product.id === id ? { ...product, available } : product
      ));
    } catch (error) {
      console.error('Failed to update product availability:', error);
    }
  };

  const updateProductDisplayOrder = async (id: string, displayOrder: number) => {
    try {
      // Update backend first
      const response = await fetch(`/api/products/${id}/display-order`, {
        method: 'PATCH',
        body: JSON.stringify({ displayOrder }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to update product display order');

      // Update local state and reload products to reflect new ordering
      const productsResponse = await fetch('/api/products', { credentials: 'include' });
      if (productsResponse.ok) {
        const backendProducts = await productsResponse.json();
        const convertedProducts = backendProducts.map((product: any) => ({
          id: product.id.toString(),
          name: product.name,
          description: product.name,
          price: parseFloat(product.price),
          category: getCategoryName(product.categoryId),
          unit: product.unit,
          available: product.available ?? true,
          displayOrder: product.displayOrder ?? 0,
          imageUrl: product.imageUrl,
          createdAt: new Date().toISOString()
        }));
        setProducts(convertedProducts);
      }
    } catch (error) {
      console.error('Failed to update product display order:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditItemOpen(true);
  };

  const handleUpdateItem = (updatedProduct: any) => {
    // The API call is already handled by the EditItemPopup mutation
    // Just close the modal here since React Query will handle cache invalidation
    setIsEditItemOpen(false);
    setEditingProduct(null);
  };

  const handleAddItem = (newItem: any) => {
    // The mutation handles everything, just close the modal
    setIsAddItemOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Single App Bar - Back + Search + Add Item */}
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
              className="pl-10 h-9 text-sm border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Add Item Button */}
          <Button
            onClick={() => setIsAddItemOpen(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 h-auto text-xs rounded-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === null 
                ? 'text-white border-2 border-gray-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedCategory === null ? { backgroundColor: '#22c55e' } : {}}
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
                    ? 'text-white border-2 border-gray-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedCategory === category.id ? { backgroundColor: '#22c55e' } : {}}
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
                    src={product.imageUrl} 
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
                    onChange={(e) => product.id && updateProductPrice(product.id, e.target.value)}
                    className="w-14 h-6 text-xs text-center border-0 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                    step="0.25"
                  />
                </div>
                
                {/* Availability */}
                <select
                  value={product.available ? 'Available' : 'Unavailable'}
                  onChange={(e) => product.id && updateProductAvailability(product.id, e.target.value === 'Available')}
                  className="text-xs border-0 bg-gray-50 rounded px-1.5 py-1 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>

                {/* Priority Position */}
                <select
                  value={product.displayOrder || 0}
                  onChange={(e) => product.id && updateProductDisplayOrder(product.id, parseInt(e.target.value))}
                  className="text-xs border-0 bg-gray-50 rounded px-1.5 py-1 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                  <option value={9}>9</option>
                  <option value={10}>10</option>
                  <option value={0}>Last</option>
                </select>

                {/* Edit Button */}
                <button
                  onClick={() => handleEditProduct(product)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Edit className="h-3 w-3" />
                </button>
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

      {/* Add Item Popup */}
      <AddItemPopup 
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={handleAddItem}
      />

      {/* Edit Item Popup */}
      <EditItemPopup 
        isOpen={isEditItemOpen}
        onClose={() => {
          setIsEditItemOpen(false);
          setEditingProduct(null);
        }}
        onUpdateItem={handleUpdateItem}
        product={editingProduct}
      />
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
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle order selection
  const handleOrderSelect = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  // Handle select all orders
  const handleSelectAll = (checked: boolean) => {
    console.log('handleSelectAll called:', { checked, filteredOrdersCount: filteredOrders.length });
    if (checked) {
      const allOrderIds = filteredOrders?.map(order => order.id) || [];
      console.log('Selecting all orders:', allOrderIds);
      setSelectedOrders(allOrderIds);
    } else {
      console.log('Deselecting all orders');
      setSelectedOrders([]);
    }
  };

  // Handle batch print
  const handleBatchPrint = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "لا توجد طلبات محددة",
        description: "يرجى تحديد طلبات للطباعة",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      toast({
        title: "طباعة مجمعة",
        description: `جاري إنشاء ${selectedOrders.length} فاتورة...`,
        duration: 2000,
      });

      const response = await fetch('/api/generate-batch-invoices-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: selectedOrders
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Open PDF in new window and trigger print dialog for Brother DCP-T520W
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              // Also download as backup
              const link = document.createElement('a');
              link.href = url;
              link.download = `batch-invoices-${selectedOrders.length}-orders.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }, 1000);
          };
        } else {
          // Fallback: just download if popup blocked
          const link = document.createElement('a');
          link.href = url;
          link.download = `batch-invoices-${selectedOrders.length}-orders.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
        
        toast({
          title: "✅ تم فتح الطباعة المجمعة",
          description: `${selectedOrders.length} فواتير جاهزة للطباعة - اختر Brother DCP-T520W`,
          duration: 4000,
        });

        // Clear selection after successful batch print
        setSelectedOrders([]);
      } else {
        toast({
          title: "❌ خطأ في الطباعة المجمعة",
          description: "فشل في إنشاء الفواتير. حاول مرة أخرى.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "❌ خطأ في الطباعة المجمعة",
        description: "مشكلة في الاتصال. تحقق من الإنترنت.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: getOrders,
    refetchInterval: 5000
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => updateOrderStatus(String(id), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: number) => fetch(`/api/orders/${orderId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "تم حذف الطلب",
        description: "تم حذف الطلب بنجاح",
        duration: 3000,
      });
    }
  });


  const [currentView, setCurrentView] = useState<'orders' | 'items'>('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const handleOrderClick = (order: Order) => {
    console.log('handleOrderClick called with order:', order);
    console.log('Setting selectedOrder and showInvoice to true');
    setSelectedOrder(order);
    setShowInvoice(true);
    console.log('State should be updated - showInvoice:', true);
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setSelectedOrder(null);
  };

  const downloadInvoicePDF = async () => {
    if (!selectedOrder) return;
    
    try {
      console.log('Generating PDF with Playwright server-side rendering...');
      
      // Send order data to server for PDF generation
      const response = await fetch('/api/generate-invoice-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: [selectedOrder.id]
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `فاتورة-${selectedOrder.customerName}-${selectedOrder.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Professional Arabic RTL PDF with selectable text generated successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (error instanceof Error) {
        alert(`PDF Error: ${error.message}`);
      } else {
        alert('Error generating PDF. Please try again.');
      }
    }
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminEmail');
    window.location.href = '/admin';
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
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-xs">
                {currentView === 'orders' ? 'Orders Dashboard' : 'Items Management'}
              </Badge>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {currentView === 'orders' ? (
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Orders</h1>
            <p className="text-gray-600">Manage customer orders and deliveries</p>
          </div>
          
          {/* Batch Print Controls */}
          <div className={`rounded-lg border p-4 mb-6 ${
            selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : selectedOrders.length > 0
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelectAll(!(selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length))}
                >
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                    selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-400 bg-white'
                  }`}>
                    {selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length && (
                      <span className="text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length
                      ? `تم تحديد الكل (${selectedOrders.length} طلبات)`
                      : selectedOrders.length > 0 
                        ? `${selectedOrders.length} طلبات محددة`
                        : 'تحديد الكل'
                    }
                  </span>
                </button>
                {selectedOrders.length > 0 && (
                  <Button
                    onClick={handleBatchPrint}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Printer className="h-4 w-4" />
                    طباعة مجمعة ({selectedOrders.length})
                  </Button>
                )}
              </div>
              {selectedOrders.length > 0 && (
                <Button
                  onClick={() => setSelectedOrders([])}
                  variant="outline"
                  size="sm"
                >
                  إلغاء التحديد
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">No orders available at the moment.</p>
              </div>
            ) : (
              <>
                {filteredOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      console.log('Order card clicked:', order.id);
                      handleOrderClick(order);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleOrderSelect(order.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
                              deleteOrderMutation.mutate(order.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="حذف الطلب"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            console.log('📄 Manual printing invoice for order:', order.id);
                            
                            try {
                              toast({
                                title: "طباعة الفاتورة",
                                description: "جاري إنشاء الفاتورة...",
                                duration: 2000,
                              });

                              const response = await fetch('/api/generate-invoice-pdf', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  orderData: order
                                })
                              });

                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                
                                // Open PDF in new window and trigger print dialog for Brother DCP-T520W
                                const printWindow = window.open(url, '_blank');
                                if (printWindow) {
                                  printWindow.onload = () => {
                                    // Wait a moment for PDF to load, then trigger print
                                    setTimeout(() => {
                                      printWindow.print();
                                      // Also download as backup
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `invoice-order-${order.id}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }, 1000);
                                  };
                                } else {
                                  // Fallback: just download if popup blocked
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `invoice-order-${order.id}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                                
                                // Clean up the URL object after delay
                                setTimeout(() => {
                                  window.URL.revokeObjectURL(url);
                                }, 5000);
                                
                                console.log('✅ PDF opened for printing to Brother DCP-T520W');
                                
                                toast({
                                  title: "✅ تم فتح الطباعة",
                                  description: `فاتورة الطلب ${order.id} - اختر طابعة Brother DCP-T520W`,
                                  duration: 3000,
                                });
                              } else {
                                toast({
                                  title: "❌ خطأ في الطباعة",
                                  description: "فشل في إنشاء الفاتورة. حاول مرة أخرى.",
                                  variant: "destructive",
                                  duration: 3000,
                                });
                              }
                            } catch (error) {
                              toast({
                                title: "❌ خطأ في الطباعة",
                                description: "مشكلة في الاتصال. تحقق من الإنترنت.",
                                variant: "destructive",
                                duration: 3000,
                              });
                            }
                          }}
                        >
                          📄
                        </Button>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-green-600">{order.totalAmount}.00 د.ع</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
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

      {/* Arabic Invoice Popup */}
      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" dir="rtl">
            <div id="invoice-content" className="p-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">فاتورة الطلب</h2>
                <div className="flex items-center gap-2" data-button-container>
                  <button
                    onClick={downloadInvoicePDF}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="حفظ الفاتورة"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={closeInvoice}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">معلومات العميل</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">الاسم:</span>
                    <span className="text-gray-900">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">رقم الموبايل:</span>
                    <span className="text-gray-900">{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-700">العنوان:</span>
                    <span className="text-gray-900 text-left max-w-xs" dir="ltr">
                      ({(selectedOrder.address as any).governorate} - {(selectedOrder.address as any).district} - {((selectedOrder.address as any).landmark || (selectedOrder.address as any).notes || 'غير محدد').replace(/\s*-\s*\d{10,}.*$/, '')})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">تاريخ الطلب:</span>
                    <span className="text-gray-900">{new Date(selectedOrder.orderDate).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">قائمة الطلبات</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-right font-semibold">الاسم</th>
                        <th className="border border-gray-300 px-2 py-1 text-right font-semibold">السعر للكيلو</th>
                        <th className="border border-gray-300 px-2 py-1 text-right font-semibold">الكمية</th>
                        <th className="border border-gray-300 px-2 py-1 text-right font-semibold">السعر الكلي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items as any[]).map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1 font-medium">{item.productName}</td>
                          <td className="border border-gray-300 px-2 py-1">{item.price}</td>
                          <td className="border border-gray-300 px-2 py-1">{item.quantity} {item.unit === 'kg' ? 'كيلو' : item.unit === 'bunch' ? 'حزمة' : item.unit}</td>
                          <td className="border border-gray-300 px-2 py-1 font-medium">
                            {(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي:</span>
                  <span>{selectedOrder.totalAmount.toFixed(2)} د.ع</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>رسوم التوصيل:</span>
                  <span>5.00 د.ع</span>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>المجموع الكلي:</span>
                    <span className="text-green-600">{(selectedOrder.totalAmount + 5).toFixed(2)} د.ع</span>
                  </div>
                </div>
              </div>



              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium text-sm">ملاحظات:</span>
                  <p className="text-sm text-gray-700 mt-1">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}