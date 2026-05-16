// Hierarchy builder: Site → Engine → Trunk → Equipment → Points tree
// from a flat list of devices/objects.

import type { MetasysObject, MetasysNavtreeNode } from './archive.js';
import { categorizeFirstSegment, isOpaqueSegment, parseRef } from './ref.js';
import { decodeValue } from './value.js';

export interface MetasysDevice {
  /** ZIP folder name the device's archive.xml was found under. */
  folder: string;
  /** All objects extracted from this device's archive.xml. */
  objects: MetasysObject[];
}

export interface ParsedArchive {
  /** Filename of the source archive. */
  name: string;
  /** Flat navtree, depth-first. */
  navtree: MetasysNavtreeNode[];
  /** Per-device list of objects. */
  devices: MetasysDevice[];
}

export interface HierarchyNode {
  label: string;
  kind: string;
  classid: string;
  obj: MetasysObject | null;
  children: Map<string, HierarchyNode>;
  totalCount: number;
  key: string;
  _segmentLabel?: string;
  _labelFromDescription?: boolean;
}

/**
 * `kind` values that came from segment-name categorization and should not be
 * overwritten by class-based heuristics during `computeCounts`.
 */
const PRESERVED_KINDS = new Set<string>([
  'engine',
  'fieldbus',
  'n2trunk',
  'bacnettrunk',
  'lontrunk',
  'programming',
  'sysprograms',
  'schedules',
  'graphics',
  'site',
  'generic',
  'category',
]);

/**
 * Build a tree of `Map<engineName, HierarchyNode>` from a parsed archive.
 * Walks every object's ref, places it at the right depth under its engine,
 * and substitutes opaque segment names with the object's Description.
 */
export function buildHierarchy(archive: ParsedArchive): Map<string, HierarchyNode> {
  const engines = new Map<string, HierarchyNode>();
  for (const dev of archive.devices) {
    for (const obj of dev.objects) {
      const { engine: engineName, segments } = parseRef(obj.ref);
      if (!engineName) continue;
      let engine = engines.get(engineName);
      if (!engine) {
        engine = {
          label: engineName,
          kind: 'engine',
          classid: '',
          obj: null,
          children: new Map(),
          totalCount: 0,
          key: engineName,
        };
        engines.set(engineName, engine);
      }
      if (segments.length === 0) {
        engine.classid = obj.classid;
        engine.obj = obj;
        continue;
      }
      let node: HierarchyNode = engine;
      let keyPath = engineName;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        keyPath = keyPath + '#' + seg;
        if (!node.children.has(seg)) {
          let label = seg;
          let kind: string = i === segments.length - 1 ? 'point' : 'equipment';
          if (i === 0) {
            const cat = categorizeFirstSegment(seg);
            label = cat.label;
            kind = cat.kind;
          }
          node.children.set(seg, {
            label,
            kind,
            classid: '',
            obj: null,
            children: new Map(),
            totalCount: 0,
            key: keyPath,
          });
        }
        const child = node.children.get(seg);
        if (!child) continue; // unreachable; satisfies TS
        node = child;
        if (i === segments.length - 1) {
          node.classid = obj.classid;
          node.obj = obj;
        }
      }
    }
  }
  for (const engine of engines.values()) computeCounts(engine);
  return engines;
}

function computeCounts(node: HierarchyNode): number {
  let count = node.obj ? 1 : 0;
  for (const child of node.children.values()) count += computeCounts(child);
  node.totalCount = count;

  // Swap opaque segment labels ("307_2", "8-1") for the object's Description
  // when present. .dbexport segments are usually meaningful already; only
  // swap when the segment is opaque.
  if (node.obj && !node._labelFromDescription && isOpaqueSegment(node.label)) {
    const desc = decodeValue(node.obj.properties['28'] ?? '');
    if (desc && desc.length > 0 && desc !== '(empty)' && desc !== node.label) {
      node._segmentLabel = node.label;
      node.label = desc;
      node._labelFromDescription = true;
    }
  }

  if (PRESERVED_KINDS.has(node.kind)) return count;
  if (node.obj) {
    node.kind = deriveSemanticKind(node);
  } else if (node.children.size > 0) {
    node.kind = 'equipment';
  }
  return count;
}

function deriveSemanticKind(node: HierarchyNode): string {
  const c = parseInt(node.classid, 10);
  if ([192, 425, 448, 613, 651, 871, 872].includes(c)) return 'engine';
  if ([197, 278, 508].includes(c)) return 'equipment';
  if ([263, 519].includes(c)) return 'schedule';
  if (c === 344) return 'graphic';
  if (c === 155 || c === 20) return 'trendlog';
  if (c === 156 || c === 172) return 'alarm';
  if ([146, 336, 337, 338, 342].includes(c)) return 'logic';
  if (c === 176) return 'folder';
  if (c >= 0 && c <= 25) return 'point';
  if (c >= 500 && c <= 606) return 'point';
  if (c >= 147 && c <= 152) return 'point';
  return node.children.size > 0 ? 'equipment' : 'point';
}
