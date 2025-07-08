import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartFlow } from "@/store/cart-flow";
import { useTranslation } from "@/hooks/use-translation";
import { getProductTranslationKey } from "@/lib/category-mapping";
import { ProductDetailsModal } from "./product-details-modal";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { useLocation } from "wouter";
import { formatPrice } from "@/lib/price-utils";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

// LazyImage component for optimized loading
function LazyImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.01, // Load even earlier
        rootMargin: '50px' // Load 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    console.log('Image loaded successfully for product:', alt, 'URL:', src);
  };

  return (
    <div ref={imgRef} className={className}>
      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-150 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          loading="lazy"
        />
      )}
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addToCart = useCartFlow(state => state.addToCart);
  const { t } = useTranslation();
  const { user, loading } = usePostgresAuth();
  const [, setLocation] = useLocation();

  const handleAddToCart = async () => {
    // Don't allow adding if product is not available
    if (!product.available) return;
    
    console.log('🛒 Add to cart clicked - Auth check:', { user: user?.email, loading });
    
    // Wait for auth to finish loading before checking
    if (loading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }
    
    // Check if user is authenticated after loading is complete
    if (!user) {
      console.log('❌ No user found, redirecting to auth');
      setLocation('/auth');
      return;
    }
    
    console.log('✅ User authenticated, proceeding with add to cart:', user.email);
    
    // Instant feedback - no waiting for server
    setIsAdding(true);
    setShowShimmer(true);

    try {
      // This now happens instantly with optimistic updates
      await addToCart({ productId: product.id, quantity: 1 });
      
      // Show success state immediately
      setTimeout(() => {
        setIsAdding(false);
        setShowShimmer(false);
      }, 300); // Reduced to 300ms for faster feedback
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAdding(false);
      setShowShimmer(false);
    }
  };



  return (
    <>
      <motion.div
        whileHover={{ y: product.available ? -2 : 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`product-card bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden relative cursor-pointer ${
          !product.available ? 'opacity-60' : ''
        }`}
        onClick={() => setIsModalOpen(true)}
      >
      {/* Product Image */}
      <div className="relative h-40 md:h-44 overflow-hidden">
        <LazyImage
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
            transition={{ duration: 0.1 }}
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
          {formatPrice(product.price)}/{product.unit}
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
                ? "bg-green-500 hover:bg-green-500 text-white"
                : "hover:opacity-90 text-black"
            }`}
            style={!product.available ? {} : isAdding ? {} : { backgroundColor: '#22c55e' }}
          >
            {!product.available ? (
              t('outOfStock')
            ) : isAdding ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <ShoppingCart className="h-4 w-4 text-white" />
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


    </>
  );
}
