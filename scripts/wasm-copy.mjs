// Copy any client-built WASM into every server entry folder that needs it,
// so imports like "_app/immutable/assets/*.wasm?module" resolve at runtime.

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const CLIENT_ASSETS = '.svelte-kit/output/client/_app/immutable/assets';
const SERVER_ENTRY_ROOTS = [
  '.svelte-kit/output/server/entries', // common
  '.svelte-kit/vercel/entries'         // vercel adapter layout
];

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

async function listFiles(dir, pred) {
  const out = [];
  if (!exists(dir)) return out;
  async function walk(d) {
    const ents = await fsp.readdir(d, { withFileTypes: true });
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (!pred || pred(p)) out.push(p);
    }
  }
  await walk(dir);
  return out;
}

async function main() {
  if (!exists(CLIENT_ASSETS)) {
    console.log('[copy-wasm] no client assets dir, skipping');
    return;
  }

  const wasmFiles = (await fsp.readdir(CLIENT_ASSETS))
    .filter(f => f.endsWith('.wasm'));
  if (wasmFiles.length === 0) {
    console.log('[copy-wasm] no .wasm in client assets, skipping');
    return;
  }

  // Find every server entry JS that references _app/immutable/assets/*.wasm?module
  const serverJs = (await Promise.all(
    SERVER_ENTRY_ROOTS.map(r => listFiles(r, p => p.endsWith('.js')))
  )).flat().filter(Boolean);

  // Map of server entry dir -> ensure we create <dir>/_app/immutable/assets
  const destDirs = new Set();
  const needle = /"_app\/immutable\/assets\/([^"]+?\.wasm)\?module"/g;

  for (const js of serverJs) {
    const code = await fsp.readFile(js, 'utf8');
    if (needle.test(code)) {
      destDirs.add(path.join(path.dirname(js), '_app', 'immutable', 'assets'));
    }
  }

  if (destDirs.size === 0) {
    console.log('[copy-wasm] no server imports of *.wasm?module found, nothing to copy');
    return;
  }

  for (const dir of destDirs) {
    await fsp.mkdir(dir, { recursive: true });
    for (const f of wasmFiles) {
      const src = path.join(CLIENT_ASSETS, f);
      const dst = path.join(dir, f);
      await fsp.copyFile(src, dst);
      console.log('[copy-wasm]', src, '→', dst);
    }
  }

  console.log('[copy-wasm] done');
}

main().catch(err => {
  console.error('[copy-wasm] failed:', err);
  // keep behavior similar to “|| true” so deploys aren’t blocked
  process.exit(0);
});
