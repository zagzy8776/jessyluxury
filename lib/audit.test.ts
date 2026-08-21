import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { createAuditLog } from './audit.js';
import { prisma } from './prisma.js';

// Mock storage
let mockAuditLogs: any[] = [];
let consoleErrorCalls: any[] = [];
let mockCreateFn: any;
let mockConsoleError: any;

describe('createAuditLog', () => {
  beforeEach(() => {
    // Reset mock storage
    mockAuditLogs = [];
    consoleErrorCalls = [];
    
    // Mock prisma.auditLog.create
    mockCreateFn = mock.method(prisma.auditLog, 'create', async (params: any) => {
      const record = {
        id: mockAuditLogs.length + 1,
        ...params.data,
        createdAt: new Date(),
      };
      mockAuditLogs.push(record);
      return record;
    });
    
    // Mock console.error
    mockConsoleError = mock.method(console, 'error', (...args: any[]) => {
      consoleErrorCalls.push(args);
    });
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('✅ Function creates AuditLog record with all required fields', () => {
    it('should create audit log with all required fields', async () => {
      await createAuditLog(
        'BUSINESS_PROFILE_UPDATED',
        'BusinessProfile',
        '1',
        { name: 'New Name', email: 'test@example.com' },
        'admin@example.com'
      );

      assert.strictEqual(mockAuditLogs.length, 1);
      const log = mockAuditLogs[0];
      
      assert.strictEqual(log.action, 'BUSINESS_PROFILE_UPDATED');
      assert.strictEqual(log.entity, 'BusinessProfile');
      assert.strictEqual(log.entityId, '1');
      assert.strictEqual(log.details, '{"name":"New Name","email":"test@example.com"}');
      assert.strictEqual(log.changedBy, 'admin@example.com');
    });

    it('should create audit log for location creation', async () => {
      await createAuditLog(
        'LOCATION_CREATED',
        'StoreLocation',
        '5',
        { name: 'New Store', city: 'Lagos', isDefault: false },
        'Admin'
      );

      assert.strictEqual(mockAuditLogs.length, 1);
      const log = mockAuditLogs[0];
      
      assert.strictEqual(log.action, 'LOCATION_CREATED');
      assert.strictEqual(log.entity, 'StoreLocation');
      assert.strictEqual(log.entityId, '5');
      assert.strictEqual(log.changedBy, 'Admin');
      
      const details = JSON.parse(log.details);
      assert.strictEqual(details.name, 'New Store');
      assert.strictEqual(details.city, 'Lagos');
      assert.strictEqual(details.isDefault, false);
    });
  });

  describe('✅ details field is properly JSON-stringified', () => {
    it('should convert details object to JSON string', async () => {
      await createAuditLog(
        'EXPENSE_CREATED',
        'Expense',
        '10',
        { id: 10, category: 'Marketing', amount: 50000 },
        'staff@example.com'
      );

      const log = mockAuditLogs[0];
      assert.strictEqual(typeof log.details, 'string');
      
      // Verify it's valid JSON
      const parsed = JSON.parse(log.details);
      assert.strictEqual(parsed.id, 10);
      assert.strictEqual(parsed.category, 'Marketing');
      assert.strictEqual(parsed.amount, 50000);
    });

    it('should handle complex nested objects in details', async () => {
      await createAuditLog(
        'STAFF_PERMISSIONS_CHANGED',
        'StaffAccount',
        '3',
        {
          oldRole: 'Manager',
          newRole: 'Owner',
          oldPermissions: ['orders', 'products'],
          newPermissions: ['orders', 'products', 'settings'],
        },
        'admin@example.com'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.deepStrictEqual(parsed.oldPermissions, ['orders', 'products']);
      assert.deepStrictEqual(parsed.newPermissions, ['orders', 'products', 'settings']);
      assert.strictEqual(parsed.oldRole, 'Manager');
      assert.strictEqual(parsed.newRole, 'Owner');
    });

    it('should handle empty details object', async () => {
      await createAuditLog(
        'ADMIN_PASSWORD_CHANGED',
        'SystemConfig',
        '1',
        {},
        'Admin'
      );

      const log = mockAuditLogs[0];
      assert.strictEqual(log.details, '{}');
    });
  });

  describe('✅ Function never throws errors (catches and logs failures)', () => {
    it('should catch and log database errors without throwing', async () => {
      // Replace the mock with one that throws
      mock.method(prisma.auditLog, 'create', async () => {
        throw new Error('Database connection failed');
      });

      // Should not throw
      await createAuditLog(
        'BUSINESS_PROFILE_UPDATED',
        'BusinessProfile',
        '1',
        { name: 'Test' },
        'Admin'
      );

      // Verify console.error was called
      assert.strictEqual(consoleErrorCalls.length, 1);
      assert.strictEqual(consoleErrorCalls[0][0], '[AUDIT] Failed to create audit log:');
      assert.strictEqual(consoleErrorCalls[0][1].action, 'BUSINESS_PROFILE_UPDATED');
      assert.strictEqual(consoleErrorCalls[0][1].error, 'Database connection failed');
    });

    it('should handle non-Error exceptions', async () => {
      // Replace the mock with one that throws a string
      mock.method(prisma.auditLog, 'create', async () => {
        throw 'String error';
      });

      // Should not throw
      await createAuditLog(
        'LOCATION_DELETED',
        'StoreLocation',
        '2',
        { name: 'Old Store' },
        'Admin'
      );

      // Verify console.error was called
      assert.strictEqual(consoleErrorCalls.length, 1);
      assert.strictEqual(consoleErrorCalls[0][1].error, 'String error');
    });

    it('should continue operation even if audit logging fails', async () => {
      // Replace the mock with one that throws
      mock.method(prisma.auditLog, 'create', async () => {
        throw new Error('Audit log failed');
      });

      // Simulate a business operation that calls audit logging
      const businessOperation = async () => {
        await createAuditLog(
          'PAYMENT_SETTINGS_UPDATED',
          'PaymentSettings',
          '1',
          { updated: true },
          'Admin'
        );
        return 'operation completed';
      };

      // The operation should complete successfully
      const result = await businessOperation();
      assert.strictEqual(result, 'operation completed');
    });
  });

  describe('🔒 NEVER include secret values in details field', () => {
    it('should filter out fields containing "secret"', async () => {
      await createAuditLog(
        'NOTIFICATION_SETTINGS_UPDATED',
        'NotificationSettings',
        '1',
        {
          emailEnabled: true,
          resendApiKey: 'sk_live_secret123',
          oneSignalAppId: 'app_secret_456',
        },
        'Admin'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.strictEqual(parsed.emailEnabled, true);
      assert.strictEqual(parsed.resendApiKey, undefined);
      assert.strictEqual(parsed.oneSignalAppId, undefined);
    });

    it('should filter out fields containing "password"', async () => {
      await createAuditLog(
        'USER_UPDATED',
        'User',
        '1',
        {
          name: 'John Doe',
          password: 'newPassword123',
          passwordHash: 'hashed_value',
          oldPassword: 'oldPassword123',
        },
        'Admin'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.strictEqual(parsed.name, 'John Doe');
      assert.strictEqual(parsed.password, undefined);
      assert.strictEqual(parsed.passwordHash, undefined);
      assert.strictEqual(parsed.oldPassword, undefined);
    });

    it('should filter out fields containing "key"', async () => {
      await createAuditLog(
        'PAYMENT_SETTINGS_UPDATED',
        'PaymentSettings',
        '1',
        {
          merchantId: 'merch_123',
          paymentProviderApiKey: 'sk_live_abc123',
          api_key: 'key_456',
          publicKey: 'pk_789',
        },
        'Admin'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.strictEqual(parsed.merchantId, 'merch_123');
      assert.strictEqual(parsed.paymentProviderApiKey, undefined);
      assert.strictEqual(parsed.api_key, undefined);
      assert.strictEqual(parsed.publicKey, undefined);
    });

    it('should filter out fields containing "token"', async () => {
      await createAuditLog(
        'AUTH_UPDATED',
        'AuthSettings',
        '1',
        {
          userId: '123',
          accessToken: 'token_abc',
          refreshToken: 'token_xyz',
          authToken: 'token_def',
        },
        'Admin'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.strictEqual(parsed.userId, '123');
      assert.strictEqual(parsed.accessToken, undefined);
      assert.strictEqual(parsed.refreshToken, undefined);
      assert.strictEqual(parsed.authToken, undefined);
    });

    it('should be case-insensitive when filtering sensitive fields', async () => {
      await createAuditLog(
        'CONFIG_UPDATED',
        'Config',
        '1',
        {
          name: 'Config',
          SECRET_KEY: 'secret123',
          Password: 'pass123',
          ApiKey: 'key123',
          ACCESS_TOKEN: 'token123',
        },
        'Admin'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.strictEqual(parsed.name, 'Config');
      assert.strictEqual(parsed.SECRET_KEY, undefined);
      assert.strictEqual(parsed.Password, undefined);
      assert.strictEqual(parsed.ApiKey, undefined);
      assert.strictEqual(parsed.ACCESS_TOKEN, undefined);
    });

    it('should filter fields with "apikey" or "api_key" patterns', async () => {
      await createAuditLog(
        'SERVICE_UPDATED',
        'Service',
        '1',
        {
          serviceName: 'Payment Service',
          apikey: 'key123',
          api_key: 'key456',
          stripeApiKey: 'sk_test_789',
        },
        'Admin'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.strictEqual(parsed.serviceName, 'Payment Service');
      assert.strictEqual(parsed.apikey, undefined);
      assert.strictEqual(parsed.api_key, undefined);
      assert.strictEqual(parsed.stripeApiKey, undefined);
    });

    it('should keep safe fields that contain safe substrings', async () => {
      await createAuditLog(
        'PRODUCT_UPDATED',
        'Product',
        '1',
        {
          productName: 'Secret Garden Perfume', // "secret" in value, not key
          description: 'Unlock the mystery', // "key" in value, not key
          category: 'password-protected', // "password" in value, not key
        },
        'Admin'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      // These should all be present because the sensitive words are in values, not keys
      assert.strictEqual(parsed.productName, 'Secret Garden Perfume');
      assert.strictEqual(parsed.description, 'Unlock the mystery');
      assert.strictEqual(parsed.category, 'password-protected');
    });
  });

  describe('✅ Audit log creation does not block main operation', () => {
    it('should allow main operation to continue even if audit fails', async () => {
      // Replace the mock with one that throws
      mock.method(prisma.auditLog, 'create', async () => {
        throw new Error('Audit failed');
      });

      let mainOperationCompleted = false;

      const mainOperation = async () => {
        // Call audit log
        await createAuditLog(
          'BUSINESS_PROFILE_UPDATED',
          'BusinessProfile',
          '1',
          { name: 'Test' },
          'Admin'
        );
        
        // Continue with main operation
        mainOperationCompleted = true;
        return 'success';
      };

      const result = await mainOperation();
      
      assert.strictEqual(result, 'success');
      assert.strictEqual(mainOperationCompleted, true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle real-world business profile update scenario', async () => {
      await createAuditLog(
        'BUSINESS_PROFILE_UPDATED',
        'BusinessProfile',
        '1',
        {
          name: 'Jessy Luxury Fragrance',
          phone: '+234 800 000 0000',
          email: 'support@jessyluxury.com',
          address: '57 MCC Road, Opposite Ihechiuwa Junction, Owerri, Imo State, Nigeria',
        },
        'admin@jessyluxury.com'
      );

      const log = mockAuditLogs[0];
      assert.strictEqual(log.action, 'BUSINESS_PROFILE_UPDATED');
      assert.strictEqual(log.entity, 'BusinessProfile');
      assert.strictEqual(log.entityId, '1');
      assert.strictEqual(log.changedBy, 'admin@jessyluxury.com');

      const parsed = JSON.parse(log.details);
      assert.strictEqual(parsed.name, 'Jessy Luxury Fragrance');
      assert.strictEqual(parsed.phone, '+234 800 000 0000');
    });

    it('should handle payment settings update with secrets filtered', async () => {
      await createAuditLog(
        'PAYMENT_SETTINGS_UPDATED',
        'PaymentSettings',
        '1',
        {
          bankAccountName: 'Jessy Luxury Account',
          merchantId: 'merch_123456',
          bankAccountNumber: '1234567890', // Should be filtered (contains sensitive data)
          paymentProviderApiKey: 'sk_live_abc123', // Should be filtered
        },
        'Admin'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.strictEqual(parsed.bankAccountName, 'Jessy Luxury Account');
      assert.strictEqual(parsed.merchantId, 'merch_123456');
      assert.strictEqual(parsed.bankAccountNumber, undefined);
      assert.strictEqual(parsed.paymentProviderApiKey, undefined);
    });

    it('should handle self-escalation attempt logging', async () => {
      await createAuditLog(
        'SELF_ESCALATION_ATTEMPT',
        'StaffAccount',
        '3',
        {
          staffId: 3,
          attemptedAction: 'modify_own_permissions',
          requestedPermissions: ['settings', 'admin'],
        },
        'staff@example.com'
      );

      const log = mockAuditLogs[0];
      const parsed = JSON.parse(log.details);
      
      assert.strictEqual(parsed.staffId, 3);
      assert.strictEqual(parsed.attemptedAction, 'modify_own_permissions');
      assert.deepStrictEqual(parsed.requestedPermissions, ['settings', 'admin']);
    });
  });
});
