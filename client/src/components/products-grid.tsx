import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@shared/schema";
import ProductCard from "./product-card";
import { useCategoryStore } from "@/store/category-store";
import { useRef, useEffect, useState } from "react";

function ShimmerCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="h-32 md:h-40 relative overflow-hidden bg-gray-100">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-100 rounded relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-2/3 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="h-8 bg-gray-100 rounded relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsGrid() {
  const { selectedCategoryId } = useCategoryStore();
  const hasMounted = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevCategoryRef = useRef(selectedCategoryId);

  const { data: products, isLoading, isFetching } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategoryId],
    queryFn: async () => {
      const response = await fetch(`/api/products?categoryId=${selectedCategoryId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (prevCategoryRef.current !== selectedCategoryId) {
      setIsTransitioning(true);
      prevCategoryRef.current = selectedCategoryId;
      const timer = setTimeout(() => setIsTransitioning(false), 150);
      return () => clearTimeout(timer);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const showShimmer = isLoading && !products;

  return (
    <section className="px-4 py-6">
      {showShimmer ? (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <ShimmerCard key={index} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategoryId}
            className="grid grid-cols-3 gap-3 md:gap-4"
            initial={hasMounted.current ? { opacity: 0.7 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.7 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {products?.map((product, index) => (
              <motion.div
                key={product.id}
                initial={!hasMounted.current ? { opacity: 0, scale: 0.95 } : false}
                animate={{ 
                  opacity: isTransitioning ? 0.8 : 1, 
                  scale: 1,
                }}
                transition={{ 
                  duration: 0.15, 
                  delay: !hasMounted.current ? index * 0.02 : 0,
                  ease: "easeOut"
                }}
                className="transform-gpu"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {!isLoading && products?.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-gray-500">No products found in this category.</p>
        </motion.div>
      )}
    </section>
  );
}
