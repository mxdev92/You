import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      // Check if response is HTML (common for server errors)
      if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
        throw new Error(`${res.status}: Server returned HTML instead of JSON`);
      }
      throw new Error(`${res.status}: ${text || res.statusText}`);
    } catch (error) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Enhanced JSON parsing with error handling
    try {
      const text = await res.text();
      console.log('API Response URL:', res.url);
      console.log('API Response Status:', res.status);
      console.log('API Response Text (first 200 chars):', text.substring(0, 200));
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      // Check if response is HTML (common for server errors)
      if (text.includes('<html>') || text.includes('<!DOCTYPE') || text.includes('<title>')) {
        console.error('Server returned HTML page instead of JSON:', text.substring(0, 500));
        throw new Error('Server error - received HTML instead of JSON data');
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON parsing error details:', {
        url: res.url,
        status: res.status,
        error: error.message,
        responseStart: text?.substring(0, 100)
      });
      
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        // Log the specific URL and response causing the JSON error
        console.error('JSON SYNTAX ERROR DETAILS:', {
          url: res.url,
          status: res.status,
          responseHeaders: Object.fromEntries(res.headers.entries()),
          responseText: text
        });
        throw new Error('خطأ في إنشاء الجلسات - يرجى تحديث الصفحة');
      }
      
      throw new Error(`خطأ في البيانات: ${error.message}`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - aggressive caching for instant loading
      gcTime: 30 * 60 * 1000, // 30 minutes - keep data in memory longer
      retry: 1, // Limited retries for speed
      retryDelay: 200, // Fast retry
      refetchOnMount: false, // Use cache first for instant loading
      networkMode: 'always', // Always try to use cache first
    },
    mutations: {
      retry: false,
      onSuccess: () => {
        // Invalidate related queries after successful mutations
        queryClient.invalidateQueries();
      },
    },
  },
});
