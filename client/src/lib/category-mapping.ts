import { TranslationKey } from './translations';

// Map category names to translation keys
export const categoryNameToKey: Record<string, TranslationKey> = {
  'Fruits': 'fruits',
  'Vegetables': 'vegetables',
  'Dairy': 'dairy',
  'Bakery': 'bakery',
  'Seafood': 'seafood',
  'Meat': 'meat',
  'Beverages': 'beverages',
  'Snacks': 'snacks',
  'Frozen': 'frozen',
  'Pantry': 'pantry',
};

// Get translation key for category name
export const getCategoryTranslationKey = (categoryName: string): TranslationKey => {
  return categoryNameToKey[categoryName] || 'fruits';
};