import { create } from 'zustand';

interface AppState {
  searchQuery: string;
  selectedCategoryId: number | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: '',
  selectedCategoryId: 6, // Default to Meat category (ID: 6)
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
}));
