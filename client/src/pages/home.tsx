import { useState } from "react";
import Header from "@/components/header";
import LeftSidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import ProductsGrid from "@/components/products-grid";

export default function Home() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [leftSidebarView, setLeftSidebarView] = useState<'menu' | 'addresses' | 'settings' | 'profile' | 'orders'>('menu');

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
        setCurrentView={setLeftSidebarView}
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
