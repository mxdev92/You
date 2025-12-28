import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import ProductCard from "./product-card";
import { useCategoryStore } from "@/store/category-store";
import { useEffect } from "react";

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
  const { selectedCategoryId, productsByCategory, allProductsLoaded, setAllProducts } = useCategoryStore();

  // Load ALL products once - enables instant switching
  const { isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/all"],
    queryFn: async () => {
      const response = await fetch("/api/products", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      const products = await response.json();
      setAllProducts(products);
      return products;
    },
    staleTime: 300000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    enabled: !allProductsLoaded,
  });

  // Get products INSTANTLY from memory - no animation delay
  const products = productsByCategory[selectedCategoryId] || [];
  const showShimmer = isLoading && !allProductsLoaded;

  if (showShimmer) {
    return (
      <section className="px-4 py-6">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <ShimmerCard key={index} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-6">
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {products.map((product) => (
          <div key={product.id} className="transform-gpu">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {allProductsLoaded && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      )}
    </section>
  );
}
