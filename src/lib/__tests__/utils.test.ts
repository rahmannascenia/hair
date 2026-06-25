import { describe, it, expect } from 'vitest';
import { getChangedFields } from '../audit';

describe('Audit Utilities', () => {
  describe('getChangedFields', () => {
    it('should return empty objects if no fields changed', () => {
      const oldValues = { a: 1, b: 'test' };
      const newValues = { a: 1, b: 'test' };
      const result = getChangedFields(oldValues, newValues);
      expect(result.oldValues).toEqual({});
      expect(result.newValues).toEqual({});
    });

    it('should identify changed fields', () => {
      const oldValues = { a: 1, b: 'old' };
      const newValues = { a: 1, b: 'new' };
      const result = getChangedFields(oldValues, newValues);
      expect(result.oldValues).toEqual({ b: 'old' });
      expect(result.newValues).toEqual({ b: 'new' });
    });

    it('should ignore fields not present in newValues', () => {
      const oldValues = { a: 1, b: 'old', c: 'extra' };
      const newValues = { a: 1, b: 'new' };
      const result = getChangedFields(oldValues, newValues);
      expect(result.oldValues).toEqual({ b: 'old' });
      expect(result.newValues).toEqual({ b: 'new' });
    });

    it('should handle nested objects correctly (via JSON stringify comparison)', () => {
      const oldValues = { a: { x: 1 } };
      const newValues = { a: { x: 2 } };
      const result = getChangedFields(oldValues, newValues);
      expect(result.oldValues).toEqual({ a: { x: 1 } });
      expect(result.newValues).toEqual({ a: { x: 2 } });
    });
  });
});
