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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/categories"] });
      await queryClient.cancelQueries({ queryKey: ["/api/products"] });

      // Snapshot the previous values
      const previousCategories = queryClient.getQueryData<Category[]>(["/api/categories"]);
      
      // Optimistically update categories
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
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const handleCategorySelect = (categoryId: number) => {
    selectCategoryMutation.mutate(categoryId);
  };

  if (isLoading) {
    return (
      <section className="px-4 py-0.5">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-0.5 touch-action-pan-x">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 flex flex-col items-center min-w-14">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse mb-0.5" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-0.5">
      <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-0.5 touch-action-pan-x">
        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 flex flex-col items-center min-w-14"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategorySelect(category.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 cursor-pointer transition-all duration-200 relative touch-action-manipulation min-h-10 min-w-10 ${
                category.isSelected
                  ? "bg-fresh-green text-white shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              {(() => {
                const IconComponent = iconMap[category.icon];
                return IconComponent ? (
                  <IconComponent className={`w-3.5 h-3.5 ${
                    category.isSelected ? "text-white" : "text-gray-600"
                  }`} />
                ) : (
                  <Apple className={`w-3.5 h-3.5 ${
                    category.isSelected ? "text-white" : "text-gray-600"
                  }`} />
                );
              })()}
            </motion.div>
            <span className="text-[10px] font-medium text-gray-700 text-center w-full">
              {t(getCategoryTranslationKey(category.name))}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
