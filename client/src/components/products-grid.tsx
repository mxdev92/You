import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Product, Category } from "@shared/schema";
import ProductCard from "./product-card";
import { ProductGridSkeleton } from "./loading-fallback";
import { CACHE_CONFIGS } from "../lib/instant-loading-optimizer";

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
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  return (
    <section className="px-4 py-6">
      {/* Show skeleton only on initial load */}
      {isLoading && !products?.length ? (
        <ProductGridSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {/* Subtle loading indicator for background updates */}
          {isFetching && products && (
            <div className="col-span-3 text-center py-1">
              <div className="inline-flex items-center text-xs text-gray-400">
                <div className="w-2 h-2 border border-gray-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                تحديث...
              </div>
            </div>
          )}
          
          {/* Render products without complex animations that break layout */}
          {products?.map((product: Product) => (
            <div key={product.id} className="w-full">
              <ProductCard product={product} />
            </div>
          )) || []}
        </div>
      )}

      {!isLoading && products?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      )}
    </section>
  );
}
