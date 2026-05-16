# @velovault/dbexport-parser

**TypeScript parser for Johnson Controls Metasys `.dbexport` archives.**

A zero-dependency-on-JCI-tooling reader for the proprietary `.dbexport` archive format used by Metasys. Parses every device, every object, every property — produces clean TypeScript objects you can query, transform, or feed into another system.

> ⚠️ Not affiliated with, endorsed by, or supported by Johnson Controls.
> "Metasys", "SCT", "CCT", "NAE", and "FEC" are trademarks of Johnson Controls,
> used here only for descriptive interoperability reference.

## What it does

```ts
import { parseDbexport, buildHierarchy, classLabel } from '@velovault/dbexport-parser';

const archive = await parseDbexport(file); // file: Blob | ArrayBuffer | Uint8Array
console.log(`${archive.devices.length} devices, ${archive.navtree.length} navtree nodes`);

const engines = buildHierarchy(archive);
for (const engine of engines.values()) {
  console.log(`${engine.label}: ${engine.totalCount} objects`);
}
```

Or for one-off field operations:

```ts
import { parseRef, decodeValue, classLabel, propLabel } from '@velovault/dbexport-parser';

const ref = parseRef('DACC-ADX-02:DACC-NAE35-BCC/FC-1.FEC-3.OA-T');
// → { adx: 'DACC-ADX-02', engine: 'DACC-NAE35-BCC', segments: ['FC-1', 'FEC-3', 'OA-T'], path: 'FC-1.FEC-3.OA-T' }

classLabel('165'); // → 'Analog Input'
propLabel('28'); // → 'Description'
```

## Status

**v0.1 — extracted from [dbexport-viewer](https://github.com/jmsboswell67-alt/dbexport-viewer).** Used internally by [bas-sandbox](https://github.com/velovault-llc/bas-sandbox) as the Metasys ingest path.

This is the _parser_, not the _application_. If you want a UI to browse, diff, repoint, or audit archives, use [dbexport-viewer](https://github.com/jmsboswell67-alt/dbexport-viewer) directly. If you want to build your own tooling on top of `.dbexport` data, depend on this package.

## What it parses

- **`.dbexport` archives** — full hierarchical archive: navtree + per-device archives, every object, every property, every BACnet class/instance ID
- **References** — Metasys ref strings into `{ adx, engine, segments, path }`
- **Property values** — raw XML property payloads decoded to readable scalars, lists, structs, arrays, enums
- **Hierarchy** — `Site → Engine → Trunk → Equipment → Points` tree built from the navtree + ref structure
- **JCI dictionaries** — 280+ property IDs and 250+ class IDs mapped to canonical names

## Origin and licensing

The property/class dictionaries (`PROP_NAMES`, `CLASS_NAMES` in `src/dictionaries.ts`) are factual ID → name mappings extracted from XML comments in JCI's publicly-distributed Launcher resource bundle (`commands.xml`, `globalModifyList.xml`, `AttributeSetList.xml`, `AttributeSetListSCT.xml`).

These are facts — numeric IDs paired with canonical names — not creative expression. Extraction for interoperability is permitted under Feist v. Rural (US), Software Directive Art. 6 (EU), and the Sega / Sony / Connectix line of interop-reverse-engineering cases.

The original JCI Launcher resource files are **not** redistributed by this project. Only the extracted ID → name table is included.

This project itself is licensed under **Apache License 2.0** — see [LICENSE](LICENSE).

## Maintained by

[VELOVAULT LLC](https://velovaultllc.com) — an SBA-certified SDVOSB & VOSB.
