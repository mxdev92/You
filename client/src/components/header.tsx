import { Search, Menu, ShoppingCart, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useCartFlow } from "@/store/cart-flow";
import CategoriesSection from "@/components/categories-section";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useLocation } from "wouter";

interface HeaderProps {
  onMenuClick: () => void;
  onCartClick: () => void;
}

export default function Header({ onMenuClick, onCartClick }: HeaderProps) {
  const { t } = useTranslation();
  const { user, signOut } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  
  // Use CartFlow store for cart data (same as sidebar)
  const { cartItems, getCartItemsCount } = useCartFlow();
  const cartItemsCount = cartItems.length; // Count unique items, not total quantity

  const handleMenuClick = () => {
    console.log('AUTHENTICATION CHECK - Menu clicked');
    console.log('User object:', user);
    console.log('User authenticated:', !!user);
    console.log('User email:', user?.email);
    console.log('User UID:', user?.uid);
    
    if (!user) {
      console.log('🚫 BLOCKING ACCESS - No user authenticated, redirecting to /auth');
      setLocation('/auth');
      return;
    }
    
    console.log('✅ ALLOWING ACCESS - User is authenticated');
    onMenuClick();
  };

  const handleCartClick = () => {
    console.log('AUTHENTICATION CHECK - Cart clicked');
    console.log('User object:', user);
    console.log('User authenticated:', !!user);
    console.log('User email:', user?.email);
    console.log('User UID:', user?.uid);
    
    if (!user) {
      console.log('🚫 BLOCKING CART ACCESS - No user authenticated, redirecting to /auth');
      setLocation('/auth');
      return;
    }
    
    console.log('✅ ALLOWING CART ACCESS - User is authenticated');
    onCartClick();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 safe-area-inset rounded-b-3xl">
      <div className="flex items-center justify-between px-4 py-3 touch-action-manipulation">
        {/* Menu Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMenuClick}
          className="hover:bg-gray-100 rounded-lg touch-action-manipulation min-h-11 min-w-11"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </Button>

        {/* Search Bar */}
        <div className="flex-1 mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder={t('search')}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-fresh-green focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {/* Logout Button for Testing */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log('🔓 MANUAL LOGOUT - Testing authentication');
                signOut();
              }}
              className="hover:bg-red-100 rounded-lg touch-action-manipulation min-h-11 min-w-11"
              title="Logout for Testing"
            >
              <LogOut className="h-5 w-5 text-red-600" />
            </Button>
          )}
          
          {/* Cart Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCartClick}
            className="relative hover:bg-gray-100 rounded-lg touch-action-manipulation min-h-11 min-w-11"
          >
            <ShoppingCart className="h-6 w-6 text-gray-700" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-fresh-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Button>
        </div>
      </div>
      
      {/* Categories Section */}
      <CategoriesSection />
    </header>
  );
}
