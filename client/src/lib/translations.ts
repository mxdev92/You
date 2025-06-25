export const translations = {
  en: {
    // App Name
    appName: "KiwiQ",
    
    // Login Page
    welcomeBack: "Welcome back!",
    createAccount: "Create your account",
    signInToContinue: "Sign in to continue shopping",
    joinUs: "Join us for fresh groceries",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    enterEmail: "Enter your email",
    enterPassword: "Enter your password",
    confirmYourPassword: "Confirm your password",
    signIn: "Sign In",
    createAccountBtn: "Create Account",
    signingIn: "Signing In...",
    creatingAccount: "Creating Account...",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    agreeTerms: "By {action}, you agree to KiwiQ's Terms & Privacy Policy",
    signInAction: "signing in",
    createAccountAction: "creating an account",
    passwordMismatch: "Passwords don't match",
    
    // Sidebar
    welcomeBackSidebar: "Welcome back!",
    profile: "Profile",
    wallet: "Wallet",
    orders: "My Orders",
    settings: "Settings",
    logout: "Logout",
    
    // Settings
    language: "Language",
    arabic: "Arabic",
    english: "English",
    
    // Categories
    fruits: "Fruits",
    vegetables: "Vegetables",
    dairy: "Dairy",
    bakery: "Bakery",
    seafood: "Seafood",
    meat: "Meat",
    beverages: "Beverages",
    snacks: "Snacks",
    frozen: "Frozen",
    pantry: "Pantry",
    
    // Products
    addToCart: "Add to Cart",
    added: "Added!",
    
    // Product Names (based on actual products in database)
    organicApples: "Organic Apples",
    freshSpinach: "Fresh Spinach",
    bellPeppers: "Bell Peppers",
    freshCarrots: "Fresh Carrots",
    strawberries: "Strawberries",
    russetPotatoes: "Russet Potatoes",
    wholeMilk: "Whole Milk",
    salmonFillet: "Salmon Fillet",
    greekYogurt: "Greek Yogurt",
    bananas: "Bananas",
    wholeGrainBread: "Whole Grain Bread",
    freshTomatoes: "Fresh Tomatoes",
    
    // Cart
    cart: "Cart",
    total: "Total",
    checkout: "Checkout",
    
    // Common
    search: "Search groceries...",
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
  },
  ar: {
    // App Name
    appName: "كيوي كيو",
    
    // Login Page
    welcomeBack: "أهلاً بعودتك!",
    createAccount: "إنشاء حساب جديد",
    signInToContinue: "تسجيل الدخول للمتابعة",
    joinUs: "انضم إلينا للحصول على البقالة الطازجة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    enterEmail: "أدخل بريدك الإلكتروني",
    enterPassword: "أدخل كلمة المرور",
    confirmYourPassword: "أكد كلمة المرور",
    signIn: "تسجيل الدخول",
    createAccountBtn: "إنشاء حساب",
    signingIn: "جاري تسجيل الدخول...",
    creatingAccount: "جاري إنشاء الحساب...",
    dontHaveAccount: "ليس لديك حساب؟",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    agreeTerms: "بـ{action}، فإنك توافق على شروط وسياسة خصوصية كيوي كيو",
    signInAction: "تسجيل الدخول",
    createAccountAction: "إنشاء حساب",
    passwordMismatch: "كلمات المرور غير متطابقة",
    
    // Sidebar
    welcomeBackSidebar: "أهلاً بعودتك!",
    profile: "الملف الشخصي",
    wallet: "المحفظة",
    orders: "طلباتي",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    
    // Settings
    language: "اللغة",
    arabic: "العربية",
    english: "الإنجليزية",
    
    // Categories
    fruits: "فواكه",
    vegetables: "خضروات",
    dairy: "ألبان",
    bakery: "مخبوزات",
    seafood: "مأكولات بحرية",
    meat: "لحوم",
    beverages: "مشروبات",
    snacks: "وجبات خفيفة",
    frozen: "مجمدات",
    pantry: "بقالة",
    
    // Products
    addToCart: "أضف إلى السلة",
    added: "تمت الإضافة!",
    
    // Product Names (based on actual products in database)
    organicApples: "تفاح",
    freshSpinach: "سبانخ طازجة",
    bellPeppers: "فلفل حلو",
    freshCarrots: "جزر طازج",
    strawberries: "فراولة",
    russetPotatoes: "بطاطس",
    wholeMilk: "حليب كامل الدسم",
    salmonFillet: "شرائح السلمون",
    greekYogurt: "زبادي يوناني",
    bananas: "موز",
    wholeGrainBread: "خبز الحبوب الكاملة",
    freshTomatoes: "طماطم طازجة",
    
    // Cart
    cart: "السلة",
    total: "المجموع",
    checkout: "الدفع",
    
    // Common
    search: "البحث في البقالة...",
    close: "إغلاق",
    cancel: "إلغاء",
    save: "حفظ",
    edit: "تعديل",
    delete: "حذف",
    loading: "جاري التحميل...",
  },
};

export type TranslationKey = keyof typeof translations.en;