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

// Firebase imports
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
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
  createdAt: Date;
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
        title: "تم إضافة المنتج",
        description: "تم إضافة المنتج بنجاح إلى Firebase",
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المنتج",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            إضافة منتج جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المنتج *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="مثال: تفاح أحمر"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المنتج..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">السعر *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">الوحدة</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">كيلو</SelectItem>
                  <SelectItem value="piece">قطعة</SelectItem>
                  <SelectItem value="liter">لتر</SelectItem>
                  <SelectItem value="box">علبة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">الفئة</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">صورة المنتج</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            {formData.imageUrl && (
              <div className="mt-2">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  حفظ المنتج
                </>
              )}
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
  onUpdate: (id: string, updates: Partial<Product>) => void;
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
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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
      await onUpdate(product.id, {
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
        title: "تم تحديث المنتج",
        description: "تم تحديث المنتج بنجاح في Firebase",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            تعديل المنتج
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">اسم المنتج *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="مثال: تفاح أحمر"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">الوصف</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المنتج..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">السعر *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">الوحدة</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">كيلو</SelectItem>
                  <SelectItem value="piece">قطعة</SelectItem>
                  <SelectItem value="liter">لتر</SelectItem>
                  <SelectItem value="box">علبة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">الفئة</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-image">صورة المنتج</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            {formData.imageUrl && (
              <div className="mt-2">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  تحديث المنتج
                </>
              )}
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
  onDelete, 
  onToggleAvailability 
}: { 
  product: Product; 
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, available: boolean) => void;
}) {
  const categoryInfo = categories.find(cat => cat.id === product.category);
  const IconComponent = categoryInfo?.icon || Package;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Product Image */}
          <div className="relative">
            <img 
              src={product.imageUrl || '/api/placeholder/60/60'} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg border"
            />
            <div className="absolute -top-1 -right-1">
              <IconComponent className="h-4 w-4 text-gray-500 bg-white rounded-full p-0.5" />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-semibold text-green-600">
                    {product.price.toFixed(2)} د.ع
                  </span>
                  <span className="text-sm text-gray-400">/ {product.unit}</span>
                  <Badge variant={product.available ? "default" : "secondary"} className="text-xs">
                    {product.available ? "متوفر" : "غير متوفر"}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(product)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleAvailability(product.id, !product.available)}
                  className="h-8 w-8 p-0"
                >
                  <Package className={`h-4 w-4 ${product.available ? 'text-orange-600' : 'text-green-600'}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(product.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Items Management Component
export default function ItemsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Real-time Firebase listener
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        productsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Product);
      });
      
      setProducts(productsData);
      setLoading(false);
      console.log('Firebase Real-time: Products updated', productsData.length);
    }, (error) => {
      console.error('Firebase listener error:', error);
      setLoading(false);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء تحميل البيانات من Firebase",
        variant: "destructive"
      });
    });

    return () => unsubscribe();
  }, [toast]);

  // Filter products based on category and search
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  // Add new product to Firebase
  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: new Date()
      });
      console.log('Product added to Firebase successfully');
    } catch (error) {
      console.error('Error adding product to Firebase:', error);
      throw error;
    }
  };

  // Update product in Firebase
  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), updates);
      console.log('Product updated in Firebase successfully');
    } catch (error) {
      console.error('Error updating product in Firebase:', error);
      throw error;
    }
  };

  // Delete product from Firebase
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', id));
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج بنجاح من Firebase",
      });
    } catch (error) {
      console.error('Error deleting product from Firebase:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المنتج",
        variant: "destructive"
      });
    }
  };

  // Toggle product availability
  const handleToggleAvailability = async (id: string, available: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { available });
      toast({
        title: available ? "تم تفعيل المنتج" : "تم إلغاء تفعيل المنتج",
        description: `تم ${available ? 'تفعيل' : 'إلغاء تفعيل'} المنتج بنجاح`,
      });
    } catch (error) {
      console.error('Error updating product availability:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة المنتج",
        variant: "destructive"
      });
    }
  };

  // Open edit modal
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  // Calculate category counts
  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: products.filter(p => p.category === cat.id).length
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المنتجات من Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold text-gray-900">إدارة المنتجات</h1>
            <Badge variant="secondary" className="ml-2">
              {filteredProducts.length} منتج
            </Badge>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث في المنتجات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="whitespace-nowrap"
          >
            الكل ({products.length})
          </Button>
          {categoryCounts.map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                <IconComponent className="h-4 w-4 mr-1" />
                {category.name} ({category.count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Products List */}
      <div className="px-4 pb-4">
        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'لم يتم العثور على منتجات تطابق البحث أو الفئة المحددة'
                : 'ابدأ بإضافة منتجات جديدة إلى متجرك'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                إضافة أول منتج
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProduct}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onUpdate={handleUpdateProduct}
      />
    </div>
  );
}