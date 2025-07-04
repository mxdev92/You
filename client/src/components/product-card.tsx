import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartFlow } from "@/store/cart-flow";
import { useTranslation } from "@/hooks/use-translation";
import { getProductTranslationKey } from "@/lib/category-mapping";
import { ProductDetailsModal } from "./product-details-modal";
import { useAuth } from "@/hooks/use-auth";
import SignupModal from "./signup-modal";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const addToCart = useCartFlow(state => state.addToCart);
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async () => {
    // Don't allow adding if product is not available
    if (!product.available) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowSignupModal(true);
      return;
    }
    
    setIsAdding(true);
    setShowShimmer(true);

    try {
      await addToCart({ productId: product.id, quantity: 1 });
      
      // Keep the "Added!" state for a moment
      setTimeout(() => {
        setIsAdding(false);
      }, 1000);
      
      // Hide shimmer effect
      setTimeout(() => {
        setShowShimmer(false);
      }, 1500);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAdding(false);
      setShowShimmer(false);
    }
  };

  const handleSignupSuccess = async () => {
    // After successful signup/login, add the item to cart
    setShowSignupModal(false);
    
    // Wait a bit for authentication state to update, then add to cart directly
    setTimeout(async () => {
      if (!product.available) return;
      
      setIsAdding(true);
      setShowShimmer(true);

      try {
        await addToCart({ productId: product.id, quantity: 1 });
        
        // Keep the "Added!" state for a moment
        setTimeout(() => {
          setIsAdding(false);
        }, 1000);
        
        // Hide shimmer effect
        setTimeout(() => {
          setShowShimmer(false);
        }, 1500);
      } catch (error) {
        console.error('Failed to add to cart after signup:', error);
        setIsAdding(false);
        setShowShimmer(false);
      }
    }, 500);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: product.available ? -2 : 0 }}
        className={`product-card bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative cursor-pointer ${
          !product.available ? 'opacity-60' : ''
        }`}
        onClick={() => setIsModalOpen(true)}
      >
      {/* Product Image */}
      <div className="relative h-40 md:h-44 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Shimmer Effect Overlay */}
        {showShimmer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 shimmer-effect"
          />
        )}
      </div>
      
      {/* Product Content */}
      <div className="p-3">
        <h3 className="font-medium text-gray-800 text-sm mb-1 truncate">
          {(() => {
            const translationKey = getProductTranslationKey(product.name);
            const translatedName = t(translationKey);
            // If translation key doesn't exist and we get the fallback, show original name
            if (translationKey === 'organicApples' && product.name !== 'Organic Apples') {
              return product.name;
            }
            return translatedName;
          })()}
        </h3>
        <p className="text-fresh-green font-bold text-sm mb-2">
          {product.price}/{product.unit}
        </p>
        
        <motion.div whileTap={{ scale: product.available ? 0.95 : 1 }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={isAdding || !product.available}
            className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 touch-action-manipulation min-h-9 ${
              !product.available
                ? "bg-gray-400 hover:bg-gray-400 text-gray-600 cursor-not-allowed"
                : isAdding
                ? "bg-green-500 hover:bg-green-500"
                : "bg-fresh-green hover:bg-fresh-green-dark"
            }`}
          >
            {!product.available ? (
              t('outOfStock')
            ) : isAdding ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                {t('added')}
              </>
            ) : (
              t('addToCart')
            )}
          </Button>
        </motion.div>
      </div>
      </motion.div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
      />
    </>
  );
}
