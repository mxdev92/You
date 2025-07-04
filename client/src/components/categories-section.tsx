import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Apple, Carrot, Milk, Cookie, Fish, Beef } from "lucide-react";
import type { Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";
import { getCategoryTranslationKey } from "@/lib/category-mapping";

export default function CategoriesSection() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 60000, // Cache categories for 1 minute for faster performance
  });

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Apple,
    Carrot,
    Milk,
    Cookie,
    Fish,
    Beef,
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
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const handleCategorySelect = (categoryId: number) => {
    // Prevent multiple rapid clicks
    if (selectCategoryMutation.isPending) return;
    selectCategoryMutation.mutate(categoryId);
  };

  if (isLoading) {
    return (
      <section className="px-4 py-2">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-1 touch-action-pan-x">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 flex flex-col items-center min-w-16">
              <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse mb-2 shadow-sm" />
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-2">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-1 touch-action-pan-x">
        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 flex flex-col items-center min-w-16"
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleCategorySelect(category.id)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 cursor-pointer transition-all duration-300 relative touch-action-manipulation min-h-14 min-w-14 shadow-sm border ${
                category.isSelected
                  ? "shadow-lg border-yellow-400 ring-2 ring-yellow-300 ring-opacity-50"
                  : "bg-white hover:bg-gray-50 active:bg-gray-100 border-gray-200 hover:shadow-md"
              }`}
              style={category.isSelected ? { backgroundColor: '#FFC800' } : {}}
            >
              {(() => {
                const IconComponent = iconMap[category.icon];
                return IconComponent ? (
                  <IconComponent className={`w-7 h-7 ${
                    category.isSelected ? "text-black" : "text-gray-600"
                  }`} />
                ) : (
                  <Apple className={`w-7 h-7 ${
                    category.isSelected ? "text-black" : "text-gray-600"
                  }`} />
                );
              })()}
              
              {/* Professional highlight dot for selected state */}
              {category.isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </motion.div>
              )}
            </motion.div>
            <span className="text-xs font-medium text-gray-800 text-center w-full leading-tight">
              {t(getCategoryTranslationKey(category.name))}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
