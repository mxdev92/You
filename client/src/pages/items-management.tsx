import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, Search, Plus, Edit, Trash2, Upload, Save, X, 
  ArrowLeft, Leaf, Apple, Droplets, Wheat, Beef 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, push, set, remove, onValue, off } from 'firebase/database';

// Types for Firebase Realtime Database
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  imageUrl: string;
  available: boolean;
  displayOrder: number;
  createdAt: number;
}

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  count: number;
}

// Categories configuration
const categories: Category[] = [
  { id: 'vegetables', name: 'خضروات', icon: Leaf, count: 0 },
  { id: 'fruits', name: 'فواكة', icon: Apple, count: 0 },
  { id: 'beverages', name: 'مشروبات', icon: Droplets, count: 0 },
  { id: 'bakery', name: 'مخبوزات', icon: Wheat, count: 0 },
  { id: 'meat', name: 'لحوم', icon: Beef, count: 0 }
];

// Add Product Modal Component
function AddProductModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (product: Omit<Product, 'id' | 'createdAt'>) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    category: 'vegetables',
    imageUrl: '',
    available: true,
    displayOrder: 1
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      await onAdd({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        category: formData.category,
        imageUrl: formData.imageUrl || '/api/placeholder/150/150',
        available: formData.available,
        displayOrder: formData.displayOrder
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        unit: 'kg',
        category: 'vegetables',
        imageUrl: '',
        available: true,
        displayOrder: 1
      });
      setImageFile(null);
      onClose();

      toast({
        title: "نجح",
        description: "تم إضافة المنتج بنجاح",
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المنتج",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
            إضافة منتج جديد
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">صورة المنتج</Label>
            <div className="flex flex-col items-center space-y-3">
              {formData.imageUrl && (
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                />
              )}
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Label 
                  htmlFor="image-upload" 
                  className="cursor-pointer flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">رفع صورة</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم المنتج *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="أدخل اسم المنتج"
              className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              required
            />
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المنتج (اختياري)"
              className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
              rows={3}
            />
          </div>

          {/* Price and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">السعر *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">الوحدة</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">كيلو</SelectItem>
                  <SelectItem value="piece">قطعة</SelectItem>
                  <SelectItem value="box">علبة</SelectItem>
                  <SelectItem value="pack">عبوة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">الفئة</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {uploading ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Product Modal Component
function EditProductModal({ 
  isOpen, 
  onClose, 
  product,
  onUpdate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: Product | null;
  onUpdate: (product: Product) => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    unit: product?.unit || 'kg',
    category: product?.category || 'vegetables',
    imageUrl: product?.imageUrl || '',
    available: product?.available ?? true,
    displayOrder: product?.displayOrder || 1
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        unit: product.unit,
        category: product.category,
        imageUrl: product.imageUrl,
        available: product.available,
        displayOrder: product.displayOrder
      });
    }
  }, [product]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !formData.name || !formData.price) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      await onUpdate({
        ...product,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        category: formData.category,
        imageUrl: formData.imageUrl,
        available: formData.available,
        displayOrder: formData.displayOrder
      });

      onClose();
      toast({
        title: "نجح",
        description: "تم تحديث المنتج بنجاح",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث المنتج",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
            تعديل المنتج
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">صورة المنتج</Label>
            <div className="flex flex-col items-center space-y-3">
              {formData.imageUrl && (
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                />
              )}
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload-edit"
                />
                <Label 
                  htmlFor="image-upload-edit" 
                  className="cursor-pointer flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">تغيير الصورة</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم المنتج *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="أدخل اسم المنتج"
              className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              required
            />
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المنتج (اختياري)"
              className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
              rows={3}
            />
          </div>

          {/* Price and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">السعر *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">الوحدة</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">كيلو</SelectItem>
                  <SelectItem value="piece">قطعة</SelectItem>
                  <SelectItem value="box">علبة</SelectItem>
                  <SelectItem value="pack">عبوة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">الفئة</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {uploading ? 'جارٍ التحديث...' : 'تحديث'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Product Card Component
function ProductCard({ 
  product, 
  onEdit, 
  onDelete 
}: { 
  product: Product; 
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}) {
  const categoryName = categories.find(cat => cat.id === product.category)?.name || 'غير محدد';

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Product Image */}
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/api/placeholder/60/60';
              }}
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {categoryName}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {product.price.toFixed(2)} د.ع
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    / {product.unit}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(product)}
                  className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(product.id)}
                  className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Availability Status */}
            <div className="mt-2">
              <Badge 
                variant={product.available ? "default" : "secondary"}
                className={product.available ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}
              >
                {product.available ? 'متوفر' : 'غير متوفر'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Items Management Component
export default function ItemsManagement() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();

  // Firebase Realtime Database listener for products
  useEffect(() => {
    console.log('Firebase Real-time: Setting up products listener');
    setLoading(true);
    
    const productsRef = ref(database, 'products');
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const productsData: Product[] = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          productsData.push({
            id: key,
            ...data[key]
          });
        });
      }
      
      // Sort by displayOrder
      productsData.sort((a, b) => a.displayOrder - b.displayOrder);
      
      console.log('Firebase Real-time: Products updated', productsData.length);
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error('Firebase Real-time: Error fetching products', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المنتجات",
        variant: "destructive"
      });
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => off(productsRef, 'value', unsubscribe);
  }, [toast]);

  // Firebase CRUD Operations
  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const productsRef = ref(database, 'products');
      const newProductRef = push(productsRef);
      
      await set(newProductRef, {
        ...productData,
        createdAt: Date.now()
      });
      
      console.log('Firebase: Product added successfully');
    } catch (error) {
      console.error('Firebase: Error adding product', error);
      throw error;
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      const productRef = ref(database, `products/${product.id}`);
      const { id, ...updateData } = product;
      
      await set(productRef, updateData);
      
      console.log('Firebase: Product updated successfully');
    } catch (error) {
      console.error('Firebase: Error updating product', error);
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        const productRef = ref(database, `products/${productId}`);
        await remove(productRef);
        
        console.log('Firebase: Product deleted successfully');
        toast({
          title: "نجح",
          description: "تم حذف المنتج بنجاح",
          variant: "default"
        });
      } catch (error) {
        console.error('Firebase: Error deleting product', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف المنتج",
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleAvailability = async (productId: string, available: boolean) => {
    try {
      const productRef = ref(database, `products/${productId}/available`);
      await set(productRef, available);
      
      console.log('Firebase: Product availability updated');
    } catch (error) {
      console.error('Firebase: Error updating availability', error);
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">جارٍ تحميل المنتجات من Firebase...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة المنتجات</h1>
              <p className="text-gray-600 dark:text-gray-400">Firebase Realtime Database</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة منتج
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث عن المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المنتجات</CardTitle>
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{products.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">المنتجات المتوفرة</CardTitle>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">متوفر</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {products.filter(p => p.available).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">المنتجات غير المتوفرة</CardTitle>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">غير متوفر</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {products.filter(p => !p.available).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">لا توجد منتجات</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'لم يتم العثور على منتجات تطابق البحث المحدد'
                  : 'ابدأ بإضافة منتجاتك الأولى إلى Firebase'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProduct}
        />

        <EditProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          product={editingProduct}
          onUpdate={handleUpdateProduct}
        />
      </div>
    </div>
  );
}