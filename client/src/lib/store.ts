import { create } from 'zustand';

interface AppState {
  searchQuery: string;
  selectedCategoryId: number | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: '',
  selectedCategoryId: null,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
}));
