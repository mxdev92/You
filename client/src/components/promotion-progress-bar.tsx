import { Check, Target } from "lucide-react";
import { useMemo } from "react";
import { usePromotionTiers } from "@/hooks/use-promotions";

interface PromotionProgressBarProps {
  cartTotal: number;
}

export default function PromotionProgressBar({ cartTotal }: PromotionProgressBarProps) {
  const { tiers } = usePromotionTiers();

  // Build steps from tiers - memoized for stability
  const displaySteps = useMemo(() => {
    if (tiers.length === 0) {
      return [
        { id: 0, label: 'البداية', amount: 0 },
        { id: 1, label: 'توصيل مجاني', amount: 15000 },
        { id: 2, label: 'خصم 2,000', amount: 35000 },
        { id: 3, label: 'خصم 5,000', amount: 50000 },
      ];
    }

    return [
      { id: 0, label: 'البداية', amount: 0 },
      ...tiers.map(tier => ({
        id: tier.id,
        label: tier.rewardType === 'free_delivery' 
          ? 'توصيل مجاني' 
          : `خصم ${tier.rewardValue.toLocaleString('ar-IQ')}`,
        amount: tier.minAmount,
      }))
    ];
  }, [tiers]);

  // Calculate progress - all local, no network calls
  const { currentStepIndex, progressPercent } = useMemo(() => {
    let stepIndex = 0;
    for (let i = displaySteps.length - 1; i >= 0; i--) {
      if (cartTotal >= displaySteps[i].amount) {
        stepIndex = i;
        break;
      }
    }

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
      {/* Step Icons - Equal spacing */}
      <div className="flex justify-between items-start mb-2">
        {displaySteps.map((step, index) => {
          const isCompleted = cartTotal >= step.amount;
          
          return (
            <div 
              key={step.id} 
              className="flex flex-col items-center"
              style={{ flex: '1 1 0', maxWidth: '25%' }}
            >
              {/* Icon Circle */}
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-150 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : (
                  <Target className="h-4 w-4" />
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`text-[10px] mt-1.5 text-center leading-tight transition-colors duration-150 ${
                  isCompleted ? 'text-gray-800 font-semibold' : 'text-gray-500'
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
      <div className="relative h-2 bg-gray-200 rounded-full mx-2 mb-2 overflow-hidden">
        <div 
          className="absolute top-0 right-0 h-full bg-gradient-to-l from-green-500 to-green-400 rounded-full transition-[width] duration-150 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Amount Labels (in thousands) - Equal spacing */}
      <div className="flex justify-between items-center mx-2">
        {displaySteps.map((step) => (
          <span 
            key={step.id} 
            className="text-[11px] text-gray-500 font-medium"
            style={{ flex: '1 1 0', maxWidth: '25%', textAlign: 'center' }}
          >
            {step.amount === 0 ? '0' : Math.round(step.amount / 1000)}
          </span>
        ))}
      </div>
    </div>
  );
}
