// DEPRECATED: This hook is replaced by global cart store
// Use useCartStore from @/store/cart-store instead

import { useCartStore } from "@/store/cart-store";

export function useCart() {
  // Redirect to global cart store
  const cartItems = useCartStore(state => state.cartItems);
  const isLoading = useCartStore(state => state.isLoading);
  const addToCart = useCartStore(state => state.addToCart);
  const removeFromCart = useCartStore(state => state.removeFromCart);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const clearCart = useCartStore(state => state.clearCart);
  const cartItemsCount = useCartStore(state => state.getCartItemsCount());
  const getCartTotal = useCartStore(state => state.getCartTotal);
  const isUpdating = useCartStore(state => state.isUpdating);

  return {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartItemsCount,
    getCartTotal,
    isAdding: false,
    isRemoving: false,
    isUpdating,
  };
}