import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "@/hooks/use-translation";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-gray-700">
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{t('language')}</span>
      </div>
      
      <div className="space-y-2">
        <Button
          variant={language === 'en' ? 'default' : 'outline'}
          className={`w-full justify-start ${
            language === 'en' 
              ? 'bg-fresh-green hover:bg-fresh-green-dark text-white' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setLanguage('en')}
        >
          {t('english')}
        </Button>
        
        <Button
          variant={language === 'ar' ? 'default' : 'outline'}
          className={`w-full justify-start ${
            language === 'ar' 
              ? 'bg-fresh-green hover:bg-fresh-green-dark text-white' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setLanguage('ar')}
        >
          {t('arabic')}
        </Button>
      </div>
    </div>
  );
}