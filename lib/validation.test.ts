import { test } from 'node:test';
import assert from 'node:assert';
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateEnum,
} from './validation.js';

// ========================================
// validateEmail Tests
// ========================================

test('validateEmail accepts valid email addresses', () => {
  assert.strictEqual(validateEmail('test@example.com'), true);
  assert.strictEqual(validateEmail('user.name@example.com'), true);
  assert.strictEqual(validateEmail('user+tag@example.co.uk'), true);
  assert.strictEqual(validateEmail('admin@subdomain.example.com'), true);
  assert.strictEqual(validateEmail('user_name@example-domain.com'), true);
});

test('validateEmail rejects invalid email addresses', () => {
  assert.strictEqual(validateEmail('invalid'), false);
  assert.strictEqual(validateEmail('@example.com'), false);
  assert.strictEqual(validateEmail('test@'), false);
  assert.strictEqual(validateEmail('test@.com'), false);
  assert.strictEqual(validateEmail('test @example.com'), false);
  assert.strictEqual(validateEmail('test@example'), false);
  assert.strictEqual(validateEmail(''), false);
});

test('validateEmail handles null and undefined', () => {
  assert.strictEqual(validateEmail(null as any), false);
  assert.strictEqual(validateEmail(undefined as any), false);
});

test('validateEmail handles non-string types', () => {
  assert.strictEqual(validateEmail(123 as any), false);
  assert.strictEqual(validateEmail({} as any), false);
  assert.strictEqual(validateEmail([] as any), false);
});

test('validateEmail rejects emails exceeding 254 characters', () => {
  const longEmail = 'a'.repeat(250) + '@example.com'; // 263 chars
  assert.strictEqual(validateEmail(longEmail), false);
});

test('validateEmail prevents injection attacks', () => {
  // SQL injection attempts
  assert.strictEqual(validateEmail("test@example.com'; DROP TABLE users--"), false);
  assert.strictEqual(validateEmail('test@example.com<script>alert(1)</script>'), false);
  
  // Special characters that should be rejected
  assert.strictEqual(validateEmail('test"@example.com'), false);
  assert.strictEqual(validateEmail('test\\@example.com'), false);
});

// ========================================
// validatePhone Tests
// ========================================

test('validatePhone accepts valid international format', () => {
  assert.strictEqual(validatePhone('+1234567890'), true);
  assert.strictEqual(validatePhone('+12345678901'), true);
  assert.strictEqual(validatePhone('+447911123456'), true);
  assert.strictEqual(validatePhone('+33123456789'), true);
});

test('validatePhone accepts formatted phone numbers', () => {
  assert.strictEqual(validatePhone('+1 234 567 8901'), true);
  assert.strictEqual(validatePhone('+1-234-567-8901'), true);
  assert.strictEqual(validatePhone('+1 (234) 567-8901'), true);
  assert.strictEqual(validatePhone('+44 7911 123456'), true);
});

test('validatePhone rejects invalid phone numbers', () => {
  assert.strictEqual(validatePhone('1234567890'), false); // Missing +
  assert.strictEqual(validatePhone('+0234567890'), false); // Starts with 0
  assert.strictEqual(validatePhone('+123'), false); // Too short (< 7 digits)
  assert.strictEqual(validatePhone('+12345678901234567'), false); // Too long (> 15 digits)
  assert.strictEqual(validatePhone(''), false);
  assert.strictEqual(validatePhone('+'), false);
});

test('validatePhone handles null and undefined', () => {
  assert.strictEqual(validatePhone(null as any), false);
  assert.strictEqual(validatePhone(undefined as any), false);
});

test('validatePhone handles non-string types', () => {
  assert.strictEqual(validatePhone(123 as any), false);
  assert.strictEqual(validatePhone({} as any), false);
  assert.strictEqual(validatePhone([] as any), false);
});

test('validatePhone prevents injection attacks', () => {
  assert.strictEqual(validatePhone('+1234567890; DROP TABLE users--'), false);
  assert.strictEqual(validatePhone('+1234567890<script>'), false);
  assert.strictEqual(validatePhone("+1234567890' OR '1'='1"), false);
});

