/**
 * Input validation utilities for Settings & Configuration Management
 * Server-side validation to prevent invalid data storage
 */

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if valid email format, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5322 simplified email regex
  // Requires at least one dot in domain part
  // Prevents injection attacks through strict pattern matching
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates international phone format
 * Accepts format: +1234567890 (with optional spaces/dashes)
 * @param phone - Phone number to validate
 * @returns true if valid international format, false otherwise
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // International format: starts with +, followed by 7-15 digits
  // Allows optional spaces, dashes, and parentheses for readability
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  
  // Remove common formatting characters before validation
  const cleaned = phone.replace(/[\s\-().]/g, '');
  
  return phoneRegex.test(cleaned);
}

/**
 * Validates that a required field is not empty
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message if validation fails, null if valid
 */
export function validateRequired(value: any, fieldName: string): string | null {
  // Handle null, undefined, empty string, empty arrays
  if (value === null || value === undefined) {
    return `${fieldName} is required`;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }

  if (Array.isArray(value) && value.length === 0) {
    return `${fieldName} is required`;
  }

  return null;
}

/**
 * Validates that a value is in the allowed list
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Name of the field for error message
 * @returns Error message if validation fails, null if valid
 */
export function validateEnum(
  value: string,
  allowedValues: string[],
  fieldName: string
): string | null {
  if (!value || typeof value !== 'string') {
    return `${fieldName} is required`;
  }

  if (!allowedValues.includes(value)) {
    return `Invalid ${fieldName}: ${value}`;
  }

  return null;
}
