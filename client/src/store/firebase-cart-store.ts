import { create } from 'zustand';
import { 
  getUserCartItems, 
  addToUserCart, 
  updateCartItemQuantity, 
  deleteUserCartItem, 
  clearUserCart,
  type UserCartItem 
} from '@/lib/firebase-user-data';

interface FirebaseCartState {
  items: UserCartItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCart: () => Promise<void>;
  addItem: (item: Omit<UserCartItem, 'id' | 'uid' | 'addedAt'>) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearLocalCart: () => void;
  
  // Computed values
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

export const useFirebaseCartStore = create<FirebaseCartState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  loadCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await getUserCartItems();
      set({ items, isLoading: false });
    } catch (error: any) {
      console.error('Error loading cart:', error);
      set({ 
        error: error.message || 'Failed to load cart',
        isLoading: false 
      });
    }
  },

  addItem: async (itemData) => {
    set({ isLoading: true, error: null });
    try {
      const newItem = await addToUserCart(itemData);
      
      // Check if item was merged with existing item or added as new
      const { items } = get();
      const existingItemIndex = items.findIndex(item => item.productId === itemData.productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...items];
        updatedItems[existingItemIndex] = newItem;
        set({ items: updatedItems, isLoading: false });
      } else {
        // Add new item
        set({ items: [newItem, ...items], isLoading: false });
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      set({ 
        error: error.message || 'Failed to add item to cart',
        isLoading: false 
      });
    }
  },

  updateQuantity: async (id, quantity) => {
    set({ isLoading: true, error: null });
    try {
      await updateCartItemQuantity(id, quantity);
      const { items } = get();
      
      if (quantity <= 0) {
        // Item was removed
        set({ 
          items: items.filter(item => item.id !== id),
          isLoading: false 
        });
      } else {
        // Item quantity updated
        const updatedItems = items.map(item => 
          item.id === id ? { ...item, quantity } : item
        );
        set({ items: updatedItems, isLoading: false });
      }
    } catch (error: any) {
      console.error('Error updating cart quantity:', error);
      set({ 
        error: error.message || 'Failed to update quantity',
        isLoading: false 
      });
    }
  },

  removeItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteUserCartItem(id);
      const { items } = get();
      
      set({ 
        items: items.filter(item => item.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      set({ 
        error: error.message || 'Failed to remove item',
        isLoading: false 
      });
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      await clearUserCart();
      set({ items: [], isLoading: false });
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      set({ 
        error: error.message || 'Failed to clear cart',
        isLoading: false 
      });
    }
  },

  clearLocalCart: () => {
    set({ items: [], isLoading: false, error: null });
  },

  getTotalItems: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  }
}));