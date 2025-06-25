import { useLanguage } from './use-language';
import { translations, TranslationKey } from '../lib/translations';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key: TranslationKey, replacements?: Record<string, string>): string => {
    let text = translations[language][key] || translations.en[key] || key;
    
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(`{${placeholder}}`, value);
      });
    }
    
    return text;
  };
  
  return { t, language };
};