import { useState, useEffect } from "react";
import type { CartItem, Product, InsertCartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load cart items on mount - NO CALLBACKS to prevent loops
  useEffect(() => {
    async function loadCart() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/cart");
        if (response.ok) {
          const items = await response.json();
          console.log("✅ Cart loaded successfully:", items);
          setCartItems(items);
        } else {
          console.error("❌ Cart fetch failed with status:", response.status);
        }
      } catch (error) {
        console.error("❌ Failed to load cart:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCart();
  }, []); // Empty dependency array - load once only

  const addToCart = async (item: InsertCartItem) => {
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
          description: "Item added successfully",
        });
      } else {
        throw new Error("Failed to add item");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      // Optimistically update UI
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        // Revert on error
        const reloadResponse = await fetch("/api/cart");
        if (reloadResponse.ok) {
          const items = await reloadResponse.json();
          setCartItems(items);
        }
        throw new Error("Failed to remove item");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {    
    try {
      setIsUpdating(true);
      
      // Optimistically update UI
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
        // Revert on error
        const reloadResponse = await fetch("/api/cart");
        if (reloadResponse.ok) {
          const items = await reloadResponse.json();
          setCartItems(items);
        }
        throw new Error("Failed to update quantity");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item quantity.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const clearCart = async () => {
    try {
      setCartItems([]);
      const response = await fetch("/api/cart", { method: "DELETE" });
      
      if (response.ok) {
        toast({
          title: "Cart cleared",
          description: "All items have been removed from your cart.",
        });
      } else {
        // Revert on error
        const reloadResponse = await fetch("/api/cart");
        if (reloadResponse.ok) {
          const items = await reloadResponse.json();
          setCartItems(items);
        }
        throw new Error("Failed to clear cart");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    }
  };

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  // Debug logging
  console.log("🛒 Cart Debug:", {
    cartItemsLength: cartItems.length,
    cartItemsCount,
    cartItems: cartItems.map(item => ({ id: item.id, productId: item.productId, quantity: item.quantity, productName: item.product?.name }))
  });
  
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      if (!item.product || !item.product.price) return total;
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
