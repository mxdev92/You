import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { getProductTranslationKey } from "@/lib/category-mapping";
import { useCart } from "@/hooks/use-cart";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

// Removed quantityOptions array as we now use +/- buttons

export function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      quantity: selectedQuantity,
    });
    onClose();
  };

  const totalPrice = (parseFloat(product.price) * selectedQuantity).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-[85%] max-w-sm mx-auto max-h-[85vh] overflow-hidden border border-gray-200/20 dark:border-gray-700/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105"
        >
          <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Product Image - 50% of modal height for better proportions */}
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <img
            src={product.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
          {/* Subtle gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
        </div>

        {/* Product Details */}
        <div className="p-5 space-y-4 flex-1">
          {/* Product Name */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {displayName}
            </h2>

            {/* Short Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('freshAndHighQuality')} {displayName.toLowerCase()}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <label className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('selectQuantity')} ({t('kg')})
            </label>
            
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setSelectedQuantity(Math.max(0.5, selectedQuantity - 0.5))}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                  selectedQuantity <= 0.5 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                    : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:scale-105 shadow-sm'
                }`}
                disabled={selectedQuantity <= 0.5}
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <div className="bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-xl min-w-[100px] text-center border border-green-200/50 dark:border-green-700/50">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {selectedQuantity}
                </span>
              </div>
              
              <button
                onClick={() => setSelectedQuantity(Math.min(5, selectedQuantity + 0.5))}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                  selectedQuantity >= 5 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                    : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 hover:scale-105 shadow-sm'
                }`}
                disabled={selectedQuantity >= 5}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="space-y-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            {/* Price Display */}
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {totalPrice} {t('iqd')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.price} {t('iqd')}/{t('kg')}
              </p>
            </div>
            
            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
            >
              {t('addToCart')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}