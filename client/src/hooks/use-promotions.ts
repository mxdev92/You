import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { PromotionTier } from "@shared/schema";

interface PromotionReward {
  freeDelivery: boolean;
  discountAmount: number;
}

export function usePromotions(cartTotal: number, baseDeliveryFee: number = 2000) {
  // Fetch tiers only once - stable cached data
  const { data: tiers = [] } = useQuery<PromotionTier[]>({
    queryKey: ['/api/admin/promotions/tiers'],
    queryFn: () => fetch('/api/admin/promotions/tiers').then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 300000,
    gcTime: 600000,
  });

  // Calculate rewards locally - FREE DELIVERY STAYS + HIGHEST DISCOUNT
  const reward = useMemo<PromotionReward>(() => {
    const enabledTiers = tiers.filter(t => t.isEnabled);
    
    if (enabledTiers.length === 0) {
      return { freeDelivery: false, discountAmount: 0 };
    }

    // Check if ANY free delivery tier is reached (stays permanent)
    const freeDeliveryTiers = enabledTiers.filter(t => t.rewardType === 'free_delivery');
    const hasFreeDelivery = freeDeliveryTiers.some(tier => cartTotal >= tier.minAmount);

    // Find the HIGHEST discount tier reached (only one, not cumulative)
    const discountTiers = enabledTiers
      .filter(t => t.rewardType === 'discount' && cartTotal >= t.minAmount)
      .sort((a, b) => b.rewardValue - a.rewardValue); // Sort by value descending
    
    const highestDiscount = discountTiers.length > 0 ? discountTiers[0].rewardValue : 0;

    return {
      freeDelivery: hasFreeDelivery,
      discountAmount: highestDiscount
    };
  }, [cartTotal, tiers]);

  // Calculate final values - all memoized for stability
  const calculations = useMemo(() => {
    const subtotal = cartTotal;
    const deliveryFee = reward.freeDelivery ? 0 : baseDeliveryFee;
    const discount = reward.discountAmount;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    return {
      subtotal,
      deliveryFee,
      baseDeliveryFee,
      discount,
      total,
      hasFreeDelivery: reward.freeDelivery,
      hasDiscount: reward.discountAmount > 0,
    };
  }, [cartTotal, baseDeliveryFee, reward]);

  return calculations;
}

// Export tiers for the progress bar
export function usePromotionTiers() {
  const { data: tiers = [], isLoading } = useQuery<PromotionTier[]>({
    queryKey: ['/api/admin/promotions/tiers'],
    queryFn: () => fetch('/api/admin/promotions/tiers').then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 300000,
    gcTime: 600000,
  });

  const enabledTiers = useMemo(() => {
    return tiers
      .filter(t => t.isEnabled)
      .sort((a, b) => a.tierRank - b.tierRank);
  }, [tiers]);

  return { tiers: enabledTiers, isLoading };
}
