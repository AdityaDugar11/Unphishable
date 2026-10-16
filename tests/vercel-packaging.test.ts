import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('Vercel functions include the complete local server and shared TypeScript module graph', () => {
  const vercel = JSON.parse(readFileSync(resolve(projectRoot, 'vercel.json'), 'utf8')) as {
    functions?: Record<string, { includeFiles?: string }>;
  };
  const includeFiles = vercel.functions?.['api/*.ts']?.includeFiles;

  // Vercel's includeFiles is a glob. This brace pattern bundles both module roots
  // while leaving the API entrypoints as the only function-specific entry files.
  assert.equal(includeFiles, '{server,shared}/**/*.ts');

  const visited = new Set<string>();
  const pending = ['api/config.ts', 'api/analyze.ts'];
  while (pending.length > 0) {
    const relativeFile = pending.pop()!;
    const absoluteFile = resolve(projectRoot, relativeFile);
    assert.ok(existsSync(absoluteFile), `Missing local module: ${relativeFile}`);
    if (visited.has(absoluteFile)) continue;
    visited.add(absoluteFile);

    const source = readFileSync(absoluteFile, 'utf8');
    const localImports = source.matchAll(/\b(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g);
    for (const match of localImports) {
      const importedFile = resolve(dirname(absoluteFile), match[1]!);
      assert.ok(existsSync(importedFile), `${relativeFile} imports missing module ${match[1]}`);

      const importedRelative = importedFile.slice(projectRoot.length + 1);
      const packaged = (importedRelative.startsWith(`server${sep}`) || importedRelative.startsWith(`shared${sep}`)) && importedRelative.endsWith('.ts');
      assert.ok(packaged, `Vercel includeFiles does not cover runtime dependency ${importedRelative}`);
      pending.push(importedRelative);
    }
  }

  for (const requiredModule of ['server/vercel.ts', 'server/app.ts', 'server/provider.ts', 'server/rules.ts', 'shared/schema.ts']) {
    assert.ok(visited.has(resolve(projectRoot, requiredModule)), `Runtime graph no longer reaches ${requiredModule}`);
  }
});
