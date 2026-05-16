// Property-value decoder: takes a raw XML payload from a Metasys property
// and renders it as a readable string (scalar, list, struct, enum, etc.).

import { parseXML } from './xml.js';

/** Scalar XML element names that should render as their text content. */
const SCALAR_TAGS = new Set([
  'string',
  'int',
  'unsignedInt',
  'unsignedLong',
  'unsignedShort',
  'unsignedByte',
  'real',
  'double',
  'float',
  'boolean',
  'BACoid',
]);

/**
 * Decode a property's raw XML payload to a readable string.
 *
 * Examples:
 * - `"<string>Pump 1 running</string>"` → `"Pump 1 running"`
 * - `"<real>72.4</real>"` → `"72.4"`
 * - `"<enum set="33">3</enum>"` → `"enum[33]=3"`
 * - `"<listof><int>1</int><int>2</int></listof>"` → `"[ 1, 2 ]"`
 */
export function decodeValue(rawXml: string): string {
  if (!rawXml) return '';
  const doc = parseXML(`<root>${rawXml}</root>`);
  const root = doc.documentElement;
  function render(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return (node.nodeValue ?? '').trim();
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const tag = el.localName;
    const text = (el.textContent ?? '').trim();
    if (SCALAR_TAGS.has(tag)) return text || '(empty)';
    if (tag === 'date') {
      // 2025.10.28.2 → 2025-10-28
      return text.split('.').slice(0, 3).join('-');
    }
    if (tag === 'time') {
      // 15.49.52.36 → 15:49:52
      return text.split('.').slice(0, 3).join(':');
    }
    if (tag === 'enum') {
      const set = el.getAttribute('set') ?? '?';
      return `enum[${set}]=${text}`;
    }
    if (tag === 'listof') {
      if (!el.children.length) return '(empty list)';
      return '[ ' + Array.from(el.children).map(render).join(', ') + ' ]';
    }
    if (tag === 'struct' || tag === 'structElement') {
      return '{ ' + Array.from(el.children).map(render).join(', ') + ' }';
    }
    if (tag === 'array') {
      return '[' + Array.from(el.children).map(render).join(',') + ']';
    }
    return text;
  }
  const parts = Array.from(root.childNodes).map(render).filter(Boolean);
  return parts.join(' ');
}
