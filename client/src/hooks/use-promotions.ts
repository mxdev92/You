import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { PromotionTier } from "@shared/schema";

interface PromotionReward {
  freeDelivery: boolean;
  discountAmount: number;
  currentTierLabel: string | null;
}

export function usePromotions(cartTotal: number, baseDeliveryFee: number = 2000) {
  // Fetch tiers only once - stable cached data
  const { data: tiers = [] } = useQuery<PromotionTier[]>({
    queryKey: ['/api/admin/promotions/tiers'],
    queryFn: () => fetch('/api/admin/promotions/tiers').then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000, // Keep in cache for 10 minutes
  });

  // Calculate rewards locally based on cached tiers - NO network calls
  const reward = useMemo<PromotionReward>(() => {
    // Sort enabled tiers by minAmount (ascending)
    const enabledTiers = tiers
      .filter(t => t.isEnabled)
      .sort((a, b) => a.minAmount - b.minAmount);

    if (enabledTiers.length === 0) {
      return { freeDelivery: false, discountAmount: 0, currentTierLabel: null };
    }

    // Find the highest tier the user qualifies for
    let currentTier: PromotionTier | null = null;
    for (let i = enabledTiers.length - 1; i >= 0; i--) {
      if (cartTotal >= enabledTiers[i].minAmount) {
        currentTier = enabledTiers[i];
        break;
      }
    }

    if (!currentTier) {
      return { freeDelivery: false, discountAmount: 0, currentTierLabel: null };
    }

    // User gets ONE reward only based on the highest tier reached
    if (currentTier.rewardType === 'free_delivery') {
      return {
        freeDelivery: true,
        discountAmount: 0,
        currentTierLabel: 'توصيل مجاني'
      };
    } else {
      // Discount tier - user gets discount (NOT free delivery)
      return {
        freeDelivery: false,
        discountAmount: currentTier.rewardValue,
        currentTierLabel: `خصم ${currentTier.rewardValue.toLocaleString('ar-IQ')}`
      };
    }
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
      currentTierLabel: reward.currentTierLabel,
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
