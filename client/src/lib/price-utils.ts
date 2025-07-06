/**
 * Formats a price number with comma separators for better readability
 * @param price - The price as a number or string
 * @returns Formatted price string with commas (e.g., "1,000", "10,000", "100,000")
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0';
  }
  
  // Format with comma separators (1,000 format)
  return numPrice.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
}

/**
 * Formats a price with IQD currency
 * @param price - The price as a number or string
 * @returns Formatted price string with commas and IQD (e.g., "1,000 IQD")
 */
export function formatPriceWithCurrency(price: number | string): string {
  return `${formatPrice(price)} IQD`;
}