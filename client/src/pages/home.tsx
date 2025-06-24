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
      <Header
        onMenuClick={() => setIsLeftSidebarOpen(true)}
        onCartClick={() => setIsRightSidebarOpen(true)}
      />
      
      <LeftSidebar 
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
      />
      
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={() => setIsRightSidebarOpen(false)}
      />

      <main className="pb-8">
        <CategoriesSection />
        <ProductsGrid />
      </main>
    </div>
  );
}
