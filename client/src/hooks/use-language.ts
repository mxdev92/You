import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageStore {
  language: 'en' | 'ar';
  setLanguage: (language: 'en' | 'ar') => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'ar',
      setLanguage: (language) => {
        set({ language });
        // Update document language but keep UI direction as LTR
        document.documentElement.lang = language;
        // Don't change document direction - keep UI as LTR
      },
    }),
    {
      name: 'kiwiq-language',
    }
  )
);

// Initialize language on app start
export const initializeLanguage = () => {
  const { language } = useLanguage.getState();
  document.documentElement.lang = language;
  // Keep UI direction as LTR regardless of language
  document.documentElement.dir = 'ltr';
};