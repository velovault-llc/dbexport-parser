// Per-device archive XML and navtree XML parsers.

import { localNames, serializeNode } from './xml.js';

export interface MetasysObject {
  /** Full reference path, e.g. "DACC-ADX-02:DACC-NAE35-BCC/FC-1.FEC-3.OA-T". */
  ref: string;
  /** JCI class ID (numeric string), e.g. "165" for Analog Input. */
  classid: string;
  /** BACnet object class ID (numeric string). May be empty. */
  bacnetclassid: string;
  /** BACnet object instance ID (numeric string). May be empty. */
  objectid: string;
  /** Property ID → raw inner-XML payload. Decoded to readable strings via `decodeValue`. */
  properties: Record<string, string>;
}

/**
 * Parse a per-device `archive.xml` into a flat list of objects with their
 * properties as raw XML payloads. Use `decodeValue` to render a property's
 * value as a human-readable string.
 */
export function parseArchive(xml: Document): MetasysObject[] {
  const root = xml.documentElement;
  const objects: MetasysObject[] = [];
  for (const obj of localNames(root, 'object')) {
    const props: Record<string, string> = {};
    for (const p of localNames(obj, 'property')) {
      const id = p.getAttribute('id') ?? '';
      const data = localNames(p, 'data')[0];
      props[id] = data ? Array.from(data.childNodes).map(serializeNode).join('') : '';
    }
    objects.push({
      ref: obj.getAttribute('ref') ?? '',
      classid: obj.getAttribute('classid') ?? '',
      bacnetclassid: obj.getAttribute('bacnetclassid') ?? '',
      objectid: obj.getAttribute('objectid') ?? '',
      properties: props,
    });
  }
  return objects;
}

export interface MetasysNavtreeNode {
  label: string;
  ref: string;
  type: string;
  classid: string;
  depth: number;
  parentRef: string | null;
}

/**
 * Parse the archive-wide `navtree.xml` (UI hierarchy) into a flat list of
 * nodes. Order is depth-first; `depth` and `parentRef` let callers
 * reconstruct the tree.
 */
export function parseNavtree(xml: Document): MetasysNavtreeNode[] {
  const root = xml.documentElement;
  const out: MetasysNavtreeNode[] = [];
  function walk(el: Element, depth: number, parentRef: string | null): void {
    for (const node of localNames(el, 'node')) {
      const entry: MetasysNavtreeNode = {
        label: node.getAttribute('label') ?? '',
        ref: node.getAttribute('reference') ?? '',
        type: node.getAttribute('type') ?? '',
        classid: node.getAttribute('classid') ?? '',
        depth,
        parentRef,
      };
      out.push(entry);
      walk(node, depth + 1, entry.ref);
    }
  }
  walk(root, 0, null);
  return out;
}
