import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// Professional instant data loading hook
export function useInstantData<T>(queryKey: string[], enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery<T>({
    queryKey,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes in memory
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Critical: use cache first
    networkMode: 'online', // Only fetch when online
    retry: (failureCount, error) => {
      // Smart retry logic
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: 200, // Fast retries
  });

  // Prefetch related data based on user behavior
  useEffect(() => {
    if (query.data && enabled) {
      // Intelligent prefetching based on the current data
      const baseKey = queryKey[0];
      
      if (baseKey === '/api/categories') {
        // Prefetch the first category's products
        const categories = query.data as any[];
        const firstCategory = categories?.[0];
        if (firstCategory) {
          queryClient.prefetchQuery({
            queryKey: ['/api/products', firstCategory.id],
            staleTime: 5 * 60 * 1000,
          });
        }
      }
    }
  }, [query.data, queryKey, queryClient, enabled]);

  return {
    ...query,
    // Enhanced loading states for better UX
    isInitialLoading: query.isLoading && !query.data,
    isBackgroundLoading: query.isFetching && !!query.data,
  };
}

// Hook for instant category switching
export function useInstantProducts(categoryId?: number) {
  const queryClient = useQueryClient();
  
  const query = useInstantData<any[]>(['/api/products', categoryId]);
  
  // Preload adjacent categories when user views current category
  useEffect(() => {
    if (categoryId && query.data) {
      // Get categories to find adjacent ones
      const categories = queryClient.getQueryData<any[]>(['/api/categories']);
      if (categories) {
        const currentIndex = categories.findIndex(cat => cat.id === categoryId);
        const nextCategory = categories[currentIndex + 1];
        const prevCategory = categories[currentIndex - 1];
        
        // Preload adjacent categories for instant switching
        [nextCategory, prevCategory].forEach(category => {
          if (category) {
            queryClient.prefetchQuery({
              queryKey: ['/api/products', category.id],
              staleTime: 5 * 60 * 1000,
            });
          }
        });
      }
    }
  }, [categoryId, query.data, queryClient]);
  
  return query;
}

// Global data preloader
export function useDataPreloader() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Preload critical data on app start
    const criticalQueries = [
      { queryKey: ['/api/categories'], staleTime: 10 * 60 * 1000 },
      { queryKey: ['/api/products'], staleTime: 5 * 60 * 1000 },
    ];
    
    criticalQueries.forEach(({ queryKey, staleTime }) => {
      queryClient.prefetchQuery({
        queryKey,
        staleTime,
      });
    });
    
    // Background prefetch of likely user actions
    setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['/api/auth/session'],
        staleTime: 2 * 60 * 1000,
      });
    }, 1000); // Delay to not block initial render
    
  }, [queryClient]);
}