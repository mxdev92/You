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
  'مشروبات': 'beverages',
  'Snacks': 'snacks',
  'Frozen': 'frozen',
  'Pantry': 'pantry',
};

// Map product names to translation keys (based on actual products in database)
export const productNameToKey: Record<string, TranslationKey> = {
  // Arabic fruit names (already in Arabic, will display as-is)
  'خوخ': 'khawkh',
  'برتقال': 'burtuqal',
  'موز': 'mawz',
  'أناناس': 'ananas',
  'بطيخ': 'batikh',
  'كرز': 'karaz',
  'جزر': 'jazar',
  'عرموط': 'armoot',
  'عنجاص': 'anjas',
  'مانغا': 'manga',
  'رمان سوري': 'rummanSuri',
  'عنب أسود': 'inabAswad',
  'خوخ مسطح': 'khawkhMusattah',
  'تفاح أبيض صغير': 'tuffahAbyadSaghir',
  'فاكهة التنين (قطعة)': 'fakhatAlTinnin',
  'ركي': 'raki',
  'تفاح أخضر': 'tuffahAkhdar',
  
  // Arabic vegetable names (comprehensive mapping for all products)
  'طماطة': 'tamata',
  'خيار': 'khiyar',
  'بصل': 'basal',
  'ثوم': 'thoom',
  'بيذنجان': 'bidhanjan',
  'بطاطا': 'batata',
  'شجر': 'shajar',
  'ليمون اصفر': 'laymonAsfar',
  'شوندر': 'shondar',
  'فجل': 'fujl',
  'ورق عنب': 'waraqInab',
  'فلفل اخضر بارد': 'fulfulAkhdarBarid',
  'لوبيا': 'lubiya',
  'باميه': 'bamiya',
  'قرنابيط': 'qarnabeet',
  'سلك': 'silk',
  'معدنوس': 'maadnoos',
  'شبيت': 'shabeet',
  'كرفس': 'karafs',
  
  // English products
  'Fresh Spinach': 'freshSpinach',
  'Bell Peppers': 'bellPeppers',
  'Fresh Carrots': 'freshCarrots',
  'Russet Potatoes': 'russetPotatoes',
  'Whole Milk': 'wholeMilk',
  'Salmon Fillet': 'salmonFillet',
  'Greek Yogurt': 'greekYogurt',
  'Whole Grain Bread': 'wholeGrainBread',
  'Fresh Tomatoes': 'freshTomatoes',
};

// Get translation key for category name
export const getCategoryTranslationKey = (categoryName: string): TranslationKey => {
  return categoryNameToKey[categoryName] || 'vegetables';
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
  return 'vegetables'; // Fallback to vegetables category
};