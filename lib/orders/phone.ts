/**
 * Validates and normalizes phone and WhatsApp numbers into canonical international format (+234...).
 * Rejects invalid format configurations and lengths for safety.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Phone number must be a valid string');
  }

  // Strip all whitespace, dashes, parentheses, and letters
  let cleaned = rawPhone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('0')) {
    // Standard local Nigerian number: e.g. 08012345678 -> should be 11 digits
    if (cleaned.length !== 11) {
      throw new Error(`Invalid local Nigerian number length: must be 11 digits (got ${cleaned.length})`);
    }
    // Verify standard Nigerian mobile prefix starts with 7, 8, or 9
    const mobileIndicator = cleaned.charAt(1);
    if (mobileIndicator !== '7' && mobileIndicator !== '8' && mobileIndicator !== '9') {
      throw new Error(`Invalid Nigerian mobile prefix in number: "${rawPhone}"`);
    }
    cleaned = '+234' + cleaned.substring(1);
  } else if (cleaned.startsWith('234')) {
    // Nigerian number prefixed with 234: e.g. 2348012345678 -> should be 13 digits
    if (cleaned.length !== 13) {
      throw new Error(`Invalid prefixed Nigerian number length: must be 13 digits (got ${cleaned.length})`);
    }
    const mobileIndicator = cleaned.charAt(3);
    if (mobileIndicator !== '7' && mobileIndicator !== '8' && mobileIndicator !== '9') {
      throw new Error(`Invalid Nigerian mobile prefix in number: "${rawPhone}"`);
    }
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('+234')) {
    // Nigerian number prefixed with +234: e.g. +2348012345678 -> should be 14 characters
    if (cleaned.length !== 14) {
      throw new Error(`Invalid canonical Nigerian number length: must be 14 characters (got ${cleaned.length})`);
    }
    const mobileIndicator = cleaned.charAt(4);
    if (mobileIndicator !== '7' && mobileIndicator !== '8' && mobileIndicator !== '9') {
      throw new Error(`Invalid Nigerian mobile prefix in number: "${rawPhone}"`);
    }
  } else {
    // International number (non-Nigerian)
    if (!cleaned.startsWith('+')) {
      if (cleaned.length >= 8 && cleaned.length <= 15) {
        cleaned = '+' + cleaned;
      } else {
        throw new Error(`Invalid phone number format: "${rawPhone}". Must start with leading 0 or international country code.`);
      }
    }
    if (cleaned.length < 8 || cleaned.length > 17) {
      throw new Error(`Invalid international phone number length (got ${cleaned.length} digits)`);
    }
  }

  return cleaned;
}
