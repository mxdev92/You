import { useQuery } from "@tanstack/react-query";
import { Apple, Carrot, Milk, Cookie, Fish, Beef, Cherry, Banana, CircleDot, Circle, Leaf } from "lucide-react";
import type { Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";
import { getCategoryTranslationKey } from "@/lib/category-mapping";
import { useEffect, useRef } from "react";
import { useCategoryStore } from "@/store/category-store";

export default function CategoriesSection() {
  const { t } = useTranslation();
  const hasInitialized = useRef(false);
  const { selectedCategoryId, setSelectedCategory } = useCategoryStore();
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Apple, Carrot, Milk, Cookie, Fish, Beef, Cherry, Banana, CircleDot, Circle, Leaf,
    Tomato: ({ className }: { className?: string }) => (
      <Circle className={className} fill="currentColor" />
    ),
  };

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

  // INSTANT - pure local state, fire-and-forget background sync
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    // Non-blocking background sync
    requestAnimationFrame(() => {
      apiRequest("PATCH", `/api/categories/${categoryId}/select`).catch(() => {});
    });
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
        {categories?.map((category) => {
          const isSelected = category.id === selectedCategoryId;
          const IconComponent = iconMap[category.icon] || Apple;
          return (
            <div
              key={category.id}
              className="flex-shrink-0 flex flex-col items-center justify-center min-w-16 w-16 h-16"
            >
              <div
                onClick={() => handleCategorySelect(category.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-0.5 cursor-pointer touch-action-manipulation select-none ${
                  isSelected
                    ? "shadow-lg bg-green-500"
                    : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-600"}`} />
              </div>
              <span className={`text-[10px] font-medium text-center w-full leading-tight select-none ${
                isSelected ? "text-green-600 font-semibold" : "text-gray-700"
              }`}>
                {t(getCategoryTranslationKey(category.name))}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
