import { create } from 'zustand';
import type { Product } from '@shared/schema';

interface CategoryStore {
  selectedCategoryId: number;
  productsByCategory: Record<number, Product[]>;
  allProductsLoaded: boolean;
  setSelectedCategory: (categoryId: number) => void;
  setProductsForCategory: (categoryId: number, products: Product[]) => void;
  setAllProducts: (products: Product[]) => void;
  getProductsForCategory: (categoryId: number) => Product[];
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  selectedCategoryId: 2,
  productsByCategory: {},
  allProductsLoaded: false,
  
  setSelectedCategory: (categoryId: number) => set({ selectedCategoryId: categoryId }),
  
  setProductsForCategory: (categoryId: number, products: Product[]) => 
    set((state) => ({
      productsByCategory: {
        ...state.productsByCategory,
        [categoryId]: products
      }
    })),
  
  setAllProducts: (products: Product[]) => {
    const grouped: Record<number, Product[]> = {};
    products.forEach(product => {
      const catId = product.categoryId ?? 0;
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push(product);
    });
    set({ productsByCategory: grouped, allProductsLoaded: true });
  },
  
  getProductsForCategory: (categoryId: number) => {
    return get().productsByCategory[categoryId] || [];
  }
}));
