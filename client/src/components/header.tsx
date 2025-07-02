import { Search, Menu, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useTranslation } from "@/hooks/use-translation";
import CategoriesSection from "@/components/categories-section";

interface HeaderProps {
  onMenuClick: () => void;
  onCartClick: () => void;
}

export default function Header({ onMenuClick, onCartClick }: HeaderProps) {
  const cartItemsCount = useCartStore(state => state.getCartItemsCount());
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 safe-area-inset rounded-b-3xl">
      <div className="flex items-center justify-between px-4 py-3 touch-action-manipulation">
        {/* Menu Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
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

        {/* Cart Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCartClick}
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
      
      {/* Categories Section */}
      <CategoriesSection />
    </header>
  );
}
