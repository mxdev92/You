import { Search, Menu, List, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useCartFlow } from "@/store/cart-flow";
import CategoriesSection from "@/components/categories-section";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { useLocation } from "wouter";
import { useTutorialStore } from "@/store/tutorial-store";
import { useEffect } from "react";

interface HeaderProps {
  onMenuClick: () => void;
  onCartClick: () => void;
  isMenuOpen?: boolean;
}

export default function Header({ onMenuClick, onCartClick, isMenuOpen = false }: HeaderProps) {
  const { t } = useTranslation();
  const { user } = usePostgresAuth();
  const [, setLocation] = useLocation();
  
  // Use CartFlow store for cart data (same as sidebar)
  const { cartItems, getCartItemsCount } = useCartFlow();
  const cartItemsCount = cartItems.length; // Count number of unique items (different products)
  
  // Tutorial state
  const { tutorialStep, setTutorialStep, completeTutorial } = useTutorialStore();
  const shouldHighlightCart = tutorialStep === 'cart-highlight';
  
  // Auto-open cart after 2 seconds if user doesn't tap cart icon during tutorial
  useEffect(() => {
    if (tutorialStep === 'cart-highlight') {
      const timer = setTimeout(() => {
        if (tutorialStep === 'cart-highlight') {
          // Auto-open cart and complete tutorial
          onCartClick();
          setTutorialStep('cart-opened');
          setTimeout(() => completeTutorial(), 1000);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [tutorialStep, onCartClick, setTutorialStep, completeTutorial]);

  const handleMenuClick = () => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    onMenuClick();
  };

  const handleCartClick = () => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    
    // If tutorial is active and user clicked cart, complete tutorial
    if (shouldHighlightCart) {
      setTutorialStep('cart-opened');
      setTimeout(() => completeTutorial(), 1000);
    }
    
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
          className={`hover:bg-gray-100 rounded-lg touch-action-manipulation min-h-11 min-w-11 transition-all duration-200 ${
            isMenuOpen ? 'bg-gray-100' : ''
          }`}
        >
          {isMenuOpen ? (
            <List className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
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

        {/* Cart Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCartClick}
          className={`relative hover:bg-gray-100 rounded-lg touch-action-manipulation min-h-11 min-w-11 ${
            shouldHighlightCart ? 'tutorial-vibrate tutorial-highlight' : ''
          }`}
        >
          <ShoppingCart className="h-6 w-6 text-gray-700" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-fresh-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemsCount}
            </span>
          )}
        </Button>
      </div>
      
      {/* Categories Section */}
      <CategoriesSection />
    </header>
  );
}
