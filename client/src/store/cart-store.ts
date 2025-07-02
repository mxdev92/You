import { create } from 'zustand';
import type { CartItem, Product, InsertCartItem } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

interface CartStore {
  cartItems: CartItemWithProduct[];
  isLoading: boolean;
  isUpdating: boolean;
  loadCart: () => Promise<void>;
  addToCart: (item: InsertCartItem) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemsCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cartItems: [],
  isLoading: false,
  isUpdating: false,

  loadCart: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const items = await response.json();
        console.log("✅ Global Cart loaded:", items.length, "items");
        console.log("📦 Cart items data:", items);
        set({ cartItems: items });
      } else {
        console.error("❌ Cart fetch failed with status:", response.status);
      }
    } catch (error) {
      console.error("❌ Failed to load cart:", error);
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
        const newCartItem = await response.json();
        set(state => ({ 
          cartItems: [...state.cartItems, newCartItem] 
        }));
        console.log("✅ Item added to cart");
      } else {
        throw new Error("Failed to add item");
      }
    } catch (error) {
      console.error("❌ Failed to add item to cart:", error);
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
      console.error("❌ Failed to remove item from cart:", error);
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
      console.error("❌ Failed to update item quantity:", error);
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
        // Revert on error
        get().loadCart();
        throw new Error("Failed to clear cart");
      }
    } catch (error) {
      console.error("❌ Failed to clear cart:", error);
      throw error;
    }
  },

  getCartItemsCount: () => {
    const { cartItems } = get();
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  },

  getCartTotal: () => {
    const { cartItems } = get();
    return cartItems.reduce((total, item) => {
      if (!item.product || !item.product.price) return total;
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  },
}));

// Initialize cart on app start
useCartStore.getState().loadCart();