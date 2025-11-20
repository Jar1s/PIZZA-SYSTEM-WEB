/**
 * Phone number utility functions
 * Centralized phone number formatting to avoid duplication
 */

export class PhoneUtil {
  /**
   * Format phone number to E.164 format (e.g., +421912345678)
   * @param phone Phone number in any format
   * @returns Formatted phone number in E.164 format
   */
  static formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Slovak numbers (9 digits)
    if (!cleaned.startsWith('421') && cleaned.length === 9) {
      cleaned = '421' + cleaned;
    }
    
    // Add + prefix if missing
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
  
  /**
   * Validate phone number format
   * @param phone Phone number to validate
   * @returns true if phone number is valid E.164 format
   */
  static isValidPhone(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    // E.164 format: +[country code][number], 10-15 digits total
    return /^\+\d{10,15}$/.test(formatted);
  }
  
  /**
   * Normalize phone number for comparison
   * @param phone Phone number to normalize
   * @returns Normalized phone number
   */
  static normalize(phone: string): string {
    return this.formatPhoneNumber(phone);
  }
}

