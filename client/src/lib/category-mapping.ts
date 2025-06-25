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

// Map product names to translation keys
export const productNameToKey: Record<string, TranslationKey> = {
  'Organic Apples': 'organicApples',
  'Fresh Bananas': 'freshBananas',
  'Oranges': 'oranges',
  'Fresh Spinach': 'freshSpinach',
  'Broccoli': 'broccoli',
  'Carrots': 'carrots',
  'Whole Milk': 'wholeMilk',
  'Cheese': 'cheese',
  'Yogurt': 'yogurt',
  'Whole Grain Bread': 'wholeGrainBread',
  'Croissants': 'croissants',
  'Cookies': 'cookies',
  'Salmon Fillet': 'salmonFillet',
  'Shrimp': 'shrimp',
  'Tuna': 'tuna',
};

// Get translation key for category name
export const getCategoryTranslationKey = (categoryName: string): TranslationKey => {
  return categoryNameToKey[categoryName] || 'fruits';
};

// Get translation key for product name
export const getProductTranslationKey = (productName: string): TranslationKey => {
  return productNameToKey[productName] || 'organicApples';
};