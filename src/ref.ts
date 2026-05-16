// Metasys reference-string parsing and segment categorization.

export interface ParsedRef {
  /** ADX/site prefix, e.g. "DACC-ADX-02". Empty for `.caf`-style refs. */
  adx: string;
  /** Engine name, e.g. "DACC-NAE35-BCC". */
  engine: string;
  /** Dot-separated path segments below the engine. */
  segments: string[];
  /** Original path string with segments joined by '.'. */
  path: string;
}

/**
 * Parse a Metasys reference string into structured parts.
 *
 * Examples:
 * - `"DACC-ADX-02:DACC-NAE35-BCC/FC-1.FEC-3.OA-T"`
 * - `"DACC-ADX-02:DACC-NAE35-BCC/Schedule.Occupied Schedule"`
 * - `"DACC-ADX-02:DACC-NAE35-BCC"` (the engine itself)
 * - `"8-1/575_1.556_1019.2_148864"` (.caf-style, no ADX prefix)
 * - `"8-1"` (the controller root)
 */
export function parseRef(ref: string): ParsedRef {
  const colonIdx = ref.indexOf(':');
  let adx = '';
  let after = ref;
  if (colonIdx >= 0) {
    adx = ref.slice(0, colonIdx);
    after = ref.slice(colonIdx + 1);
  }
  const slashIdx = after.indexOf('/');
  if (slashIdx < 0) return { adx, engine: after, segments: [], path: '' };
  const engine = after.slice(0, slashIdx);
  const path = after.slice(slashIdx + 1);
  const segments = path.split('.');
  return { adx, engine, segments, path };
}

export interface SegmentCategory {
  label: string;
  kind: string;
}

/**
 * Categorize the first segment under an engine. JCI sites vary in their
 * naming conventions for trunks/buses (FC-1, FCB, Field Bus, N2 Trunk N,
 * BACnet Trunk N, LON Trunk N) and we collapse them into a stable `kind`
 * so downstream tooling doesn't have to repeat the convention-matching.
 */
export function categorizeFirstSegment(seg: string): SegmentCategory {
  // MS/TP / Field Bus variants
  if (/^FC-\d+$/.test(seg)) return { label: 'Field Bus ' + seg, kind: 'fieldbus' };
  if (/^FCB$/i.test(seg)) return { label: 'Field Bus (FCB)', kind: 'fieldbus' };
  if (/^Field\s*Bus/i.test(seg)) return { label: seg, kind: 'fieldbus' };
  // N2 trunk variants
  if (/^N2(\s|-)/i.test(seg)) return { label: seg, kind: 'n2trunk' };
  // BACnet trunk variants
  if (/^BACnet\s*Trunk/i.test(seg)) return { label: seg, kind: 'bacnettrunk' };
  // LON trunk variants
  if (/^LON\s*Trunk/i.test(seg)) return { label: seg, kind: 'lontrunk' };
  // Other identifiable categories
  if (seg === 'Programming') return { label: 'Programming', kind: 'programming' };
  if (seg === 'System Programs') return { label: 'System Programs', kind: 'sysprograms' };
  if (seg === 'Schedule') return { label: 'Schedules', kind: 'schedules' };
  if (seg === 'Graphics') return { label: 'Graphics', kind: 'graphics' };
  if (seg.startsWith('$site')) return { label: 'Site Configuration', kind: 'site' };
  if (seg.startsWith('$Generic')) return { label: 'Generic Archive', kind: 'generic' };
  if (seg.startsWith('$Facility')) return { label: seg, kind: 'generic' };
  return { label: seg, kind: 'category' };
}

/**
 * True if the segment label is meaningless to a human reader and should be
 * replaced with the object's Description property when available.
 * Examples: "200015", "307_2", "8-1", "$4687".
 */
export function isOpaqueSegment(s: string): boolean {
  if (!s) return true;
  if (/^\d+$/.test(s)) return true;
  if (/^\d+[_\-.]\d+$/.test(s)) return true;
  if (/^\$\d+$/.test(s)) return true;
  return false;
}
