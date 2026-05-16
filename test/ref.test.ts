import { describe, expect, it } from 'vitest';
import { parseRef, categorizeFirstSegment, isOpaqueSegment } from '../src/ref.js';

describe('parseRef', () => {
  it('parses a fully-qualified .dbexport point ref', () => {
    expect(parseRef('DACC-ADX-02:DACC-NAE35-BCC/FC-1.FEC-3.OA-T')).toEqual({
      adx: 'DACC-ADX-02',
      engine: 'DACC-NAE35-BCC',
      segments: ['FC-1', 'FEC-3', 'OA-T'],
      path: 'FC-1.FEC-3.OA-T',
    });
  });

  it('parses an engine-only ref (no path)', () => {
    expect(parseRef('DACC-ADX-02:DACC-NAE35-BCC')).toEqual({
      adx: 'DACC-ADX-02',
      engine: 'DACC-NAE35-BCC',
      segments: [],
      path: '',
    });
  });

  it('parses a .caf-style ref with no ADX prefix', () => {
    expect(parseRef('8-1/575_1.556_1019.2_148864')).toEqual({
      adx: '',
      engine: '8-1',
      segments: ['575_1', '556_1019', '2_148864'],
      path: '575_1.556_1019.2_148864',
    });
  });
});

describe('categorizeFirstSegment', () => {
  it('recognizes FC-N field buses', () => {
    expect(categorizeFirstSegment('FC-1').kind).toBe('fieldbus');
  });
  it('recognizes Schedule', () => {
    expect(categorizeFirstSegment('Schedule')).toEqual({ label: 'Schedules', kind: 'schedules' });
  });
  it('falls back to category for unknown labels', () => {
    expect(categorizeFirstSegment('SomeWeirdSeg').kind).toBe('category');
  });
});

describe('isOpaqueSegment', () => {
  it('flags numeric and ID-shaped segments as opaque', () => {
    expect(isOpaqueSegment('200015')).toBe(true);
    expect(isOpaqueSegment('307_2')).toBe(true);
    expect(isOpaqueSegment('$4687')).toBe(true);
  });
  it('does not flag human-readable segments', () => {
    expect(isOpaqueSegment('OA-T')).toBe(false);
    expect(isOpaqueSegment('FC-1')).toBe(false);
  });
});
