import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/firebase";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

interface AddToCartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export function useCart() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: AddToCartItem) => {
    setIsLoading(true);
    
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(cartItem => cartItem.productId === item.productId);
    
    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += item.quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item
      const newCartItem: CartItem = {
        id: Date.now().toString(), // Simple ID generation
        productId: item.productId,
        quantity: item.quantity,
        product: item.product
      };
      setCartItems(prev => [...prev, newCartItem]);
    }
    
    setIsLoading(false);
    toast({
      title: "تم إضافة المنتج",
      description: "تم إضافة المنتج إلى السلة بنجاح",
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "تم حذف المنتج",
      description: "تم حذف المنتج من السلة",
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "تم مسح السلة",
      description: "تم حذف جميع المنتجات من السلة",
    });
  };

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
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
    isAdding: isLoading,
    isRemoving: false,
    isUpdating: false,
  };
}