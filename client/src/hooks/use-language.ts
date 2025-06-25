import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageStore {
  language: 'en' | 'ar';
  setLanguage: (language: 'en' | 'ar') => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => {
        set({ language });
        // Update document language and direction
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
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
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
};