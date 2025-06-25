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
    
    // Products
    addToCart: "Add to Cart",
    
    // Cart
    cart: "Cart",
    total: "Total",
    checkout: "Checkout",
    
    // Common
    search: "Search...",
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
    fruits: "الفواكه",
    vegetables: "الخضروات",
    dairy: "الألبان",
    bakery: "المخبوزات",
    seafood: "المأكولات البحرية",
    
    // Products
    addToCart: "أضف إلى السلة",
    
    // Cart
    cart: "السلة",
    total: "المجموع",
    checkout: "الدفع",
    
    // Common
    search: "البحث...",
    close: "إغلاق",
    cancel: "إلغاء",
    save: "حفظ",
    edit: "تعديل",
    delete: "حذف",
    loading: "جاري التحميل...",
  },
};

export type TranslationKey = keyof typeof translations.en;