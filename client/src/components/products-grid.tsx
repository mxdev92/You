import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Product } from "@shared/schema";
import ProductCard from "./product-card";
import { useCategoryStore } from "@/store/category-store";

export default function ProductsGrid() {
  const { selectedCategoryId } = useCategoryStore();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategoryId],
    queryFn: async () => {
      const response = await fetch(`/api/products?categoryId=${selectedCategoryId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    staleTime: 60000, // Products stay fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // INSTANT: Keep previous data while loading
  });

  return (
    <section className="px-4 py-6">

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-32 md:h-40 bg-gray-200 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-3 gap-3 md:gap-4"
          layout
          transition={{ duration: 0.2 }}
        >
          {products?.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
              layoutId={`product-${product.id}`}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
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
