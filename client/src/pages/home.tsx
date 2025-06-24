import { useState } from "react";
import Header from "@/components/header";
import LeftSidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import CategoriesSection from "@/components/categories-section";
import ProductsGrid from "@/components/products-grid";

export default function Home() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm rounded-b-3xl">
        <Header
          onMenuClick={() => setIsLeftSidebarOpen(true)}
          onCartClick={() => setIsRightSidebarOpen(true)}
        />
        <CategoriesSection />
      </div>
      
      <LeftSidebar 
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
      />
      
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={() => setIsRightSidebarOpen(false)}
      />

      <main className="pt-32 pb-8">
        <ProductsGrid />
      </main>
    </div>
  );
}
