import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { CartItem, Product, InsertCartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type CartItemWithProduct = CartItem & { product: Product };

interface CartContextType {
  cartItems: CartItemWithProduct[];
  isLoading: boolean;
  addToCart: (item: InsertCartItem) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartItemsCount: number;
  getCartTotal: () => number;
  isAdding: boolean;
  isRemoving: boolean;
  isUpdating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateInProgress = useRef(false);
  const cartLoadedRef = useRef(false);

  // Load cart data once
  const loadCartItems = useCallback(async () => {
    if (cartLoadedRef.current) return; // Prevent multiple loads
    cartLoadedRef.current = true; // Set immediately to prevent race conditions
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/cart");
      if (response.ok) {
        const items = await response.json();
        setCartItems(items);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      cartLoadedRef.current = false; // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCartItems();
  }, [loadCartItems]);

  const addToCart = useCallback(async (item: InsertCartItem) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      
      if (response.ok) {
        const newCartItem = await response.json();
        setCartItems(prev => [...prev, newCartItem]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const removeFromCart = useCallback(async (itemId: number) => {
    try {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        loadCartItems(); // Reload on error
      }
    } catch (error) {
      loadCartItems();
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  }, [toast, loadCartItems]);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    if (updateInProgress.current) return;
    
    try {
      updateInProgress.current = true;
      setIsUpdating(true);
      
      // Update UI immediately
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      );
      
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      
      if (!response.ok) {
        loadCartItems(); // Reload on error
      }
    } catch (error) {
      loadCartItems();
      toast({
        title: "Error",
        description: "Failed to update item quantity.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      updateInProgress.current = false;
    }
  }, [toast, loadCartItems]);

  const clearCart = useCallback(async () => {
    try {
      setCartItems([]);
      const response = await fetch("/api/cart", { method: "DELETE" });
      
      if (response.ok) {
        toast({
          title: "Cart cleared",
          description: "All items have been removed from your cart.",
        });
      } else {
        loadCartItems();
      }
    } catch (error) {
      loadCartItems();
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    }
  }, [toast, loadCartItems]);

  const cartItemsCount = cartItems.length;
  
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  const value = {
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

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}