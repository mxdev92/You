import { useState, useEffect } from "react";
import Header from "@/components/header";
import LeftSidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import ProgressiveProductsGrid from "@/components/progressive-products-grid";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { useCartFlow } from "@/store/cart-flow";

export default function Home() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [leftSidebarView, setLeftSidebarView] = useState<'menu' | 'addresses' | 'settings' | 'profile' | 'orders' | 'login-prompt'>('menu');
  
  const { user } = usePostgresAuth();
  const { loadCart } = useCartFlow();

  // Load cart only for authenticated users
  useEffect(() => {
    if (user) {
      loadCart();
    }
  }, [user, loadCart]);

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
        <ProgressiveProductsGrid />
      </main>
    </div>
  );
}
