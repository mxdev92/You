import { useState, useEffect } from "react";
import Header from "@/components/header";
// import LeftSidebar from "@/components/left-sidebar"; // Replaced with ProfileSidebar
import RightSidebar from "@/components/right-sidebar";
import ProfileSidebar from "@/components/profile-sidebar";
import ProductsGrid from "@/components/products-grid";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useCartFlow } from "@/store/cart-flow";

export default function Home() {
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  
  const { user } = useFirebaseAuth();
  const { loadCart } = useCartFlow();

  // Load cart only for authenticated users
  useEffect(() => {
    if (user) {
      loadCart();
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object or loadCart function

  const handleNavigateToAddresses = () => {
    setIsRightSidebarOpen(false);
    // TODO: Navigate to addresses in future implementation
    console.log('Navigate to addresses from cart');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onMenuClick={() => setIsProfileSidebarOpen(true)}
        onCartClick={() => setIsRightSidebarOpen(true)}
      />
      
      <ProfileSidebar 
        isOpen={isProfileSidebarOpen}
        onClose={() => setIsProfileSidebarOpen(false)}
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
