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

// Map product names to translation keys (based on actual products in database)
export const productNameToKey: Record<string, TranslationKey> = {
  'Organic Apples': 'organicApples',
  'Fresh Spinach': 'freshSpinach',
  'Bell Peppers': 'bellPeppers',
  'Fresh Carrots': 'freshCarrots',
  'Strawberries': 'strawberries',
  'Russet Potatoes': 'russetPotatoes',
  'Whole Milk': 'wholeMilk',
  'Salmon Fillet': 'salmonFillet',
  'Greek Yogurt': 'greekYogurt',
  'Bananas': 'bananas',
  'Whole Grain Bread': 'wholeGrainBread',
  'Fresh Tomatoes': 'freshTomatoes',
};

// Get translation key for category name
export const getCategoryTranslationKey = (categoryName: string): TranslationKey => {
  return categoryNameToKey[categoryName] || 'fruits';
};

// Get translation key for product name
export const getProductTranslationKey = (productName: string): TranslationKey => {
  // Return the mapped key if it exists, otherwise return the original name as a fallback
  const mappedKey = productNameToKey[productName];
  if (mappedKey) {
    return mappedKey;
  }
  
  // For unknown products, return a generic key or the original name
  console.warn(`No translation found for product: ${productName}`);
  return 'organicApples'; // This should be improved to return the original name
};