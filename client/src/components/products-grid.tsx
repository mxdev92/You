import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Category } from "@shared/schema";
import { getProducts, Product, initializeSampleProducts } from "@/lib/firebase";
import ProductCard from "./product-card";

export default function ProductsGrid() {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const selectedCategory = categories?.find(cat => cat.isSelected);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["firebase-products", selectedCategory?.id],
    queryFn: async () => {
      const allProducts = await getProducts();
      // If no products exist, initialize sample products
      if (allProducts.length === 0) {
        await initializeSampleProducts();
        // Fetch products again after initialization
        const newProducts = await getProducts();
        return newProducts.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
      }
      // Sort by displayOrder (position) - lower numbers first
      return allProducts.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
    },
  });

  return (
    <section className="px-4 py-6">

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-32 md:h-40 bg-gray-200 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {products?.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && products?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      )}
    </section>
  );
}
