import { useState, useEffect, useCallback } from "react";
import type { CartItem, Product, InsertCartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart items once on mount
  useEffect(() => {
    let isMounted = true;
    
    fetch("/api/cart")
      .then(res => res.json())
      .then(items => {
        if (isMounted) {
          setCartItems(items);
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error("Failed to load cart:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
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
        setCartItems(prev => [...prev, newCartItem]);
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
        setCartItems(prev => 
          prev.map(item => item.id === id ? updatedItem : item)
        );
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
        setCartItems(prev => prev.filter(item => item.id !== id));
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
        setCartItems([]);
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
      const price = parseFloat(item.product.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.length;
  }, [cartItems]);

  return {
    cartItems,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getItemCount,
  };
}