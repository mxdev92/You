import { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { getProductTranslationKey } from "@/lib/category-mapping";
import { useCartFlow } from "@/store/cart-flow";
import { formatPrice } from "@/lib/price-utils";
import { MetaPixel } from "@/lib/meta-pixel";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

// Removed quantityOptions array as we now use +/- buttons

export function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  const { t } = useTranslation();
  const addToCart = useCartFlow(state => state.addToCart);
  const [selectedQuantity, setSelectedQuantity] = useState(0.5);
  const [isAdding, setIsAdding] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount or when modal closes
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const translationKey = getProductTranslationKey(product.name);
  const displayName = translationKey ? t(translationKey) : product.name;

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    try {
      await addToCart({
        productId: product.id,
        quantity: selectedQuantity,
      });
      
      // Track add to cart event with Meta Pixel
      MetaPixel.trackAddToCart(displayName, product.price);
      
      // Keep the "Added!" state for a moment
      setTimeout(() => {
        setIsAdding(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAdding(false);
    }
  };

  const totalPrice = (parseFloat(product.price) * selectedQuantity).toLocaleString();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-[85%] max-w-sm mx-auto overflow-hidden"
          >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Product Image - 60% of modal */}
        <div className="relative h-56 bg-gray-100 dark:bg-gray-800 rounded-b-2xl overflow-hidden">
          <img
            src={product.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details - 40% compact */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {displayName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('freshAndHighQuality')} {displayName.toLowerCase()}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="block text-center text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('selectQuantity')} ({t('kg')})
            </label>
            
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setSelectedQuantity(Math.max(0.5, selectedQuantity - 0.5))}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  selectedQuantity <= 0.5 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
                disabled={selectedQuantity <= 0.5}
              >
                <Minus className="w-3 h-3" />
              </button>
              
              <div className="bg-green-50 px-3 py-1 rounded-lg min-w-[60px] text-center">
                <span className="text-lg font-semibold text-green-600">
                  {selectedQuantity}
                </span>
              </div>
              
              <button
                onClick={() => setSelectedQuantity(Math.min(5, selectedQuantity + 0.5))}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  selectedQuantity >= 5 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
                disabled={selectedQuantity >= 5}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Price Display */}
          <div className="text-center py-2">
            <p className="text-xl font-bold text-green-600">
              {formatPrice(totalPrice)} {t('iqd')}
            </p>
            <p className="text-xs text-gray-500">
              {formatPrice(product.price)} {t('iqd')}/{t('kg')}
            </p>
          </div>
          
          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-all duration-200 ${
              isAdding ? "bg-green-500 text-white" : "text-black"
            }`}
            style={isAdding ? {} : { backgroundColor: '#22c55e' }}
          >
            {isAdding ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <ShoppingCart className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}