import { useQuery } from "@tanstack/react-query";

import type { Product, Category } from "@shared/schema";
import ProductCard from "./product-card";

export default function ProductsGrid() {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const selectedCategory = categories?.find(cat => cat.isSelected);

  const { data: products, isLoading, isFetching } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory?.id],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/products?categoryId=${selectedCategory.id}`
        : "/api/products";
      
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    staleTime: 2000, // Cache for 2 seconds 
    refetchInterval: 5000, // Auto-refetch every 5 seconds for real-time updates
    placeholderData: (previousData) => previousData, // Keep showing previous data while loading new
  });

  return (
    <section className="px-4 py-6">
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {/* Show existing products immediately */}
        {products?.map((product, index) => (
          <div key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
        
        {/* Show skeleton placeholders only when initially loading */}
        {isLoading && !products && Array.from({ length: 6 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="h-32 md:h-40 bg-gray-100" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {!isLoading && products?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      )}
    </section>
  );
}
