import { useQuery } from '@tanstack/react-query';

interface Settings {
  delivery_fee: number;
  [key: string]: any;
}

export const useSettings = () => {
  return useQuery<Settings>({
    queryKey: ['/api/settings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDeliveryFee = () => {
  const { data: settings, isLoading, error } = useSettings();
  
  return {
    deliveryFee: settings?.delivery_fee || 3500, // fallback to 3500 if not loaded
    isLoading,
    error
  };
};