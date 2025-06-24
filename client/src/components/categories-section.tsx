import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Apple, Carrot, Milk, Cookie, Fish, Beef } from "lucide-react";
import type { Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function CategoriesSection() {
  const queryClient = useQueryClient();
  
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const handleCategorySelect = (categoryId: number) => {
    selectCategoryMutation.mutate(categoryId);
  };

  if (isLoading) {
    return (
      <section className="px-4 py-6 bg-white">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 text-center min-w-16">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-6 bg-white">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 text-center min-w-16"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategorySelect(category.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 cursor-pointer transition-colors duration-200 ${
                category.isSelected
                  ? "bg-fresh-green bg-opacity-20"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {(() => {
                const IconComponent = iconMap[category.icon];
                return IconComponent ? (
                  <IconComponent className={`w-5 h-5 ${
                    category.isSelected ? "text-fresh-green" : "text-gray-600"
                  }`} />
                ) : (
                  <Apple className={`w-5 h-5 ${
                    category.isSelected ? "text-fresh-green" : "text-gray-600"
                  }`} />
                );
              })()}
            </motion.div>
            <span className="text-xs font-medium text-gray-700">{category.name}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
