import { create } from 'zustand';
import type { CartItem, Product, InsertCartItem } from "@shared/schema";
import { MetaPixel } from "@/lib/meta-pixel";

type CartItemWithProduct = CartItem & { product: Product };

interface CartFlowState {
  cartItems: CartItemWithProduct[];
  isLoading: boolean;
  isUpdating: boolean;
}

interface CartFlowActions {
  loadCart: () => Promise<void>;
  addToCart: (item: InsertCartItem, onSuccess?: () => void) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemsCount: () => number;
  getCartTotal: () => number;
}

type CartFlowStore = CartFlowState & CartFlowActions;

export const useCartFlow = create<CartFlowStore>((set, get) => ({
  // State
  cartItems: [],
  isLoading: false,
  isUpdating: false,

  // Actions
  loadCart: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const items = await response.json();
        set({ cartItems: items });
      }
    } catch (error) {
      console.error("CartFlow: Failed to load cart:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (item: InsertCartItem, onSuccess?: () => void) => {
    try {
      // Get current state for optimistic update
      const currentItems = get().cartItems;
      
      // Check if item already exists
      const existingItemIndex = currentItems.findIndex(cartItem => 
        cartItem.productId === item.productId
      );
      
      // Optimistically update UI immediately
      if (existingItemIndex >= 0) {
        // Update existing item quantity - ensure proper number arithmetic
        const updatedItems = [...currentItems];
        const currentQty = parseFloat(updatedItems[existingItemIndex].quantity);
        const addQty = item.quantity || 1;
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: String(currentQty + addQty)
        };
        set({ cartItems: updatedItems });
      } else {
        // For new items, don't add optimistically - wait for server response
        // This prevents crashes when product data is missing
      }

      // Send to server (background operation)
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      
      if (response.ok) {
        // Immediately refresh cart to get updated data with product info
        try {
          const updatedResponse = await fetch("/api/cart");
          if (updatedResponse.ok) {
            const items = await updatedResponse.json();
            set({ cartItems: items });
            // Call success callback if provided
            if (onSuccess) {
              onSuccess();
            }
          }
        } catch (error) {
          console.log("Cart sync failed:", error);
        }
      } else {
        // Revert optimistic update on error
        get().loadCart();
        throw new Error("Failed to add item");
      }
    } catch (error) {
      console.error("CartFlow: Failed to add item:", error);
      // Revert optimistic update on error
      get().loadCart();
      throw error;
    }
  },

  removeFromCart: async (itemId: number) => {
    try {
      // Optimistically update UI
      set(state => ({ 
        cartItems: state.cartItems.filter(item => item.id !== itemId) 
      }));

      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        // Revert on error
        get().loadCart();
        throw new Error("Failed to remove item");
      }
    } catch (error) {
      console.error("CartFlow: Failed to remove item:", error);
      get().loadCart(); // Reload on error
      throw error;
    }
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    try {
      set({ isUpdating: true });
      
      // Optimistically update UI - ensure quantity is stored as string
      set(state => ({ 
        cartItems: state.cartItems.map(item => 
          item.id === itemId ? { ...item, quantity: String(quantity) } : item
        )
      }));

      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      
      if (!response.ok) {
        // Revert on error
        get().loadCart();
        throw new Error("Failed to update quantity");
      }
    } catch (error) {
      console.error("CartFlow: Failed to update quantity:", error);
      get().loadCart(); // Reload on error
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  clearCart: async () => {
    try {
      set({ cartItems: [] });
      const response = await fetch("/api/cart", { method: "DELETE" });
      
      if (!response.ok) {
        get().loadCart();
        throw new Error("Failed to clear cart");
      }
    } catch (error) {
      console.error("CartFlow: Failed to clear cart:", error);
      get().loadCart();
      throw error;
    }
  },

  getCartItemsCount: () => {
    const { cartItems } = get();
    return cartItems.length; // Count number of unique items, not total quantity
  },

  getCartTotal: () => {
    const { cartItems } = get();
    return cartItems.reduce((total, item) => {
      if (!item.product?.price) return total;
      return total + (parseFloat(item.product.price) * parseFloat(item.quantity));
    }, 0);
  },
}));

// Initialize CartFlow on app start only if user is authenticated
// Cart should be empty for anonymous users by default