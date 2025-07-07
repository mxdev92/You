// Meta Pixel tracking utilities for PAKETY
// Pixel ID: 633631792409825

declare global {
  interface Window {
    fbq: any;
  }
}

export class MetaPixelTracker {
  private static pixelId = '633631792409825';
  
  // Check if Meta Pixel is loaded
  private static isLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  }

  // Track page view
  static trackPageView(): void {
    if (this.isLoaded()) {
      window.fbq('track', 'PageView');
      console.log('📊 Meta Pixel: PageView tracked');
    }
  }

  // Track when user views content (product page)
  static trackViewContent(contentName: string, contentType: string = 'product', value?: number): void {
    if (this.isLoaded()) {
      window.fbq('track', 'ViewContent', {
        content_name: contentName,
        content_type: contentType,
        value: value,
        currency: 'IQD'
      });
      console.log('📊 Meta Pixel: ViewContent tracked -', contentName);
    }
  }

  // Track when user adds item to cart
  static trackAddToCart(contentName: string, value: number, quantity: number = 1): void {
    if (this.isLoaded()) {
      window.fbq('track', 'AddToCart', {
        content_name: contentName,
        value: value,
        currency: 'IQD',
        content_type: 'product',
        num_items: quantity
      });
      console.log('📊 Meta Pixel: AddToCart tracked -', contentName, 'Value:', value);
    }
  }

  // Track when user initiates checkout
  static trackInitiateCheckout(value: number, numItems: number): void {
    if (this.isLoaded()) {
      window.fbq('track', 'InitiateCheckout', {
        value: value,
        currency: 'IQD',
        num_items: numItems,
        content_type: 'product'
      });
      console.log('📊 Meta Pixel: InitiateCheckout tracked - Value:', value, 'Items:', numItems);
    }
  }

  // Track completed purchase
  static trackPurchase(value: number, orderId: string, numItems: number): void {
    if (this.isLoaded()) {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: 'IQD',
        content_type: 'product',
        num_items: numItems,
        order_id: orderId
      });
      console.log('📊 Meta Pixel: Purchase tracked - Order:', orderId, 'Value:', value);
    }
  }

  // Track user registration/signup
  static trackCompleteRegistration(): void {
    if (this.isLoaded()) {
      window.fbq('track', 'CompleteRegistration');
      console.log('📊 Meta Pixel: CompleteRegistration tracked');
    }
  }

  // Track search events
  static trackSearch(searchString: string): void {
    if (this.isLoaded()) {
      window.fbq('track', 'Search', {
        search_string: searchString,
        content_type: 'product'
      });
      console.log('📊 Meta Pixel: Search tracked -', searchString);
    }
  }

  // Track lead generation (contact form, etc.)
  static trackLead(): void {
    if (this.isLoaded()) {
      window.fbq('track', 'Lead');
      console.log('📊 Meta Pixel: Lead tracked');
    }
  }

  // Custom event tracking
  static trackCustomEvent(eventName: string, parameters?: any): void {
    if (this.isLoaded()) {
      window.fbq('trackCustom', eventName, parameters);
      console.log('📊 Meta Pixel: Custom event tracked -', eventName, parameters);
    }
  }
}

export default MetaPixelTracker;