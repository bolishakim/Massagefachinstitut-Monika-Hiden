/**
 * Utility function to calculate the actual session count from a service name.
 * This handles multi-session services like "10 Teilmassage + 1 Teilmassage gratis" = 11 sessions
 */

export function calculateSessionCountFromServiceName(serviceName: string): number {
  // Convert to lowercase for easier matching
  const name = serviceName.toLowerCase();
  
  // Pattern 1: "10 Teilmassage + 1 Teilmassage gratis" = 11 sessions
  const voucher10Plus1 = name.match(/(\d+).*?\+.*?(\d+).*?(gratis|free)/i);
  if (voucher10Plus1) {
    const main = parseInt(voucher10Plus1[1]);
    const bonus = parseInt(voucher10Plus1[2]);
    return main + bonus;
  }
  
  // Pattern 2: "Kombi: service1 und service2" = 2 sessions
  if (name.includes('kombi:') && name.includes('und')) {
    return 2;
  }
  
  // Pattern 3: Look for numbers at the beginning indicating multiple sessions
  const leadingNumber = name.match(/^(\d+)x?\s/);
  if (leadingNumber) {
    return parseInt(leadingNumber[1]);
  }
  
  // Pattern 4: General "X + Y" pattern
  const plusPattern = name.match(/(\d+).*?\+.*?(\d+)/);
  if (plusPattern) {
    const first = parseInt(plusPattern[1]);
    const second = parseInt(plusPattern[2]);
    return first + second;
  }
  
  // Pattern 5: Services with multiple components indicated by "und" (and)
  if (name.includes(' und ') && !name.includes('kombi:')) {
    // Count components separated by "und"
    const components = name.split(' und ').length;
    return components;
  }
  
  // Default: single session
  return 1;
}

/**
 * Helper function to get the total actual sessions for a package item
 */
export function getTotalSessionsForPackageItem(
  packageItemCount: number, 
  serviceSessionCount: number
): number {
  return packageItemCount * serviceSessionCount;
}

/**
 * Helper function to get the total used sessions for a package item
 */
export function getUsedSessionsForPackageItem(
  completedCount: number,
  serviceSessionCount: number
): number {
  return completedCount * serviceSessionCount;
}