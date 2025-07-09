import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Product, Category } from "@shared/schema";
import ProductCard from "./product-card";

export default function ProductsGrid() {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000, // Cache categories for 5 minutes
  });

  const selectedCategory = categories?.find(cat => cat.isSelected);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory?.id],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/products?categoryId=${selectedCategory.id}`
        : "/api/products";
      
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds - much faster loading
    refetchInterval: false, // Disable auto-refresh for better performance
  });

  return (
    <section className="px-4 py-6">

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 9 }).map((_, index) => {
            // Progressive skeleton loading: 2 rows appear progressively
            const rowIndex = Math.floor(index / 3);
            const rowDelay = `${rowIndex * 0.1}s`;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: rowIndex * 0.1,
                  duration: 0.2,
                  ease: "easeOut"
                }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="h-32 md:h-40 bg-gray-200 animate-pulse" style={{ animationDuration: '0.6s', animationDelay: rowDelay }} />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ animationDuration: '0.6s', animationDelay: rowDelay }} />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" style={{ animationDuration: '0.6s', animationDelay: `${rowIndex * 0.1 + 0.05}s` }} />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" style={{ animationDuration: '0.6s', animationDelay: `${rowIndex * 0.1 + 0.1}s` }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {products?.map((product, index) => {
            // Calculate which row this item is in (3 items per row)
            const rowIndex = Math.floor(index / 3);
            // Progressive loading: each row appears 0.1s after the previous
            const rowDelay = rowIndex * 0.1;
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: rowDelay, 
                  duration: 0.15,
                  ease: "easeOut"
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            );
          })}
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
