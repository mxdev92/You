import { useQuery } from "@tanstack/react-query";
import { Gift, Truck, Tag } from "lucide-react";
import type { PromotionTier } from "@shared/schema";

interface PromotionProgressBarProps {
  cartTotal: number;
}

interface PromotionCalculation {
  currentTier: PromotionTier | null;
  nextTier: PromotionTier | null;
  amountToNext: number;
  freeDelivery: boolean;
  discountAmount: number;
  allTiers: PromotionTier[];
}

export default function PromotionProgressBar({ cartTotal }: PromotionProgressBarProps) {
  const { data: promoData, isLoading } = useQuery<PromotionCalculation>({
    queryKey: ['/api/promotions/calculate', cartTotal],
    enabled: cartTotal > 0,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  if (isLoading || !promoData || promoData.allTiers.length === 0) {
    return null;
  }

  const { currentTier, nextTier, amountToNext, allTiers } = promoData;
  
  // Calculate progress percentage for the entire promotion journey
  const maxAmount = Math.max(...allTiers.map(t => t.minAmount || 0));
  const progressPercent = maxAmount > 0 ? Math.min((cartTotal / maxAmount) * 100, 100) : 0;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ar-IQ') + ' د.ع';
  };

  const getRewardText = (tier: PromotionTier) => {
    if (tier.rewardType === 'free_delivery') {
      return 'توصيل مجاني';
    } else if (tier.rewardType === 'discount') {
      return `خصم ${formatAmount(tier.rewardValue)}`;
    }
    return '';
  };

  const getRewardIcon = (tier: PromotionTier) => {
    if (tier.rewardType === 'free_delivery') {
      return <Truck className="h-3 w-3" />;
    }
    return <Tag className="h-3 w-3" />;
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 mb-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Gift className="h-4 w-4 text-green-600" />
        <span className="text-xs font-semibold text-green-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          عروض التسوق
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div 
          className="absolute top-0 right-0 h-full bg-gradient-to-l from-green-500 to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Tier markers */}
        {allTiers.map((tier, index) => {
          const tierPercent = maxAmount > 0 ? (tier.minAmount / maxAmount) * 100 : 0;
          const isAchieved = cartTotal >= tier.minAmount;
          return (
            <div
              key={tier.id}
              className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border ${
                isAchieved 
                  ? 'bg-green-600 border-green-700' 
                  : 'bg-white border-gray-400'
              }`}
              style={{ right: `${tierPercent}%`, transform: 'translate(50%, -50%)' }}
              data-testid={`tier-marker-${tier.id}`}
            />
          );
        })}
      </div>

      {/* Current reward or next goal */}
      {currentTier ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-green-700">
            {getRewardIcon(currentTier)}
            <span className="text-xs font-medium" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              حصلت على: {getRewardText(currentTier)}
            </span>
          </div>
          {nextTier && (
            <span className="text-xs text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              أضف {formatAmount(amountToNext)} للحصول على {getRewardText(nextTier)}
            </span>
          )}
        </div>
      ) : nextTier ? (
        <div className="flex items-center justify-center gap-1 text-gray-700">
          <span className="text-xs" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            أضف {formatAmount(amountToNext)} للحصول على {getRewardText(nextTier)}
          </span>
        </div>
      ) : null}

      {/* All tiers summary */}
      <div className="mt-2 pt-2 border-t border-green-200 flex flex-wrap gap-2">
        {allTiers.map((tier) => {
          const isAchieved = cartTotal >= tier.minAmount;
          return (
            <div
              key={tier.id}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isAchieved 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
              data-testid={`tier-badge-${tier.id}`}
            >
              {getRewardIcon(tier)}
              <span style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                {formatAmount(tier.minAmount)}+
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
