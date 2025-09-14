import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Package, List, ShoppingCart, X, ArrowLeft, Search, Apple, Carrot, Milk, Beef, Package2, Plus, Upload, Save, Edit, LogOut, Download, Printer, Trash2, Users, Clock, Mail, Phone, Calendar, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getOrders, updateOrderStatus, deleteOrder, Order } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/price-utils';
import { useSettings } from '@/hooks/use-settings';
import type { Product, InsertProduct } from '@shared/schema';

// Helper functions for product operations
const uploadProductImage = async (file: File): Promise<string> => {
  console.log('🔥 uploadProductImage called with:', file.name, file.size, file.type);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imageData = reader.result as string;
        console.log('🔥 FileReader completed, image data length:', imageData.length);
        
        // Upload to backend
        console.log('🔥 Sending POST request to /api/upload-image...');
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData,
            fileName: file.name
          }),
        });

        console.log('🔥 Upload response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔥 Upload failed with status:', response.status, errorText);
          throw new Error(`Failed to upload image: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('🔥 Upload successful, result:', result);
        resolve(result.imageUrl);
      } catch (error) {
        console.error('🔥 Image upload failed:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error('🔥 FileReader error:', error);
      reject(new Error('Failed to read file'));
    };
    console.log('🔥 Starting FileReader.readAsDataURL...');
    reader.readAsDataURL(file);
  });
};



// Helper function to map category names to IDs (UPDATED TO MATCH DATABASE)
const getCategoryId = (categoryName: string): number => {
  const mapping: { [key: string]: number } = {
    'Vegetables': 2,
    'Fruits': 1,
    'مشروبات': 3,
    'Bakery': 4,
    'Meat': 6
  };
  return mapping[categoryName] || 2; // Default to Vegetables
};

// Helper function to map category IDs to names (UPDATED TO MATCH DATABASE)
const getCategoryName = (categoryId: number | null): string => {
  const mapping: { [key: number]: string } = {
    1: 'Fruits',
    2: 'Vegetables', 
    3: 'مشروبات',
    4: 'Bakery',
    6: 'Meat'
  };
  return mapping[categoryId || 2] || 'Vegetables'; // Default to Vegetables
};

const createProduct = async (productData: any): Promise<Product> => {
  // Map category names to category IDs (UPDATED TO MATCH DATABASE)
  const categoryMapping: { [key: string]: number } = {
    'Vegetables': 2,
    'Fruits': 1,
    'مشروبات': 3,
    'Bakery': 4,
    'Meat': 6
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
  
  const response = await apiRequest('POST', '/api/products', insertProduct);
  return await response.json();
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
      console.log('🔥 Creating product with data:', productData);
      console.log('🔥 Image type check:', {
        hasImage: !!productData.image,
        isFile: productData.image instanceof File,
        imageValue: productData.image,
        imageName: productData.image?.name,
        imageSize: productData.image?.size,
        imageType: productData.image?.type
      });
      
      let imageUrl = '/api/placeholder/60/60';
      
      // Only upload if we have a proper File object
      if (productData.image && productData.image instanceof File) {
        try {
          console.log('🔥 UPLOADING IMAGE FILE:', productData.image.name, 'size:', productData.image.size);
          imageUrl = await uploadProductImage(productData.image);
          console.log('🔥 IMAGE UPLOADED SUCCESSFULLY:', imageUrl);
        } catch (error) {
          console.error('🔥 IMAGE UPLOAD FAILED:', error);
          // Continue with placeholder image on upload failure
          imageUrl = '/api/placeholder/60/60';
        }
      } else {
        console.log('🔥 NO IMAGE TO UPLOAD, using placeholder');
      }
      
      const newProduct = {
        name: productData.name,
        description: productData.description || '',
        price: productData.price, // Keep as string for Zod validation
        unit: productData.unit,
        imageUrl,
        categoryId: getCategoryId(productData.category),
        available: productData.available,
      };

      console.log('Sending product to API:', newProduct);
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', errorText);
        throw new Error(`Failed to create product: ${response.status} ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (savedProduct) => {
      console.log('Product created successfully:', savedProduct);
      
      // Invalidate and refetch products to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      onAddItem(savedProduct);
      onClose();
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please try again.');
    }
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened, resetting form and mutation state');
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
      // Reset mutation state to clear any previous errors
      createProductMutation.reset();
    }
  }, [isOpen]); // Remove createProductMutation dependency to prevent continuous resets

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('🔥 IMAGE CHANGE DETECTED:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });
    if (file) {
      console.log('🔥 SETTING FILE TO FORM DATA:', file);
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('🔥 IMAGE PREVIEW SET:', result?.substring(0, 50) + '...');
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    if (!formData.name || !formData.price) {
      console.log('Form validation failed - missing name or price');
      return;
    }
    
    if (createProductMutation.isPending) {
      console.log('Mutation already in progress, skipping');
      return;
    }
    
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
                  <SelectItem value="مشروبات">مشروبات</SelectItem>
                  <SelectItem value="Bakery">Bakery</SelectItem>
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
                  <SelectItem value="مشروبات">مشروبات</SelectItem>
                  <SelectItem value="Bakery">Bakery</SelectItem>
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
  const queryClient = useQueryClient();

  // Debug: Log state changes
  useEffect(() => {
    console.log('isAddItemOpen state changed to:', isAddItemOpen);
  }, [isAddItemOpen]);

  // REAL-TIME: Use React Query for automatic updates
  const { data: backendProducts = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 1000, // Refetch every 1 second for real-time updates
  });

  // Convert backend products to Firebase-compatible format
  const products = backendProducts.map((product: any) => ({
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



  const categories = [
    { id: 1, name: 'Fruits', icon: Apple, count: products.filter(p => p.category === 'Fruits').length },
    { id: 2, name: 'Vegetables', icon: Carrot, count: products.filter(p => p.category === 'Vegetables').length },
    { id: 3, name: 'مشروبات', icon: Milk, count: products.filter(p => p.category === 'مشروبات').length },
    { id: 4, name: 'Bakery', icon: Package2, count: products.filter(p => p.category === 'Bakery').length },
    { id: 6, name: 'Meat', icon: Beef, count: products.filter(p => p.category === 'Meat').length }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || 
      (selectedCategory === 1 && product.category === 'Fruits') ||
      (selectedCategory === 2 && product.category === 'Vegetables') ||
      (selectedCategory === 3 && product.category === 'مشروبات') ||
      (selectedCategory === 4 && product.category === 'Bakery') ||
      (selectedCategory === 6 && product.category === 'Meat');
    return matchesSearch && matchesCategory;
  });

  const updateProductPrice = async (id: string, newPrice: string) => {
    const numericPrice = parseFloat(newPrice);
    if (isNaN(numericPrice)) return;
    
    // React Query handles state updates automatically
    await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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

      // React Query will automatically update via cache invalidation
      await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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

      // React Query handles automatic updates
      await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete product');

      // CRITICAL: Invalidate React Query cache for instant real-time updates
      await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      console.log('Real-time sync: Admin panel and main app updated automatically');
      
      console.log('Product deleted successfully');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    }
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
            onClick={() => {
              console.log('Add Item button clicked, opening dialog');
              setIsAddItemOpen(true);
            }}
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
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Image load error for product:', product.name, 'URL:', product.imageUrl);
                      // Set a fallback gray background on error
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully for product:', product.name, 'URL:', product.imageUrl);
                    }}
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

                {/* Edit and Delete Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
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
      <div className="bg-white border-t border-gray-200 px-4 py-2 mt-auto">
        <p className="text-center text-xs text-gray-500">
          This app was built by MX 2025 • mxdev92@gmail.com
        </p>
      </div>

      {/* Add Item Popup */}
      <AddItemPopup 
        isOpen={isAddItemOpen}
        onClose={() => {
          console.log('AddItemPopup onClose called, setting isAddItemOpen to false');
          setIsAddItemOpen(false);
        }}
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

// Settings Management Component
function SettingsManagement() {
  const { toast } = useToast();
  const [deliveryFee, setDeliveryFee] = useState(3500);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current delivery fee
  const { data: currentSettings } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json()),
    onSuccess: (data) => {
      if (data && data.delivery_fee) {
        setDeliveryFee(data.delivery_fee);
      }
    }
  });

  // Update delivery fee mutation
  const updateDeliveryFeeMutation = useMutation({
    mutationFn: async (newFee: number) => {
      const response = await fetch('/api/settings/delivery-fee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryFee: newFee })
      });
      if (!response.ok) throw new Error('Failed to update delivery fee');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ تم تحديث رسوم التوصيل",
        description: `رسوم التوصيل الجديدة: ${formatPrice(deliveryFee)} د.ع`,
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "❌ خطأ في التحديث",
        description: "فشل في تحديث رسوم التوصيل. حاول مرة أخرى.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleSaveDeliveryFee = () => {
    if (deliveryFee < 0 || deliveryFee > 50000) {
      toast({
        title: "❌ قيمة غير صحيحة",
        description: "رسوم التوصيل يجب أن تكون بين 0 و 50,000 د.ع",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    updateDeliveryFeeMutation.mutate(deliveryFee);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات التطبيق</h1>
          <p className="text-gray-600 mt-1">إدارة إعدادات النظام والتكوين</p>
        </div>
      </div>

      {/* Delivery Fee Settings Card */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            إعدادات رسوم التوصيل
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            تحديد رسوم التوصيل المطبقة على جميع الطلبات
          </p>
        </CardHeader>

        <CardContent className="px-0 space-y-6">
          {/* Current Delivery Fee Display */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">رسوم التوصيل الحالية:</span>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(currentSettings?.delivery_fee || 3500)} د.ع
              </span>
            </div>
          </div>

          {/* New Delivery Fee Input */}
          <div className="space-y-3">
            <Label htmlFor="delivery-fee" className="text-sm font-medium text-gray-700">
              رسوم التوصيل الجديدة (بالدينار العراقي)
            </Label>
            <div className="flex gap-3">
              <Input
                id="delivery-fee"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                placeholder="3500"
                min="0"
                max="50000"
                step="250"
                className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                onClick={handleSaveDeliveryFee}
                disabled={updateDeliveryFeeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl"
              >
                {updateDeliveryFeeMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    حفظ...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    حفظ
                  </div>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              القيمة بالدينار العراقي (مثال: 3500 = 3,500 د.ع)
            </p>
          </div>

          {/* Preview Section */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">معاينة:</h4>
            <div className="text-sm text-blue-800">
              <div className="flex justify-between">
                <span>مجموع المنتجات:</span>
                <span>10,000 د.ع</span>
              </div>
              <div className="flex justify-between">
                <span>رسوم التوصيل:</span>
                <span>{formatPrice(deliveryFee)} د.ع</span>
              </div>
              <div className="border-t border-blue-300 mt-2 pt-2 flex justify-between font-semibold">
                <span>المجموع الكلي:</span>
                <span>{formatPrice(10000 + deliveryFee)} د.ع</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Sidebar Component
function AdminSidebar({ isOpen, onClose, setCurrentView }: { 
  isOpen: boolean; 
  onClose: () => void; 
  setCurrentView: (view: 'orders' | 'items' | 'users' | 'drivers' | 'settings') => void;
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
              onClick={() => {
                setCurrentView('settings');
                onClose();
              }}
            >
              <Settings className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">App Settings</div>
                <div className="text-sm text-gray-500">Configure delivery fee and more</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Drivers Management Component  
function DriversManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDriver, setShowAddDriver] = useState(false);
  
  const { data: drivers = [], isLoading, error } = useQuery({
    queryKey: ['/api/drivers'],
    queryFn: () => fetch('/api/drivers').then(res => res.json()),
    refetchInterval: 3000 // Real-time updates every 3 seconds
  });

  const addDriverMutation = useMutation({
    mutationFn: (driverData: any) => 
      fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      setShowAddDriver(false);
      toast({
        title: "تم إضافة السائق",
        description: "تم إضافة السائق بنجاح",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الإضافة",
        description: "فشل في إضافة السائق. حاول مرة أخرى.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (driverId: number) => fetch(`/api/drivers/${driverId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      toast({
        title: "تم حذف السائق",
        description: "تم حذف السائق بنجاح",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف السائق. حاول مرة أخرى.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleAddDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const driverData = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      isActive: true
    };
    addDriverMutation.mutate(driverData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">فشل في تحميل بيانات السواق</div>
        <div className="text-gray-500 mt-2">يرجى إعادة تحميل الصفحة</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة السواق</h1>
          <p className="text-gray-600">إدارة حسابات السواق والتوصيل</p>
        </div>
        <Button 
          onClick={() => setShowAddDriver(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          إضافة سائق جديد
        </Button>
      </div>

      {drivers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد سواق مسجلين</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة أول سائق للنظام</p>
          <Button 
            onClick={() => setShowAddDriver(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            إضافة سائق جديد
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver: any) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{driver.fullName}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Mail className="h-4 w-4 mr-1" />
                        {driver.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="h-4 w-4 mr-1" />
                        {driver.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(driver.createdAt).toLocaleDateString('ar-IQ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={driver.isActive ? "default" : "secondary"}>
                      {driver.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDriverMutation.mutate(driver.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Driver Dialog */}
      <Dialog open={showAddDriver} onOpenChange={setShowAddDriver}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة سائق جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDriver} className="space-y-4">
            <div>
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input 
                id="fullName" 
                name="fullName" 
                required 
                className="mt-1"
                placeholder="أدخل الاسم الكامل"
              />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input 
                id="phone" 
                name="phone" 
                required 
                className="mt-1"
                placeholder="07XXXXXXXXX"
                pattern="^07[0-9]{9}$"
              />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="mt-1"
                placeholder="driver@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="mt-1"
                placeholder="أدخل كلمة مرور قوية"
                minLength={6}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={addDriverMutation.isPending}
              >
                {addDriverMutation.isPending ? 'جاري الإضافة...' : 'إضافة السائق'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddDriver(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Users Management Component
function UsersManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    refetchInterval: 3000 // Real-time updates every 3 seconds
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => fetch(`/api/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم بنجاح",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف المستخدم. حاول مرة أخرى.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل المستخدمين</h3>
        <p className="text-gray-600">فشل في تحميل قائمة المستخدمين. حاول مرة أخرى.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة المستخدمين</h1>
        <p className="text-gray-600">إدارة حسابات العملاء المسجلين - الأحدث أولاً</p>
      </div>

      {/* Users Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {users.filter(user => {
                    const today = new Date();
                    const userDate = new Date(user.createdAt);
                    return userDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <p className="text-sm text-gray-600">مستخدمين جدد اليوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {users.filter(user => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(user.createdAt) > weekAgo;
                  }).length}
                </div>
                <p className="text-sm text-gray-600">مستخدمين جدد هذا الأسبوع</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مستخدمين</h3>
            <p className="text-gray-600">لم يتم العثور على مستخدمين مسجلين حتى الآن.</p>
          </div>
        ) : (
          users.map((user: any) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.fullName || 'غير محدد'}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        المستخدم #{user.id}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>تاريخ التسجيل: {formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع بياناته بما في ذلك الطلبات والعناوين.')) {
                        deleteUserMutation.mutate(user.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                    title="حذف المستخدم"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">آخر نشاط</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Main Admin Panel Component
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'orders' | 'items' | 'users' | 'drivers' | 'settings'>('orders');
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
    refetchInterval: 1000, // Real-time updates every 1 second for new orders
    staleTime: 0 // Always fetch fresh data
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


  const [currentView, setCurrentView] = useState<'orders' | 'items' | 'settings'>('orders');
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
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  طلبات
                </button>
                <button
                  onClick={() => setActiveTab('items')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'items'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  منتجات
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'users'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  مستخدمين
                </button>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'drivers'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  السواق
                </button>
              </div>
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
      {activeTab === 'users' ? (
        <div className="max-w-7xl mx-auto p-6">
          <UsersManagement />
        </div>
      ) : activeTab === 'drivers' ? (
        <div className="max-w-7xl mx-auto p-6">
          <DriversManagement />
        </div>
      ) : activeTab === 'orders' ? (
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
      ) : activeTab === 'items' ? (
        <div className="max-w-7xl mx-auto p-6">
          <ItemsManagement />
        </div>
      ) : activeTab === 'settings' ? (
        <div className="max-w-7xl mx-auto p-6">
          <SettingsManagement />
        </div>
      ) : null}

      {/* Admin Sidebar */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        setCurrentView={setActiveTab}
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
                          <td className="border border-gray-300 px-2 py-1">{formatPrice(item.price)} د.ع</td>
                          <td className="border border-gray-300 px-2 py-1">{parseFloat(item.quantity)} {item.unit === 'kg' ? 'كيلو' : item.unit === 'piece' ? 'قطعة' : item.unit === 'bunch' ? 'حزمة' : item.unit}</td>
                          <td className="border border-gray-300 px-2 py-1 font-medium">
                            {formatPrice(parseFloat(item.price) * parseFloat(item.quantity))} د.ع
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
                  <span>{formatPrice(selectedOrder.totalAmount)} د.ع</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>رسوم التوصيل:</span>
                  <span>{formatPrice(currentSettings?.delivery_fee || 3500)} د.ع</span>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>المجموع الكلي:</span>
                    <span className="text-green-600">{formatPrice(selectedOrder.totalAmount + (currentSettings?.delivery_fee || 3500))} د.ع</span>
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