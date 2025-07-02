import { useState, useEffect, useCallback } from "react";
import type { CartItem, Product, InsertCartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type CartItemWithProduct = CartItem & { product: Product };

// Single global state to prevent multiple hook instances
let globalCartItems: CartItemWithProduct[] = [];
let globalListeners: Array<(items: CartItemWithProduct[]) => void> = [];
let isInitialized = false;

const notifyListeners = () => {
  globalListeners.forEach(listener => listener([...globalCartItems]));
};

const loadCartFromServer = async () => {
  if (isInitialized) return;
  isInitialized = true;
  
  try {
    const response = await fetch("/api/cart");
    if (response.ok) {
      globalCartItems = await response.json();
      notifyListeners();
    }
  } catch (error) {
    console.error("Failed to load cart:", error);
  }
};

export function useCart() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>(globalCartItems);

  useEffect(() => {
    // Subscribe to global cart changes
    const listener = (items: CartItemWithProduct[]) => {
      setCartItems(items);
    };
    globalListeners.push(listener);

    // Load cart if not initialized
    loadCartFromServer();

    return () => {
      globalListeners = globalListeners.filter(l => l !== listener);
    };
  }, []);

  const addToCart = useCallback(async (item: InsertCartItem) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      
      if (response.ok) {
        const newCartItem = await response.json();
        globalCartItems.push(newCartItem);
        notifyListeners();
        toast({
          title: "Added to cart",
          description: "Item successfully added to cart.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateQuantity = useCallback(async (id: number, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      
      if (response.ok) {
        const updatedItem = await response.json();
        const index = globalCartItems.findIndex(item => item.id === id);
        if (index !== -1) {
          globalCartItems[index] = updatedItem;
          notifyListeners();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const removeFromCart = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/cart/${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        globalCartItems = globalCartItems.filter(item => item.id !== id);
        notifyListeners();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const clearCart = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });
      
      if (response.ok) {
        globalCartItems = [];
        notifyListeners();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => {
      if (!item.product || !item.product.price) return total;
      const price = parseFloat(item.product.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.length;
  }, [cartItems]);

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getItemCount,
  };
}