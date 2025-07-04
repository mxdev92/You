import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Apple, Carrot, Milk, Beef, Package2, Package } from 'lucide-react';

export default function AdminItems() {
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
                ? 'text-black border-2 border-gray-300' 
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
                    ? 'text-black border-2 border-gray-300' 
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
                    value={product.available ? 'Available' : 'Unavailable'}
                    onChange={(e) => updateProductAvailability(product.id, e.target.value === 'Available')}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
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
      <div className="bg-white border-t border-gray-200 px-4 py-2 mt-auto">
        <p className="text-center text-xs text-gray-500">
          This app was built by MX 2025 • mxdev92@gmail.com
        </p>
      </div>
    </div>
  );
}