import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Apple, Carrot, Milk, Cookie, Fish, Beef, Cherry, Banana, CircleDot, Circle, Leaf, Droplets, Wheat } from "lucide-react";
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
    Cherry,
    Banana,
    CircleDot,
    Circle,
    Leaf,
    Droplets,
    Wheat,
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
      // Only refetch products, not categories to maintain UI stability
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
    <section className="px-4 py-2">
      <div className="flex justify-center space-x-4 max-w-xs mx-auto">
        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategorySelect(category.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 cursor-pointer transition-all duration-300 relative shadow-sm ${
                category.isSelected
                  ? "shadow-md transform scale-105"
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 hover:shadow-md"
              }`}
              style={category.isSelected ? { backgroundColor: '#22c55e' } : {}}
            >
              {(() => {
                const IconComponent = iconMap[category.icon];
                return IconComponent ? (
                  <IconComponent className={`w-5 h-5 ${
                    category.isSelected ? "text-white" : "text-gray-600"
                  }`} />
                ) : (
                  <Apple className={`w-5 h-5 ${
                    category.isSelected ? "text-white" : "text-gray-600"
                  }`} />
                );
              })()}
            </motion.div>
            <span className={`text-[10px] font-medium text-center leading-tight ${
              category.isSelected ? "text-black font-semibold" : "text-gray-700"
            }`}>
              {category.name}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
