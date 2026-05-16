// XML helpers. Relies on the platform `DOMParser` (browser or jsdom).

export function parseXML(text: string): Document {
  return new DOMParser().parseFromString(text, 'application/xml');
}

/**
 * Return immediate children of `el` whose `localName` matches `name`,
 * ignoring XML namespace prefixes.
 */
export function localNames(el: Element, name: string): Element[] {
  const out: Element[] = [];
  for (const c of Array.from(el.children)) {
    if (c.localName === name) out.push(c);
  }
  return out;
}

/**
 * Serialize a DOM node back to a string for diff and display. Strips text-node
 * whitespace, preserves attributes, collapses empty elements to self-closing.
 */
export function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.nodeValue ?? '').trim();
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  const tag = el.localName;
  const attrs = Array.from(el.attributes ?? [])
    .map((a) => ` ${a.name}="${a.value}"`)
    .join('');
  const children = Array.from(el.childNodes).map(serializeNode).join('');
  if (!children) return `<${tag}${attrs}/>`;
  return `<${tag}${attrs}>${children}</${tag}>`;
}
