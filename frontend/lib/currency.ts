/**
 * Format number as Indian Rupee currency
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with ₹ symbol
 */
export function formatCurrency(amount: number | undefined | null, decimals: number = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `₹0.${'0'.repeat(decimals)}`
  }
  
  // Format with Indian number system (lakhs, crores)
  const formatted = amount.toFixed(decimals)
  
  // Add comma separators for thousands
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return `₹${parts.join('.')}`
}

/**
 * Format number with Indian number formatting (lakhs, crores)
 * @param amount - The amount to format
 * @returns Formatted string
 */
export function formatIndianCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00'
  }
  
  // For amounts in lakhs (100,000)
  if (amount >= 100000) {
    const lakhs = amount / 100000
    return `₹${lakhs.toFixed(2)}L`
  }
  
  // For amounts in crores (10,000,000)
  if (amount >= 10000000) {
    const crores = amount / 10000000
    return `₹${crores.toFixed(2)}Cr`
  }
  
  // Regular formatting with commas
  return formatCurrency(amount)
}



