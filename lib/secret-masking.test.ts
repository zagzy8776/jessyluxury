import { test } from 'node:test';
import assert from 'node:assert';
import { maskSecret } from './secret-masking.ts';

test('maskSecret returns empty string for null', () => {
  assert.strictEqual(maskSecret(null), '');
});

test('maskSecret returns empty string for undefined', () => {
  assert.strictEqual(maskSecret(undefined), '');
});

test('maskSecret returns empty string for empty string', () => {
  assert.strictEqual(maskSecret(''), '');
});

test('maskSecret fully masks short strings (less than 6 characters)', () => {
  assert.strictEqual(maskSecret('abc'), '••••••');
  assert.strictEqual(maskSecret('a'), '••••••');
  assert.strictEqual(maskSecret('ab'), '••••••');
  assert.strictEqual(maskSecret('12345'), '••••••');
});

test('maskSecret masks long API key correctly', () => {
  const input = 'sk_live_abc123xyz789def456';
  const result = maskSecret(input);
  
  // Input length: 26
  // Expected: first 2 + 20 bullets + last 4 = 26 chars total output
  assert.strictEqual(result.slice(0, 2), 'sk');
  assert.strictEqual(result.slice(-4), 'f456');
  
  // Middle should have 20 bullets (26 - 2 - 4 = 20)
  const middle = result.slice(2, -4);
  assert.strictEqual(middle.length, 20);
  assert.ok(/^•+$/.test(middle), 'Middle should only contain bullets');
});

test('maskSecret masks 10-character string correctly', () => {
  const result = maskSecret('1234567890');
  assert.strictEqual(result, '12••••••7890');
  
  // Verify: first 2 + 6 bullets + last 4 = 12 characters output
  assert.strictEqual(result.length, 12);
  assert.strictEqual(result.slice(0, 2), '12');
  assert.strictEqual(result.slice(-4), '7890');
});

test('maskSecret handles exactly 6 characters', () => {
  const result = maskSecret('abcdef');
  assert.strictEqual(result, 'ab••••ef');
  
  // For 6 chars: first 2 + 4 bullets + last 2 = 8 chars output
  assert.strictEqual(result.length, 8);
});

test('maskSecret handles strings with special characters', () => {
  const result = maskSecret('a@#$%^&*()1234');
  assert.strictEqual(result.slice(0, 2), 'a@');
  assert.strictEqual(result.slice(-4), '1234');
  assert.ok(result.includes('••••••')); // At least 6 bullets
});

test('maskSecret never exposes plaintext in output', () => {
  const secret = 'my_super_secret_key_12345';
  const result = maskSecret(secret);
  
  // Should only contain first 2 and last 4
  assert.strictEqual(result.slice(0, 2), 'my');
  assert.strictEqual(result.slice(-4), '2345');
  
  // Middle portion should not contain any substring of the original (except first/last)
  const middleOriginal = secret.slice(2, -4); // "_super_secret_key_123"
  const middleResult = result.slice(2, -4);
  
  // Middle result should only contain bullets
  assert.ok(/^•+$/.test(middleResult), 'Middle should only contain bullets');
  assert.ok(!middleResult.includes('super'));
  assert.ok(!middleResult.includes('secret'));
});

test('maskSecret handles Unicode characters safely', () => {
  const unicodeSecret = '你好世界test123';
  const result = maskSecret(unicodeSecret);
  
  // Should not crash and should return a masked value
  assert.ok(result.length > 0);
  assert.ok(result.includes('••'));
  
  // Verify structure
  assert.strictEqual(result.slice(0, 2), '你好');
  assert.strictEqual(result.slice(-4), 't123');
});

test('maskSecret uses appropriate bullets based on length', () => {
  // Test various lengths to ensure correct bullet count
  // For 6-7: use 4 bullets, show last 2
  // For 8-9: use 6 bullets, show last 2
  // For 10+: use 6+ bullets, show last 4
  const testCases = [
    { input: '123456', expectedPattern: /^12••••56$/ }, // 6: first 2 + 4 bullets + last 2
    { input: '1234567', expectedPattern: /^12••••67$/ }, // 7: first 2 + 4 bullets + last 2
    { input: '12345678', expectedPattern: /^12••••••78$/ }, // 8: first 2 + 6 bullets + last 2
    { input: '123456789', expectedPattern: /^12••••••89$/ }, // 9: first 2 + 6 bullets + last 2
    { input: '1234567890', expectedPattern: /^12••••••7890$/ }, // 10: first 2 + 6 bullets + last 4
    { input: '12345678901', expectedPattern: /^12••••••8901$/ }, // 11: first 2 + 6 bullets + last 4 (actual middle is 5, use min 6)
    { input: '123456789012', expectedPattern: /^12••••••9012$/ }, // 12: first 2 + 6 bullets + last 4
    { input: '1234567890123', expectedPattern: /^12•••••••0123$/ }, // 13: first 2 + 7 bullets + last 4
  ];
  
  testCases.forEach(({ input, expectedPattern }) => {
    const result = maskSecret(input);
    assert.ok(
      expectedPattern.test(result),
      `For input "${input}" (length ${input.length}), expected pattern ${expectedPattern} but got "${result}"`
    );
  });
});

test('maskSecret is not reversible', () => {
  const original = 'sk_live_abc123xyz789def456';
  const masked = maskSecret(original);
  
  // Verify we cannot reconstruct the original from the masked value
  assert.notStrictEqual(masked, original);
  
  // Verify middle is completely masked
  const middle = masked.slice(2, -4);
  assert.ok(/^•+$/.test(middle), 'Middle should only be bullets');
  
  // Verify the masked version doesn't leak the secret
  assert.ok(!masked.includes('abc123'));
  assert.ok(!masked.includes('xyz789'));
});
