import { useState, useEffect } from "react";
import Header from "@/components/header";
import LeftSidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import ProductsGrid from "@/components/products-grid";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { useCartFlow } from "@/store/cart-flow";

export default function Home() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [leftSidebarView, setLeftSidebarView] = useState<'menu' | 'addresses' | 'settings' | 'profile' | 'orders' | 'login-prompt'>('menu');
  const [hasAddedToCartOnce, setHasAddedToCartOnce] = useState(false);
  
  const { user } = usePostgresAuth();
  const { loadCart } = useCartFlow();

  // Reset first-time add to cart flag when user changes or page refreshes
  useEffect(() => {
    setHasAddedToCartOnce(false);
  }, [user?.id]);

  // Auto-open cart with delay after adding items - only first time and only for mx@x.dev
  const handleAddToCartSuccess = () => {
    if (!hasAddedToCartOnce && user?.email === 'mx@x.dev') {
      setHasAddedToCartOnce(true);
      setTimeout(() => {
        setIsRightSidebarOpen(true);
      }, 800); // 800ms delay before cart opens
    }
  };

  // Load cart only once when user logs in
  useEffect(() => {
    if (user?.id) {
      loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user ID, not entire user object

  const handleNavigateToAddresses = () => {
    setIsRightSidebarOpen(false);
    setLeftSidebarView('addresses');
    setIsLeftSidebarOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onMenuClick={() => setIsLeftSidebarOpen(true)}
        onCartClick={() => setIsRightSidebarOpen(true)}
        isMenuOpen={isLeftSidebarOpen}
      />
      
      <LeftSidebar 
        isOpen={isLeftSidebarOpen}
        onClose={() => {
          setIsLeftSidebarOpen(false);
          setLeftSidebarView('menu');
        }}
        currentView={leftSidebarView}
        setCurrentView={setLeftSidebarView as (view: 'menu' | 'addresses' | 'settings' | 'profile' | 'orders' | 'login-prompt') => void}
      />
      
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={() => setIsRightSidebarOpen(false)}
        onNavigateToAddresses={handleNavigateToAddresses}
      />

      <main className="pb-8">
        <ProductsGrid onAddToCartSuccess={handleAddToCartSuccess} />
      </main>
    </div>
  );
}
