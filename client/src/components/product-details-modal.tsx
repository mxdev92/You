import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[75%] max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Product Image - 60% of modal height */}
        <div className="relative h-[60%] min-h-[200px] bg-gray-100 dark:bg-gray-800">
          <img
            src={product.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details - 40% of modal height */}
        <div className="p-6 space-y-4">
          {/* Product Name */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {displayName}
          </h2>

          {/* Short Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('freshAndHighQuality')} {displayName.toLowerCase()}
          </p>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('selectQuantity')} ({t('kg')})
            </label>
            
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setSelectedQuantity(Math.max(0.5, selectedQuantity - 0.5))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                disabled={selectedQuantity <= 0.5}
              >
                <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              
              <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg min-w-[80px] text-center">
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {selectedQuantity}
                </span>
              </div>
              
              <button
                onClick={() => setSelectedQuantity(Math.min(5, selectedQuantity + 0.5))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                disabled={selectedQuantity >= 5}
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-right">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {totalPrice} {t('iqd')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {product.price} {t('iqd')}/{t('kg')}
              </p>
            </div>
            
            <Button
              onClick={handleAddToCart}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              {t('addToCart')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}