import { describe, expect, it } from 'vitest';
import {
  CLASS_NAMES,
  PROP_NAMES,
  PROP_NAMES_BY_CLASS,
  CLASS_META,
  CAF_BUCKET_MAP,
  WORKSPACE_HIDDEN_BUCKET,
  classLabel,
  propLabel,
  classMeta,
  cafBucket,
} from '../src/index.js';

describe('dictionary coverage', () => {
  it('CLASS_NAMES has at least 300 entries (post-v0.7.D import)', () => {
    expect(Object.keys(CLASS_NAMES).length).toBeGreaterThanOrEqual(300);
  });

  it('PROP_NAMES has at least 3000 entries (post-v0.7.D OCT-shared import)', () => {
    expect(Object.keys(PROP_NAMES).length).toBeGreaterThanOrEqual(3000);
  });

  it('PROP_NAMES_BY_CLASS has at least 100 classes with overrides', () => {
    expect(Object.keys(PROP_NAMES_BY_CLASS).length).toBeGreaterThanOrEqual(100);
  });

  it('CLASS_META has same cardinality as CLASS_NAMES', () => {
    expect(Object.keys(CLASS_META).length).toBe(Object.keys(CLASS_NAMES).length);
  });

  it('CAF_BUCKET_MAP exports and has at least 100 classes', () => {
    expect(Object.keys(CAF_BUCKET_MAP).length).toBeGreaterThanOrEqual(100);
  });

  it('WORKSPACE_HIDDEN_BUCKET is "Hidden"', () => {
    expect(WORKSPACE_HIDDEN_BUCKET).toBe('Hidden');
  });
});

describe('classLabel', () => {
  it('returns canonical name for known class', () => {
    expect(classLabel(0)).toBe('BACnet Analog Input');
    expect(classLabel('8')).toBe('Device');
  });

  it('returns fallback for unknown class', () => {
    expect(classLabel(999999)).toBe('Class 999999');
  });
});

describe('propLabel', () => {
  it('returns canonical name for known property (post-v0.7.D)', () => {
    // 3138 was unnamed before v0.7.D; now should resolve via OCT-shared import
    expect(propLabel(3138)).not.toBe('Property 3138');
  });

  it('uses class override when classId provided', () => {
    // Per SOURCE.md: propLabel(116, 8) should override the flat PROP_NAMES[116]
    // when the per-class table has it. Verify only if both override and base differ.
    const baseLabel = PROP_NAMES['116'];
    const override = PROP_NAMES_BY_CLASS['8']?.['116'];
    if (override && override !== baseLabel) {
      expect(propLabel(116, 8)).toBe(override);
      expect(propLabel(116)).toBe(baseLabel);
    }
  });

  it('falls back to flat lookup when no class override', () => {
    // Class with no overrides shouldn't change behavior
    expect(propLabel(0, 999999)).toBe(PROP_NAMES['0'] ?? 'Property 0');
  });

  it('returns fallback for unknown property', () => {
    expect(propLabel(999999)).toBe('Property 999999');
  });
});

describe('classMeta', () => {
  it('returns metadata for standard BACnet class', () => {
    const meta = classMeta(0);
    expect(meta).toBeDefined();
    expect(meta?.category).toContain('BACnet');
    expect(meta?.bacnetType).toEqual({ id: 0, name: 'Analog Input' });
    expect(meta?.context).toBe('Both');
  });

  it('returns undefined for unknown class', () => {
    expect(classMeta(999999)).toBeUndefined();
  });
});

describe('cafBucket', () => {
  it('classifies hardware input class', () => {
    // 240 = AI HW Input -> Inputs
    expect(cafBucket(240)).toBe('Inputs');
  });

  it('classifies network output class', () => {
    // 1 = BACnet Analog Output -> Network Outputs
    expect(cafBucket(1)).toBe('Network Outputs');
  });

  it('returns undefined for unclassified class', () => {
    expect(cafBucket(999999)).toBeUndefined();
  });
});
