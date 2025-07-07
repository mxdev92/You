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
  
  const { user } = usePostgresAuth();
  const { loadCart, clearCart } = useCartFlow();

  // Clear cart on app startup, then load only for authenticated users
  useEffect(() => {
    // Always clear cart when app starts
    clearCart();
    
    // Only load cart data if user is authenticated
    if (user) {
      loadCart();
    }
  }, [user?.id]); // Only depend on user ID, not the function references

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
        <ProductsGrid />
      </main>
    </div>
  );
}
