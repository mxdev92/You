import { useQuery } from "@tanstack/react-query";
import { Check, Gift } from "lucide-react";
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
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  if (isLoading || !promoData) {
    return null;
  }

  const { allTiers } = promoData;
  
  // Define 4 steps: Start, Free Delivery, 2000 Discount, 5000 Discount
  const steps = [
    { id: 0, label: 'البداية', amount: 0, rewardType: 'start' },
    ...allTiers.map(tier => ({
      id: tier.id,
      label: tier.rewardType === 'free_delivery' ? 'توصيل مجاني' : `خصم ${(tier.rewardValue / 1000).toLocaleString('ar-IQ')},000`,
      amount: tier.minAmount,
      rewardType: tier.rewardType
    }))
  ];

  // Find max amount for progress calculation
  const maxAmount = steps.length > 1 ? steps[steps.length - 1].amount : 1;
  
  // Calculate which step is current
  const getCurrentStepIndex = () => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (cartTotal >= steps[i].amount) {
        return i;
      }
    }
    return 0;
  };
  
  const currentStepIndex = getCurrentStepIndex();
  
  // Calculate progress percentage between steps
  const getProgressPercent = () => {
    if (currentStepIndex >= steps.length - 1) return 100;
    
    const currentStep = steps[currentStepIndex];
    const nextStep = steps[currentStepIndex + 1];
    const stepRange = nextStep.amount - currentStep.amount;
    const progressInStep = cartTotal - currentStep.amount;
    const stepProgress = stepRange > 0 ? (progressInStep / stepRange) : 0;
    
    // Calculate total progress: completed steps + current step progress
    const completedPercent = (currentStepIndex / (steps.length - 1)) * 100;
    const stepPercent = (1 / (steps.length - 1)) * 100 * stepProgress;
    
    return Math.min(completedPercent + stepPercent, 100);
  };

  const progressPercent = getProgressPercent();

  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-3" dir="rtl">
      {/* Step Icons */}
      <div className="flex justify-between items-center mb-1">
        {steps.map((step, index) => {
          const isCompleted = cartTotal >= step.amount;
          const isCurrent = index === currentStepIndex && cartTotal > 0;
          
          return (
            <div key={step.id} className="flex flex-col items-center" style={{ width: '22%' }}>
              {/* Icon Circle */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
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
                className={`text-[10px] mt-1 text-center leading-tight ${
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
          className="absolute top-0 right-0 h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Amount Labels */}
      <div className="flex justify-between items-center px-1">
        {steps.map((step) => (
          <span 
            key={step.id} 
            className="text-[10px] text-gray-500"
            style={{ width: '22%', textAlign: 'center' }}
          >
            {step.amount === 0 ? '0' : (step.amount / 1000).toLocaleString('ar-IQ')}
          </span>
        ))}
      </div>
    </div>
  );
}
