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

      
      {/* URGENT TEST: Simple button to verify interactions work */}
      <div className="fixed top-16 left-4 z-[100]">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('EMERGENCY TEST BUTTON CLICKED');
            alert('EMERGENCY: This button works!');
          }}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold border-2 border-white shadow-lg"
          style={{ 
            pointerEvents: 'auto', 
            cursor: 'pointer', 
            zIndex: 99999,
            position: 'relative'
          }}
        >
          EMERGENCY TEST
        </button>
      </div>

      <Header
        onMenuClick={() => {
          console.log('Home: Menu clicked, setting profile sidebar open');
          setIsProfileSidebarOpen(true);
        }}
        onCartClick={() => {
          console.log('Home: Cart clicked, setting right sidebar open');
          setIsRightSidebarOpen(true);
        }}
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
