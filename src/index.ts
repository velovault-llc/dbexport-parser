// @velovault/dbexport-parser
// TypeScript parser for Johnson Controls Metasys .dbexport archives.

export { CLASS_NAMES, PROP_NAMES } from './dictionaries.js';
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

import { CLASS_NAMES, PROP_NAMES } from './dictionaries.js';

export function classLabel(cid: string): string {
  return CLASS_NAMES[cid] ?? `Class ${cid}`;
}

export function propLabel(pid: string): string {
  return PROP_NAMES[pid] ?? `Property ${pid}`;
}
