import { create } from 'zustand';

interface AppState {
  searchQuery: string;
  selectedCategoryId: number | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: '',
  selectedCategoryId: 2, // Default to Vegetables category (ID: 2)
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
}));
