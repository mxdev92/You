import { useState, memo } from "react";
import { Check } from "lucide-react";
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

const ProductCardComponent = ({ product }: ProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addToCart = useCartFlow(state => state.addToCart);
  const { t } = useTranslation();
  const { user } = usePostgresAuth();
  const [, setLocation] = useLocation();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.available) return;
    
    if (!user) {
      setLocation('/auth');
      return;
    }
    
    setIsAdding(true);
    try {
      await addToCart({ productId: product.id, quantity: 1 });
      setTimeout(() => setIsAdding(false), 150);
    } catch (error) {
      setIsAdding(false);
    }
  };

  const translationKey = getProductTranslationKey(product.name);
  const translatedName = t(translationKey);
  const displayName = (translationKey === 'organicApples' && product.name !== 'Organic Apples') 
    ? product.name 
    : translatedName;

  return (
    <>
      <div
        className={`product-card bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-100 overflow-hidden cursor-pointer ${
          !product.available ? 'opacity-60' : ''
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative h-40 md:h-44 overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        <div className="p-3">
          <h3 className="font-medium text-gray-800 text-sm mb-1 truncate">
            {displayName}
          </h3>
          <p className="text-fresh-green font-bold text-sm mb-2">
            {formatPrice(product.price)}/{product.unit}
          </p>
          
          <Button
            onClick={handleAddToCart}
            disabled={isAdding || !product.available}
            className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all duration-75 min-h-9 active:scale-95 ${
              !product.available
                ? "bg-gray-400 hover:bg-gray-400 text-gray-600 cursor-not-allowed"
                : isAdding
                ? "bg-green-500 hover:bg-green-500 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {!product.available ? (
              t('outOfStock')
            ) : isAdding ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <span className="text-white font-semibold">أضف الى السلة</span>
            )}
          </Button>
        </div>
      </div>

      {isModalOpen && (
        <ProductDetailsModal
          product={product}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.available === nextProps.product.available &&
         prevProps.product.price === nextProps.product.price;
});

export default ProductCard;
