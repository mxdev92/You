import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Apple, Carrot, Milk, Cookie, Fish, Beef, Cherry, Banana, CircleDot, Circle, Leaf } from "lucide-react";
import type { Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";
import { getCategoryTranslationKey } from "@/lib/category-mapping";
import { useEffect, useRef } from "react";
import { useCategoryStore } from "@/store/category-store";

export default function CategoriesSection() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const hasInitialized = useRef(false);
  const hasMounted = useRef(false);
  const { selectedCategoryId, setSelectedCategory } = useCategoryStore();
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Apple,
    Carrot,
    Milk,
    Cookie,
    Fish,
    Beef,
    Cherry,
    Banana,
    CircleDot,
    Circle,
    Leaf,
    Tomato: ({ className }: { className?: string }) => (
      <Circle className={className} fill="currentColor" />
    ),
  };

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  useEffect(() => {
    if (!hasInitialized.current && categories && categories.length > 0) {
      hasInitialized.current = true;
      const serverSelected = categories.find(cat => cat.isSelected);
      if (serverSelected) {
        setSelectedCategory(serverSelected.id);
      } else if (!selectedCategoryId) {
        setSelectedCategory(2);
      }
    }
  }, [categories, selectedCategoryId, setSelectedCategory]);

  const prefetchCategory = (categoryId: number) => {
    queryClient.prefetchQuery({
      queryKey: ["/api/products", categoryId],
      queryFn: async () => {
        const response = await fetch(`/api/products?categoryId=${categoryId}`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch products");
        return response.json();
      },
      staleTime: 60000,
    });
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    apiRequest("PATCH", `/api/categories/${categoryId}/select`).catch(() => {});
    if (categories) {
      const currentIndex = categories.findIndex(c => c.id === categoryId);
      if (currentIndex > 0) prefetchCategory(categories[currentIndex - 1].id);
      if (currentIndex < categories.length - 1) prefetchCategory(categories[currentIndex + 1].id);
    }
  };

  if (isLoading) {
    return (
      <section className="py-0.5">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-0.5 touch-action-pan-x px-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 flex flex-col items-center min-w-14">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mb-0.5" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-0.5">
      <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-0.5 touch-action-pan-x px-4">
        {categories?.map((category, index) => {
          const isSelected = category.id === selectedCategoryId;
          return (
            <motion.div
              key={category.id}
              initial={!hasMounted.current ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: !hasMounted.current ? index * 0.02 : 0, duration: 0.15 }}
              className="flex-shrink-0 flex flex-col items-center justify-center min-w-16 w-16 h-16"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                onClick={() => handleCategorySelect(category.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-0.5 cursor-pointer relative touch-action-manipulation min-h-12 min-w-12 transform-gpu transition-colors duration-200 ${
                  isSelected
                    ? "shadow-lg bg-green-500"
                    : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                {(() => {
                  const IconComponent = iconMap[category.icon];
                  return IconComponent ? (
                    <IconComponent className={`w-4 h-4 transition-colors duration-200 ${
                      isSelected ? "text-white" : "text-gray-600"
                    }`} />
                  ) : (
                    <Apple className={`w-4 h-4 transition-colors duration-200 ${
                      isSelected ? "text-white" : "text-gray-600"
                    }`} />
                  );
                })()}
              </motion.div>
              <span className={`text-[10px] font-medium text-center w-full leading-tight flex items-center justify-center transition-colors duration-200 ${
                isSelected ? "text-green-600 font-semibold" : "text-gray-700"
              }`}>
                {t(getCategoryTranslationKey(category.name))}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