test('validatePhone accepts minimum valid length (7 digits after +)', () => {
  assert.strictEqual(validatePhone('+1234567'), true);
});

test('validatePhone accepts maximum valid length (15 digits after +)', () => {
  assert.strictEqual(validatePhone('+123456789012345'), true);
});

// ========================================
// validateRequired Tests
// ========================================

test('validateRequired returns null for valid non-empty values', () => {
  assert.strictEqual(validateRequired('valid', 'Field'), null);
  assert.strictEqual(validateRequired('test', 'Name'), null);
  assert.strictEqual(validateRequired(123, 'Number'), null);
  assert.strictEqual(validateRequired(true, 'Boolean'), null);
  assert.strictEqual(validateRequired(['item'], 'Array'), null);
});

test('validateRequired returns error message for empty string', () => {
  assert.strictEqual(validateRequired('', 'Business name'), 'Business name is required');
  assert.strictEqual(validateRequired('   ', 'Email'), 'Email is required');
  assert.strictEqual(validateRequired('\t\n', 'Phone'), 'Phone is required');
});

test('validateRequired returns error message for null', () => {
  assert.strictEqual(validateRequired(null, 'Field'), 'Field is required');
});

test('validateRequired returns error message for undefined', () => {
  assert.strictEqual(validateRequired(undefined, 'Field'), 'Field is required');
});

test('validateRequired returns error message for empty array', () => {
  assert.strictEqual(validateRequired([], 'Permissions'), 'Permissions is required');
});

test('validateRequired handles zero as valid value', () => {
  assert.strictEqual(validateRequired(0, 'Count'), null);
});

test('validateRequired handles false as valid value', () => {
  assert.strictEqual(validateRequired(false, 'Flag'), null);
});

test('validateRequired uses custom field names in error messages', () => {
  const error1 = validateRequired('', 'Business hours');
  assert.ok(error1?.includes('Business hours'));
  
  const error2 = validateRequired(null, 'Location name');
  assert.ok(error2?.includes('Location name'));
});

// ========================================
// validateEnum Tests
// ========================================

test('validateEnum returns null for valid enum values', () => {
  const roles = ['Owner', 'Manager', 'Fulfillment', 'Catalog'];
  
  assert.strictEqual(validateEnum('Owner', roles, 'role'), null);
  assert.strictEqual(validateEnum('Manager', roles, 'role'), null);
  assert.strictEqual(validateEnum('Fulfillment', roles, 'role'), null);
  assert.strictEqual(validateEnum('Catalog', roles, 'role'), null);
});

test('validateEnum returns error message for invalid enum values', () => {
  const roles = ['Owner', 'Manager', 'Fulfillment', 'Catalog'];
  
  const error1 = validateEnum('Admin', roles, 'role');
  assert.ok(error1?.includes('Invalid role'));
  assert.ok(error1?.includes('Admin'));
  
  const error2 = validateEnum('SuperUser', roles, 'role');
  assert.ok(error2?.includes('Invalid role'));
  assert.ok(error2?.includes('SuperUser'));
});

test('validateEnum is case-sensitive', () => {
  const categories = ['Packaging', 'Shipping', 'Marketing'];
  
  assert.strictEqual(validateEnum('Packaging', categories, 'category'), null);
  assert.notStrictEqual(validateEnum('packaging', categories, 'category'), null);
  assert.notStrictEqual(validateEnum('PACKAGING', categories, 'category'), null);
});

test('validateEnum returns error message for empty string', () => {
  const roles = ['Owner', 'Manager'];
  
  const error = validateEnum('', roles, 'role');
  assert.ok(error?.includes('required'));
});

test('validateEnum returns error message for null', () => {
  const roles = ['Owner', 'Manager'];
  
  const error = validateEnum(null as any, roles, 'role');
  assert.ok(error?.includes('required'));
});

