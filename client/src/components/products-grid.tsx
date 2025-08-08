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
    ...CACHE_CONFIGS.products,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  return (
    <section className="px-4 py-6">
      {/* Show skeleton only on true loading state */}
      {isLoading && !products?.length ? (
        <ProductGridSkeleton />
      ) : (
        <motion.div 
          className="grid grid-cols-3 gap-3 md:gap-4"
          layout
          transition={{ duration: 0.1 }}
        >
          {/* Subtle loading indicator for background updates */}
          {isFetching && products && (
            <div className="col-span-3 text-center py-1">
              <div className="inline-flex items-center text-xs text-gray-400">
                <div className="w-2 h-2 border border-gray-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                تحديث...
              </div>
            </div>
          )}
          
          {products?.map((product: Product, index: number) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ 
                delay: Math.min(index * 0.005, 0.1), // Minimal stagger
                duration: 0.1, // Ultra-fast
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          )) || []}
        </motion.div>
      )}

      {!isLoading && products?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      )}
    </section>
  );
}
