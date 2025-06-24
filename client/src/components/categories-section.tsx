import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function CategoriesSection() {
  const queryClient = useQueryClient();
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 text-center min-w-20">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-6 bg-white">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 text-center min-w-20"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategorySelect(category.id)}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 cursor-pointer transition-colors duration-200 ${
                category.isSelected
                  ? "bg-fresh-green bg-opacity-20"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <i className={`${category.icon} text-xl ${
                category.isSelected ? "text-fresh-green" : "text-gray-600"
              }`} />
            </motion.div>
            <span className="text-xs font-medium text-gray-700">{category.name}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