test('validateEnum returns error message for undefined', () => {
  const roles = ['Owner', 'Manager'];
  
  const error = validateEnum(undefined as any, roles, 'role');
  assert.ok(error?.includes('required'));
});

test('validateEnum handles non-string types', () => {
  const roles = ['Owner', 'Manager'];
  
  assert.notStrictEqual(validateEnum(123 as any, roles, 'role'), null);
  assert.notStrictEqual(validateEnum({} as any, roles, 'role'), null);
  assert.notStrictEqual(validateEnum([] as any, roles, 'role'), null);
});

test('validateEnum works with expense categories', () => {
  const categories = ['Packaging', 'Shipping', 'Marketing', 'Utility', 'Salary'];
  
  assert.strictEqual(validateEnum('Packaging', categories, 'category'), null);
  assert.strictEqual(validateEnum('Shipping', categories, 'category'), null);
  assert.strictEqual(validateEnum('Marketing', categories, 'category'), null);
  assert.strictEqual(validateEnum('Utility', categories, 'category'), null);
  assert.strictEqual(validateEnum('Salary', categories, 'category'), null);
  
  const error = validateEnum('InvalidCategory', categories, 'category');
  assert.ok(error?.includes('Invalid category'));
  assert.ok(error?.includes('InvalidCategory'));
});

test('validateEnum works with staff permissions', () => {
  const permissions = ['orders', 'products', 'customers', 'analytics', 'settings', 'catalog', 'fulfillment'];
  
  assert.strictEqual(validateEnum('orders', permissions, 'permission'), null);
  assert.strictEqual(validateEnum('products', permissions, 'permission'), null);
  assert.strictEqual(validateEnum('settings', permissions, 'permission'), null);
  
  const error = validateEnum('admin', permissions, 'permission');
  assert.ok(error?.includes('Invalid permission'));
  assert.ok(error?.includes('admin'));
});

test('validateEnum uses custom field names in error messages', () => {
  const statuses = ['active', 'inactive'];
  
  const error1 = validateEnum('pending', statuses, 'account status');
  assert.ok(error1?.includes('account status'));
  
  const error2 = validateEnum('', statuses, 'order status');
  assert.ok(error2?.includes('order status'));
});

// ========================================
// Security and Edge Case Tests
// ========================================

test('all validators handle injection attack attempts safely', () => {
  // SQL injection
  assert.strictEqual(validateEmail("'; DROP TABLE users--@example.com"), false);
  assert.strictEqual(validatePhone("+1234567890'; DELETE FROM orders--"), false);
  
  // XSS attempts
  assert.strictEqual(validateEmail('<script>alert(1)</script>@example.com'), false);
  
  // Command injection
  assert.strictEqual(validatePhone('+1234567890; rm -rf /'), false);
  
  // Enum injection
  const roles = ['Owner', 'Manager'];
  assert.notStrictEqual(validateEnum("Owner'; DROP TABLE staff--", roles, 'role'), null);
});

test('all validators handle Unicode and special characters safely', () => {
  // Unicode in email (should be rejected by standard email validation)
  assert.strictEqual(validateEmail('用户@example.com'), false);
  
  // Unicode in phone
  assert.strictEqual(validatePhone('+１２３４５６７８９０'), false);
  
  // Unicode in required field validation (should be accepted)
  assert.strictEqual(validateRequired('测试名称', 'Name'), null);
  
  // Unicode in enum
  const categories = ['Category1', 'Category2'];
  assert.notStrictEqual(validateEnum('カテゴリ', categories, 'category'), null);
});

test('validators handle extremely long inputs safely', () => {
  const longString = 'a'.repeat(10000);
  
  // Should not crash or hang
  assert.strictEqual(validateEmail(longString + '@example.com'), false);
  assert.strictEqual(validatePhone('+' + longString), false);
  assert.strictEqual(validateRequired(longString, 'Field'), null); // Long but valid
  
  const roles = ['Owner', 'Manager'];
  assert.notStrictEqual(validateEnum(longString, roles, 'role'), null);
});
