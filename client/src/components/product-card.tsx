import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartFlow } from "@/store/cart-flow";
import { useTranslation } from "@/hooks/use-translation";
import { getProductTranslationKey } from "@/lib/category-mapping";
import { ProductDetailsModal } from "./product-details-modal";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
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
  const isProductInCart = useCartFlow(state => state.isProductInCart);
  const { t } = useTranslation();
  const { user } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  // Check if this product is in cart
  const isInCart = isProductInCart(product.id);

  const handleAddToCart = async () => {
    console.log('Add to cart clicked, user:', user ? `${user.email} (${user.uid})` : 'Not authenticated');
    // Don't allow adding if product is not available or already in cart
    if (!product.available || isInCart) return;
    
    // Check if user is authenticated
    if (!user) {
      console.log('Redirecting to auth - no user for add to cart');
      setLocation('/auth');
      return;
    }
    
    setIsAdding(true);
    setShowShimmer(true);

    try {
      await addToCart({ productId: product.id, quantity: 1 });
      
      // Fast feedback - quick shimmer and "Added!" state
      setTimeout(() => {
        setIsAdding(false);
        setShowShimmer(false);
      }, 400);
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
        
        <motion.div whileTap={{ scale: product.available && !isInCart ? 0.95 : 1 }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (!isInCart) {
                handleAddToCart();
              }
            }}
            disabled={isAdding || !product.available || isInCart}
            className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 touch-action-manipulation min-h-9 ${
              !product.available
                ? "bg-gray-400 hover:bg-gray-400 text-gray-600 cursor-not-allowed"
                : isInCart
                ? "bg-green-500 hover:bg-green-500 text-white cursor-default"
                : isAdding
                ? "bg-green-500 hover:bg-green-500 text-white"
                : "hover:opacity-90 text-black"
            }`}
            style={!product.available ? {} : (isInCart || isAdding) ? {} : { backgroundColor: '#22c55e' }}
          >
            {!product.available ? (
              t('outOfStock')
            ) : isInCart ? (
              <Check className="h-4 w-4 text-white" />
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
