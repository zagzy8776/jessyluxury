/**
 * Masks sensitive secret values for display in API responses
 * Never logs or returns original secret values
 * 
 * @param value - The secret value to mask (or null/undefined)
 * @returns Masked string with format: "ab••••••••9a21" or "" for null/empty
 */
export function maskSecret(value: string | null | undefined): string {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // For short strings (less than 6 characters), fully mask with exactly 6 bullets
  if (value.length < 6) {
    return '••••••';
  }

  const firstTwo = value.slice(0, 2);
  
  // For length 6-7: use 4 bullets minimum, show last 2
  // For length 8-9: use 6 bullets minimum, show last 2  
  // For length 10+: use 6 bullets minimum, show last 4
  
  let lastChars: string;
  let middleLength: number;
  
  if (value.length <= 7) {
    // For 6-7 chars: show first 2, then min 4 bullets, then last 2
    lastChars = value.slice(-2);
    middleLength = Math.max(4, value.length - 4); // length - (first 2 + last 2)
  } else if (value.length <= 9) {
    // For 8-9 chars: show first 2, then min 6 bullets, then last 2
    lastChars = value.slice(-2);
    middleLength = Math.max(6, value.length - 4); // length - (first 2 + last 2)
  } else {
    // For 10+ chars: show first 2, then min 6 bullets, then last 4
    lastChars = value.slice(-4);
    middleLength = Math.max(6, value.length - 6); // length - (first 2 + last 4)
  }
  
  const bullets = '•'.repeat(middleLength);
  
  return `${firstTwo}${bullets}${lastChars}`;
}
