import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Apple, Carrot, Milk, Cookie, Fish, Beef, Cherry, Banana, CircleDot, Circle, Leaf } from "lucide-react";
import type { Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";
import { getCategoryTranslationKey } from "@/lib/category-mapping";
import { useEffect, useRef } from "react";

export default function CategoriesSection() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const hasInitialized = useRef(false);
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000, // Cache categories for 5 minutes for ultra-fast performance
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
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
    // Custom tomato icon using Circle with red fill
    Tomato: ({ className }: { className?: string }) => (
      <Circle className={className} fill="currentColor" />
    ),
  };

  const selectCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await apiRequest("PATCH", `/api/categories/${categoryId}/select`);
      return response.json();
    },
    onMutate: async (categoryId: number) => {
      // Cancel any outgoing queries
      await queryClient.cancelQueries({ queryKey: ["/api/categories"] });
      
      // Optimistically update the UI immediately
      const previousCategories = queryClient.getQueryData<Category[]>(["/api/categories"]);
      
      if (previousCategories) {
        const updatedCategories = previousCategories.map(cat => ({
          ...cat,
          isSelected: cat.id === categoryId
        }));
        queryClient.setQueryData(["/api/categories"], updatedCategories);
      }
      
      return { previousCategories };
    },
    onError: (err, categoryId, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(["/api/categories"], context.previousCategories);
      }
    },
    onSuccess: () => {
      // Immediately trigger product fetch with background update
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  // Auto-select خضروات (Vegetables) category on app startup
  useEffect(() => {
    if (!hasInitialized.current && categories && categories.length > 0) {
      hasInitialized.current = true;
      
      // Always ensure خضروات (Vegetables - ID: 2) is selected on startup
      const vegetablesCategory = categories.find(cat => cat.id === 2);
      const isVegetablesSelected = vegetablesCategory?.isSelected;
      
      if (vegetablesCategory && !isVegetablesSelected) {
        console.log('🥬 Auto-selecting خضروات (Vegetables) category on startup');
        selectCategoryMutation.mutate(2);
      } else if (isVegetablesSelected) {
        console.log('🥬 خضروات (Vegetables) category already selected');
      }
    }
  }, [categories, selectCategoryMutation]);

  const handleCategorySelect = (categoryId: number) => {
    selectCategoryMutation.mutate(categoryId);
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
        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className="flex-shrink-0 flex flex-col items-center justify-center min-w-16 w-16 h-16"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              onClick={() => handleCategorySelect(category.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-0.5 cursor-pointer transition-all duration-100 relative touch-action-manipulation min-h-12 min-w-12 ${
                category.isSelected
                  ? "shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
              }`}
              style={category.isSelected ? { backgroundColor: '#22c55e' } : {}}
            >
              {(() => {
                const IconComponent = iconMap[category.icon];
                return IconComponent ? (
                  <IconComponent className={`w-4 h-4 ${
                    category.isSelected ? "text-white" : "text-gray-600"
                  }`} />
                ) : (
                  <Apple className={`w-4 h-4 ${
                    category.isSelected ? "text-white" : "text-gray-600"
                  }`} />
                );
              })()}
            </motion.div>
            <span className={`text-[10px] font-medium text-center w-full leading-tight flex items-center justify-center ${
              category.isSelected ? "text-black" : "text-gray-700"
            }`}>
              {t(getCategoryTranslationKey(category.name))}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
