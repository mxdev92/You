import { create } from 'zustand';

interface CategoryStore {
  selectedCategoryId: number;
  setSelectedCategory: (categoryId: number) => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  selectedCategoryId: 2, // Default to vegetables (خضروات)
  setSelectedCategory: (categoryId: number) => set({ selectedCategoryId: categoryId }),
}));
