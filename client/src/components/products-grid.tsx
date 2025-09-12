import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Product, Category } from "@shared/schema";
import ProductCard from "./product-card";

export default function ProductsGrid() {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const selectedCategory = categories?.find(cat => cat.isSelected);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory?.id || 2],
    queryFn: async () => {
      const categoryId = selectedCategory?.id || 2; // Default to vegetables (ID: 2)
      const url = `/api/products?categoryId=${categoryId}`;
      
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    staleTime: 30000, // Cache products for 30 seconds for faster switching
    refetchInterval: 5000, // Reduced refetch to 5 seconds for better performance
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on focus
    placeholderData: (previousData) => previousData, // Keep previous data while loading new category
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
