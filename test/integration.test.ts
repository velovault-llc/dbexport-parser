import { existsSync, readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { buildHierarchy, parseDbexport } from '../src/index.js';

// Set DBEXPORT_FIXTURE=/path/to/some.dbexport to run integration tests
// against a real archive. Skipped in CI and when the env var isn't set,
// so no private archives ever need to be committed.
const FIXTURE = process.env.DBEXPORT_FIXTURE;

describe.skipIf(!FIXTURE || !existsSync(FIXTURE ?? ''))(
  'parseDbexport against a real archive',
  () => {
    it('parses, produces non-zero counts, builds a hierarchy', { timeout: 120_000 }, async () => {
      const buf = readFileSync(FIXTURE!);
      const archive = await parseDbexport(buf);

      expect(archive.devices.length).toBeGreaterThan(0);

      const objectCount = archive.devices.reduce((s, d) => s + d.objects.length, 0);
      expect(objectCount).toBeGreaterThan(0);

      const hierarchy = buildHierarchy(archive);
      expect(hierarchy.size).toBeGreaterThan(0);

      const engines = Array.from(hierarchy.values())
        .map((n) => ({ name: n.label, objects: n.totalCount }))
        .sort((a, b) => b.objects - a.objects);

      console.log(
        `\n  ✓ ${archive.devices.length} devices · ${objectCount} objects · ${hierarchy.size} engines\n`,
      );
      for (const e of engines.slice(0, 20)) {
        console.log(`    • ${e.name.padEnd(40)} ${e.objects.toLocaleString()} objects`);
      }
      if (engines.length > 20) {
        console.log(`    … and ${engines.length - 20} more engines`);
      }
    });
  },
);
