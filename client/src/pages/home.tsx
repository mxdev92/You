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
    <div 
      className="min-h-screen bg-gray-50" 
      style={{ pointerEvents: 'auto' }}
      onClickCapture={(e) => {
        console.log('HOME DIV CLICK CAPTURED:', e.target);
      }}
    >
      {/* DEBUG: Test button to verify interaction works */}
      <div className="fixed top-20 right-4 z-50" style={{ pointerEvents: 'auto' }}>
        <button 
          onClick={(e) => {
            console.log('DEBUG: Test button clicked!', e);
            alert('Test button works! This means buttons can be clicked.');
            e.stopPropagation();
          }}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
          style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 9999 }}
        >
          TEST
        </button>
      </div>
      
      {/* Additional test: Simple div click */}
      <div 
        className="fixed top-32 right-4 z-50 bg-blue-500 text-white px-3 py-1 rounded text-sm cursor-pointer"
        onClick={(e) => {
          console.log('DEBUG: Simple div clicked!', e);
          alert('Simple div works!');
          e.stopPropagation();
        }}
        style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 9999 }}
      >
        DIV
      </div>
      
      <Header
        onMenuClick={() => setIsProfileSidebarOpen(true)}
        onCartClick={() => setIsRightSidebarOpen(true)}
      />
      
      {/* TEMPORARILY DISABLED SIDEBARS FOR DEBUGGING */}
      {false && (
        <ProfileSidebar 
          isOpen={isProfileSidebarOpen}
          onClose={() => setIsProfileSidebarOpen(false)}
        />
      )}
      
      {false && (
        <RightSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          onNavigateToAddresses={handleNavigateToAddresses}
        />
      )}

      <main className="pb-8">
        <ProductsGrid />
      </main>
    </div>
  );
}
