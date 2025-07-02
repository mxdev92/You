import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { CartItem, Product, InsertCartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load cart data once on mount
  const loadCartItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cart");
      if (response.ok) {
        const items = await response.json();
        setCartItems(items);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCartItems();
  }, [loadCartItems]);

  const addToCart = useCallback(async (item: InsertCartItem) => {
    try {
      const response = await apiRequest("POST", "/api/cart", item);
      const newCartItem = await response.json();
      setCartItems(prev => [...prev, newCartItem]);
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
      // Optimistically remove from UI
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    } catch (error) {
      // Reload on error
      loadCartItems();
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  }, [toast, loadCartItems]);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    if (isUpdating) return; // Prevent multiple concurrent updates
    
    try {
      setIsUpdating(true);
      // Optimistically update UI
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      );
      
      await apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
    } catch (error) {
      // Reload on error
      loadCartItems();
      toast({
        title: "Error",
        description: "Failed to update item quantity.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, toast, loadCartItems]);

  const clearCart = useCallback(async () => {
    try {
      setCartItems([]);
      await apiRequest("DELETE", "/api/cart");
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
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
