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
      const response = await fetch("/api/cart", {
        credentials: "include" // Include session cookies for authentication
      });
      if (response.ok) {
        const items = await response.json();
        set({ cartItems: items });
      } else if (response.status === 401) {
        // User not authenticated, clear cart
        set({ cartItems: [] });
      }
    } catch (error) {
      console.error("CartFlow: Failed to load cart:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (item: InsertCartItem) => {
    const { cartItems } = get();
    const originalCartItems = [...cartItems]; // Save for error rollback
    
    // SUPER FAST OPTIMISTIC UPDATE: Update UI immediately
    const existingItemIndex = cartItems.findIndex(
      cartItem => cartItem.productId === item.productId
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity instantly
      const optimisticUpdate = cartItems.map((cartItem, index) =>
        index === existingItemIndex
          ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
          : cartItem
      );
      set({ cartItems: optimisticUpdate });
    } else {
      // For new items, create temporary cart item with basic product info
      // We'll sync with full data from server later
      const tempCartItem: CartItemWithProduct = {
        id: Date.now(), // Temporary ID
        productId: item.productId,
        userId: 0,
        quantity: item.quantity || 1,
        addedAt: new Date().toISOString(),
        product: {
          id: item.productId,
          name: "Loading...",
          price: "0",
          imageUrl: "/api/placeholder/60/60",
          categoryId: 1,
          unit: "kg",
          available: true
        }
      };
      set({ cartItems: [...cartItems, tempCartItem] });
      
      // Get real product data in background
      fetch(`/api/products/${item.productId}`, { credentials: "include" })
        .then(res => res.json())
        .then(product => {
          const { cartItems: currentItems } = get();
          const updatedItems = currentItems.map(cartItem =>
            cartItem.id === tempCartItem.id
              ? { ...cartItem, product }
              : cartItem
          );
          set({ cartItems: updatedItems });
        })
        .catch(() => {
          // Keep temp data if product fetch fails
        });
    }
    
    // Send to server in background (non-blocking)
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(item),
    })
    .then(async (response) => {
      if (response.ok) {
        // Silently sync with server after 1 second to get real IDs
        setTimeout(async () => {
          try {
            const serverResponse = await fetch("/api/cart", {
              credentials: "include"
            });
            if (serverResponse.ok) {
              const serverItems = await serverResponse.json();
              set({ cartItems: serverItems });
            }
          } catch {
            // Silent fail - keep optimistic update
          }
        }, 1000);
      } else {
        // Revert optimistic update on error
        set({ cartItems: originalCartItems });
      }
    })
    .catch(() => {
      // Revert optimistic update on network error
      set({ cartItems: originalCartItems });
    });
  },

  removeFromCart: async (itemId: number) => {
    try {
      // Optimistically update UI
      set(state => ({ 
        cartItems: state.cartItems.filter(item => item.id !== itemId) 
      }));

      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
        credentials: "include", // Include session cookies for authentication
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
        credentials: "include", // Include session cookies for authentication
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
      const response = await fetch("/api/cart", { 
        method: "DELETE",
        credentials: "include" // Include session cookies for authentication
      });
      
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

// Initialize CartFlow on app start only if user is authenticated
// Cart should be empty for anonymous users by default