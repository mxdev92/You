import { useQuery } from "@tanstack/react-query";
import { Check, Gift } from "lucide-react";
import { useMemo } from "react";
import type { PromotionTier } from "@shared/schema";

interface PromotionProgressBarProps {
  cartTotal: number;
}

export default function PromotionProgressBar({ cartTotal }: PromotionProgressBarProps) {
  // Fetch tiers only once - cached for stability
  const { data: tiers = [] } = useQuery<PromotionTier[]>({
    queryKey: ['/api/admin/promotions/tiers'],
    queryFn: () => fetch('/api/admin/promotions/tiers').then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  // Build steps from tiers - memoized for performance
  const displaySteps = useMemo(() => {
    const enabledTiers = tiers
      .filter(t => t.isEnabled)
      .sort((a, b) => a.tierRank - b.tierRank);

    if (enabledTiers.length === 0) {
      // Default steps if no tiers loaded
      return [
        { id: 0, label: 'البداية', amount: 0 },
        { id: 1, label: 'توصيل مجاني', amount: 15000 },
        { id: 2, label: 'خصم 2,000', amount: 35000 },
        { id: 3, label: 'خصم 5,000', amount: 50000 },
      ];
    }

    return [
      { id: 0, label: 'البداية', amount: 0 },
      ...enabledTiers.map(tier => ({
        id: tier.id,
        label: tier.rewardType === 'free_delivery' 
          ? 'توصيل مجاني' 
          : `خصم ${tier.rewardValue.toLocaleString('ar-IQ')}`,
        amount: tier.minAmount,
      }))
    ];
  }, [tiers]);

  // Calculate progress in real-time based on cartTotal
  const { currentStepIndex, progressPercent } = useMemo(() => {
    // Find current step
    let stepIndex = 0;
    for (let i = displaySteps.length - 1; i >= 0; i--) {
      if (cartTotal >= displaySteps[i].amount) {
        stepIndex = i;
        break;
      }
    }

    // Calculate progress percentage
    let progress = 0;
    if (displaySteps.length <= 1) {
      progress = 0;
    } else if (stepIndex >= displaySteps.length - 1) {
      progress = 100;
    } else {
      const currentStep = displaySteps[stepIndex];
      const nextStep = displaySteps[stepIndex + 1];
      const stepRange = nextStep.amount - currentStep.amount;
      const progressInStep = cartTotal - currentStep.amount;
      const stepProgress = stepRange > 0 ? (progressInStep / stepRange) : 0;
      
      const completedPercent = (stepIndex / (displaySteps.length - 1)) * 100;
      const stepPercent = (1 / (displaySteps.length - 1)) * 100 * stepProgress;
      
      progress = Math.min(completedPercent + stepPercent, 100);
    }

    return { currentStepIndex: stepIndex, progressPercent: progress };
  }, [cartTotal, displaySteps]);

  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-3" dir="rtl">
      {/* Step Icons */}
      <div className="flex justify-between items-center mb-1">
        {displaySteps.map((step, index) => {
          const isCompleted = cartTotal >= step.amount;
          const isCurrent = index === currentStepIndex && cartTotal > 0;
          
          return (
            <div key={step.id} className="flex flex-col items-center" style={{ width: '22%' }}>
              {/* Icon Circle */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                  isCompleted 
                    ? index === 0 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`text-[10px] mt-1 text-center leading-tight transition-colors duration-200 ${
                  isCompleted ? 'text-gray-800 font-medium' : 'text-gray-500'
                }`}
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-1.5 bg-gray-200 rounded-full mx-4 mb-1">
        <div 
          className="absolute top-0 right-0 h-full bg-green-500 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Amount Labels (in thousands) */}
      <div className="flex justify-between items-center px-1">
        {displaySteps.map((step) => (
          <span 
            key={step.id} 
            className="text-[10px] text-gray-500"
            style={{ width: '22%', textAlign: 'center' }}
          >
            {step.amount === 0 ? '0' : Math.round(step.amount / 1000)}
          </span>
        ))}
      </div>
    </div>
  );
}
