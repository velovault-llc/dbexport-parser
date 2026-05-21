// @velovault/dbexport-parser
// TypeScript parser for Johnson Controls Metasys .dbexport archives.

export {
  CLASS_NAMES,
  PROP_NAMES,
  PROP_NAMES_BY_CLASS,
  CLASS_META,
  CAF_BUCKET_MAP,
  WORKSPACE_HIDDEN_BUCKET,
} from './dictionaries.js';
export type { ClassMeta } from './dictionaries.js';
export { parseRef, categorizeFirstSegment, isOpaqueSegment } from './ref.js';
export type { ParsedRef, SegmentCategory } from './ref.js';
export { parseXML, localNames, serializeNode } from './xml.js';
export { parseArchive, parseNavtree } from './archive.js';
export type { MetasysObject, MetasysNavtreeNode } from './archive.js';
export { decodeValue } from './value.js';
export { buildHierarchy } from './hierarchy.js';
export type { HierarchyNode, MetasysDevice, ParsedArchive } from './hierarchy.js';
export { parseDbexport } from './parse.js';
export type { DbexportInput } from './parse.js';

import {
  CLASS_NAMES,
  PROP_NAMES,
  PROP_NAMES_BY_CLASS,
  CLASS_META,
  CAF_BUCKET_MAP,
} from './dictionaries.js';
import type { ClassMeta } from './dictionaries.js';

export function classLabel(cid: string | number): string {
  const key = String(cid);
  return CLASS_NAMES[key] ?? `Class ${key}`;
}

// Resolves a property's human-readable name. When a classId is supplied,
// PROP_NAMES_BY_CLASS[classId][propId] is consulted first — a handful of
// property IDs carry different canonical names depending on the class they
// appear on (e.g. prop 12 = "Comment" on points, "Appl SW Version" on devices).
// Falls back to the flat PROP_NAMES lookup.
export function propLabel(pid: string | number, cid?: string | number): string {
  const pkey = String(pid);
  if (cid !== undefined) {
    const ckey = String(cid);
    const override = PROP_NAMES_BY_CLASS[ckey]?.[pkey];
    if (override) return override;
  }
  return PROP_NAMES[pkey] ?? `Property ${pkey}`;
}

export function classMeta(cid: string | number): ClassMeta | undefined {
  return CLASS_META[String(cid)];
}

// CCT 5-column workspace classifier. Returns the bucket name for a class ID,
// or WORKSPACE_HIDDEN_BUCKET ("Hidden") for logic primitives that should be
// excluded from the workspace view, or undefined if the class is unclassified.
export function cafBucket(cid: string | number): string | undefined {
  return CAF_BUCKET_MAP[String(cid)];
}
