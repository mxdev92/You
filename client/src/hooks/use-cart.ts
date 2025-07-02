import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CartItem, Product, InsertCartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  const addToCartMutation = useMutation({
    mutationFn: async (item: InsertCartItem) => {
      const response = await apiRequest("POST", "/api/cart", item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item quantity.",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (item: InsertCartItem) => addToCartMutation.mutate(item);
  const removeFromCart = (itemId: number) => removeFromCartMutation.mutate(itemId);
  const updateQuantity = (itemId: number, quantity: number) => 
    updateQuantityMutation.mutate({ itemId, quantity });
  const clearCart = () => clearCartMutation.mutate();

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
    isAdding: addToCartMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
  };
}
