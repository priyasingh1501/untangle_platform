import { describe, it, expect } from 'vitest';
import { foldName } from '../../../lib/meal/norm.js';

describe('normalize', () => {
  describe('foldName', () => {
    it('should normalize basic food names', () => {
      expect(foldName('Apple')).toBe('apple');
      expect(foldName('BANANA')).toBe('banana');
      expect(foldName('Chicken Curry')).toBe('chickencurry');
    });

    it('should remove special characters and spaces', () => {
      expect(foldName('Idli (plain)')).toBe('idliplain');
      expect(foldName('Paneer Bhurji!')).toBe('paneerbhurji');
      expect(foldName('Rice & Beans')).toBe('ricebeans');
    });

    it('should handle numbers', () => {
      expect(foldName('Vitamin C 100mg')).toBe('vitaminc100mg');
      expect(foldName('Protein 25g')).toBe('protein25g');
    });

    it('should handle empty and null values', () => {
      expect(foldName('')).toBe('');
      expect(foldName(null)).toBe('');
      expect(foldName(undefined)).toBe('');
    });
  });
});
