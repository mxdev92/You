import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import type { Product, Category } from "@shared/schema";
import ProductCard from "./product-card";

export default function ProgressiveProductsGrid() {
  const [visibleRows, setVisibleRows] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000, // Cache categories for 5 minutes
  });

  const selectedCategory = categories?.find(c => c.selected);
  const categoryId = selectedCategory?.id || 2; // Default to vegetables

  const { data: products, isLoading, isSuccess } = useQuery<Product[]>({
    queryKey: ["/api/products", categoryId],
    staleTime: 30000,
  });

  // Reset animation when products change
  useEffect(() => {
    if (isSuccess && products) {
      setVisibleRows(0);
      setAnimationKey(prev => prev + 1);
      
      // Progressive reveal: Show 2 rows at a time every 200ms
      const totalRows = Math.ceil(products.length / 3);
      const showRowsProgressively = () => {
        setVisibleRows(prev => {
          const nextVisible = prev + 2; // Show 2 rows at a time
          if (nextVisible < totalRows) {
            setTimeout(showRowsProgressively, 200); // 200ms between batches
          }
          return Math.min(nextVisible, totalRows);
        });
      };
      
      // Start showing rows immediately
      setTimeout(showRowsProgressively, 50);
    }
  }, [isSuccess, products, categoryId]);

  const visibleProducts = products?.slice(0, visibleRows * 3) || [];

  return (
    <section className="px-4 py-6">
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, index) => {
            const rowIndex = Math.floor(index / 3);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: rowIndex * 0.1,
                  duration: 0.3,
                  ease: "easeOut"
                }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="h-32 md:h-40 bg-gray-200 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {visibleProducts.map((product, index) => {
            const rowIndex = Math.floor(index / 3);
            
            return (
              <motion.div
                key={`${animationKey}-${product.id}`}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: (rowIndex % 2) * 0.05, // Stagger within each 2-row batch
                  duration: 0.25,
                  ease: "easeOut"
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            );
          })}
          
          {/* Loading indicator for remaining items */}
          {products && visibleProducts.length < products.length && (
            <div className="col-span-3 flex justify-center py-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-gray-500"
              >
                <div className="w-4 h-4 bg-fresh-green rounded-full animate-pulse"></div>
                <span className="text-sm">تحميل المزيد...</span>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}