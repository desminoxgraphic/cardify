import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSerialNumber, getAccessibleBrandColor, getContrastTextColor, isValidRewardTransition } from '../lib/reward-rules.ts';

test('serials are padded to three digits without capping larger values', () => {
  assert.equal(formatSerialNumber(1), '001');
  assert.equal(formatSerialNumber(2), '002');
  assert.equal(formatSerialNumber(10), '010');
  assert.equal(formatSerialNumber(100), '100');
  assert.equal(formatSerialNumber(1000), '1000');
});

test('USED rewards cannot transition back to ACTIVE', () => {
  assert.equal(isValidRewardTransition('ACTIVE', 'USED'), true);
  assert.equal(isValidRewardTransition('USED', 'ACTIVE'), false);
  assert.equal(isValidRewardTransition('USED', 'USED'), false);
});

test('light brand colors are darkened for readable white button text', () => {
  assert.equal(getAccessibleBrandColor('#2563EB'), '#2563EB');
  assert.equal(getAccessibleBrandColor('#FFFFFF'), '#9E9E9E');
  assert.equal(getAccessibleBrandColor('invalid'), '#2563EB');
});

test('card foreground contrasts with the business primary color', () => {
  assert.equal(getContrastTextColor('#2563EB'), '#FFFFFF');
  assert.equal(getContrastTextColor('#0F172A'), '#FFFFFF');
  assert.equal(getContrastTextColor('#FFC107'), '#0F172A');
  assert.equal(getContrastTextColor('#FFFFFF'), '#0F172A');
  assert.equal(getContrastTextColor('invalid'), '#FFFFFF');
});
