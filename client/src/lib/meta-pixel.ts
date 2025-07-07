// Meta Pixel tracking utility functions
declare global {
  interface Window {
    fbq: any;
  }
}

export const MetaPixel = {
  // Track when user views a product
  trackViewContent: (productName: string, price: string, currency = 'IQD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: productName,
        value: parseFloat(price.replace(/,/g, '')),
        currency: currency
      });
    }
  },

  // Track when user adds product to cart
  trackAddToCart: (productName: string, price: string, currency = 'IQD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: productName,
        value: parseFloat(price.replace(/,/g, '')),
        currency: currency
      });
    }
  },

  // Track when user starts checkout process
  trackInitiateCheckout: (totalValue: number, currency = 'IQD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: totalValue,
        currency: currency
      });
    }
  },

  // Track successful purchase
  trackPurchase: (totalValue: number, orderId: string, currency = 'IQD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: totalValue,
        currency: currency,
        content_ids: [orderId]
      });
    }
  },

  // Track user registration/signup
  trackCompleteRegistration: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'CompleteRegistration');
    }
  },

  // Track user login
  trackLogin: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Login');
    }
  },

  // Track search events
  trackSearch: (searchTerm: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Search', {
        search_string: searchTerm
      });
    }
  },

  // Track custom events
  trackCustomEvent: (eventName: string, parameters?: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, parameters);
    }
  }
};