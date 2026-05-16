// Top-level parser: feed a Blob/ArrayBuffer/Uint8Array of a `.dbexport`
// archive, get a fully-parsed `ParsedArchive` back.

import JSZip from 'jszip';
import { parseArchive, parseNavtree } from './archive.js';
import type { MetasysDevice, ParsedArchive } from './hierarchy.js';
import { parseXML } from './xml.js';

export type DbexportInput = Blob | ArrayBuffer | Uint8Array;

/**
 * Parse a `.dbexport` archive (a JCI Metasys site backup, structurally a
 * ZIP containing navtree.xml + per-device archive.xml files).
 *
 * Throws if the input doesn't look like a `.dbexport` (missing navtree
 * or archiveobject manifest).
 */
export async function parseDbexport(
  input: DbexportInput,
  name = 'archive.dbexport',
): Promise<ParsedArchive> {
  const zip = await JSZip.loadAsync(input);

  const archiveObj = zip.file('archiveobject.xml');
  const navtreeFile = zip.file('navtree.xml');
  if (!archiveObj || !navtreeFile) {
    throw new Error(
      'Not a valid .dbexport archive: missing archiveobject.xml or navtree.xml at root',
    );
  }

  const navtreeXml = parseXML(await navtreeFile.async('string'));
  const navtree = parseNavtree(navtreeXml);

  const devices: MetasysDevice[] = [];
  const deviceFolders = new Set<string>();
  zip.forEach((path) => {
    if (path.endsWith('/archive.xml') || path.endsWith('\\archive.xml')) {
      const folder = path.replace(/[\\/]archive\.xml$/, '');
      if (folder) deviceFolders.add(folder);
    }
  });
  for (const folder of deviceFolders) {
    const file = zip.file(`${folder}/archive.xml`) ?? zip.file(`${folder}\\archive.xml`);
    if (!file) continue;
    const xml = parseXML(await file.async('string'));
    const objects = parseArchive(xml);
    devices.push({ folder, objects });
  }

  return { name, navtree, devices };
}
