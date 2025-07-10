import { useState, useEffect } from "react";
import Header from "@/components/header";
import LeftSidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import ProductsGrid from "@/components/products-grid";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { useCartFlow } from "@/store/cart-flow";
import { useTutorialStore } from "@/store/tutorial-store";

export default function Home() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [leftSidebarView, setLeftSidebarView] = useState<'menu' | 'addresses' | 'settings' | 'profile' | 'orders' | 'login-prompt'>('menu');
  
  const { user } = usePostgresAuth();
  const { loadCart } = useCartFlow();
  const { resetTutorial, setFirstTimeUser, startTutorial, tutorialStep } = useTutorialStore();

  // Load cart only once when user logs in
  useEffect(() => {
    if (user?.id) {
      loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user ID, not entire user object

  // Tutorial Development Mode - For testing with mx@x.dev
  useEffect(() => {
    if (user?.email === 'mx@x.dev') {
      // Always reset and start tutorial for development testing
      resetTutorial();
      setFirstTimeUser(true);
      
      // Start tutorial after a short delay to allow UI to load
      setTimeout(() => {
        startTutorial();
      }, 1000);
    }
  }, [user?.email, resetTutorial, setFirstTimeUser, startTutorial]);

  // Debug logging for tutorial state
  useEffect(() => {
    if (user?.email === 'mx@x.dev') {
      console.log('Tutorial state:', tutorialStep);
    }
  }, [tutorialStep, user?.email]);

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
        <ProductsGrid />
      </main>
    </div>
  );
}
