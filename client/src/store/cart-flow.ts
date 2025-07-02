import { create } from 'zustand';
import type { CartItem, Product, InsertCartItem } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

interface CartFlowState {
  cartItems: CartItemWithProduct[];
  isLoading: boolean;
  isUpdating: boolean;
}

interface CartFlowActions {
  loadCart: () => Promise<void>;
  addToCart: (item: InsertCartItem) => Promise<void>;
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

  addToCart: async (item: InsertCartItem) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      
      if (response.ok) {
        // Reload cart to get updated data with product details
        get().loadCart();
      } else {
        throw new Error("Failed to add item");
      }
    } catch (error) {
      console.error("CartFlow: Failed to add item:", error);
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
      
      // Optimistically update UI
      set(state => ({ 
        cartItems: state.cartItems.map(item => 
          item.id === itemId ? { ...item, quantity } : item
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
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  },
}));

// Initialize CartFlow on app start
useCartFlow.getState().loadCart();