import { prisma } from './prisma';

/**
 * List of sensitive field names that should be filtered out from audit log details
 * These fields may contain secrets, passwords, keys, or tokens
 */
const SENSITIVE_FIELD_PATTERNS = [
  'secret',
  'password',
  'key',
  'token',
  'apikey',
  'api_key',
];

/**
 * Filters out sensitive fields from an object before logging
 * Removes any keys containing patterns like "secret", "password", "key", "token"
 * 
 * @param details - The object to filter
 * @returns A new object with sensitive fields removed
 */
function filterSensitiveFields(details: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    
    // Check if the key contains any sensitive pattern
    const isSensitive = SENSITIVE_FIELD_PATTERNS.some(pattern => 
      lowerKey.includes(pattern)
    );
    
    if (!isSensitive) {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

/**
 * Creates an audit log entry for sensitive mutations
 * This function records changes to critical system entities while protecting secrets
 * 
 * Key Features:
 * - Never throws errors (catches and logs failures)
 * - Automatically filters out sensitive fields (secrets, passwords, keys, tokens)
 * - Converts details object to JSON string for storage
 * - Does not block the main operation if audit logging fails
 * 
 * @param action - The action being performed (e.g., "BUSINESS_PROFILE_UPDATED")
 * @param entity - The entity type being modified (e.g., "BusinessProfile")
 * @param entityId - The ID of the entity being modified
 * @param details - Object containing change details (will be filtered and JSON-stringified)
 * @param changedBy - The user who made the change (e.g., "Admin", staff email)
 * 
 * @example
 * await createAuditLog(
 *   "BUSINESS_PROFILE_UPDATED",
 *   "BusinessProfile",
 *   "1",
 *   { name: "New Business Name", email: "new@example.com" },
 *   "admin@example.com"
 * );
 * 
 * @example
 * await createAuditLog(
 *   "PAYMENT_SETTINGS_UPDATED",
 *   "PaymentSettings",
 *   "1",
 *   { paymentProviderApiKey: "sk_live_abc123", merchantId: "merch_123" },
 *   "Admin"
 * );
 * // Note: paymentProviderApiKey will be filtered out automatically
 */
export async function createAuditLog(
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, unknown>,
  changedBy: string
): Promise<void> {
  try {
    // Filter out sensitive fields before stringifying
    const safeDetails = filterSensitiveFields(details);
    
    // Convert filtered details to JSON string
    const detailsJson = JSON.stringify(safeDetails);
    
    // Insert audit log record
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details: detailsJson,
        changedBy,
      },
    });
  } catch (error) {
    // Log the error but don't throw - audit failures should not block operations
    console.error('[AUDIT] Failed to create audit log:', {
      action,
      entity,
      entityId,
      changedBy,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
