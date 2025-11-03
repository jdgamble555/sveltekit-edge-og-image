// Copies any *.wasm referenced in server entries like
//   "_app/immutable/assets/index_bg.<hash>.wasm?module"
// into the exact server path so imports don't 404 at runtime.

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVER_DIRS = [
  '.svelte-kit/output/server/entries',   // legacy layout
  '.svelte-kit/vercel/entries'           // newer adapter layout
];

const CLIENT_WASM_GLOBS = [
  '.svelte-kit/output/client/_app/immutable/assets',
  '.svelte-kit/output/client/_app/immutable/chunks',
  '.svelte-kit/output/client/_app/immutable'
];

const PKG_FALLBACK = 'node_modules/@resvg/resvg-wasm/index_bg.wasm';

// very small helper; no glob lib to keep this self-contained
async function listFiles(dir) {
  const out = [];
  async function walk(d) {
    const entries = await fsp.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else out.push(p);
    }
  }
  try { await walk(dir); } catch {}
  return out;
}

async function main() {
  // 1) Find all server chunks
  const serverRoots = SERVER_DIRS.filter(d => fs.existsSync(d));
  if (serverRoots.length === 0) {
    console.log('[edge-wasm-copy] No server entries found. Skipping.');
    return;
  }

  const serverFiles = (await Promise.all(serverRoots.map(listFiles))).flat()
    .filter(f => f.endsWith('.js'));

  // 2) Extract every *_app/immutable/assets/*.wasm?module occurrence
  const NEEDLE = /"_app\/immutable\/assets\/([^"]+?\.wasm)\?module"/g;
  const needs = new Map(); // filename -> Set of server dest directories

  for (const file of serverFiles) {
    const code = await fsp.readFile(file, 'utf8');
    let m;
    while ((m = NEEDLE.exec(code))) {
      const wasmFile = m[1]; // e.g. index_bg.Blvrv-U2.wasm
      // compute dest dir from the server file location:
      // <server-entry>/.../_server.ts.js  →  want sibling folder: <entry>/_app/immutable/assets/
      const baseDir = path.dirname(file);
      const destDir = path.join(baseDir, '_app', 'immutable', 'assets');
      if (!needs.has(wasmFile)) needs.set(wasmFile, new Set());
      needs.get(wasmFile).add(destDir);
    }
  }

  if (needs.size === 0) {
    console.log('[edge-wasm-copy] No *.wasm?module specifiers found in server bundle.');
    return;
  }

  // 3) Build a lookup for client assets
  const clientDirs = CLIENT_WASM_GLOBS.filter(d => fs.existsSync(d));
  const clientFiles = (await Promise.all(clientDirs.map(listFiles))).flat()
    .filter(f => f.endsWith('.wasm'));
  const byName = new Map(clientFiles.map(p => [path.basename(p), p]));

  // 4) For each needed wasm, copy from client asset if exists; else from package fallback
  for (const [fileName, destDirs] of needs.entries()) {
    let src = byName.get(fileName);
    if (!src && fs.existsSync(PKG_FALLBACK)) {
      // rename the package wasm to the hashed filename the server expects
      src = PKG_FALLBACK;
      console.warn(`[edge-wasm-copy] Client asset ${fileName} not found; using package fallback "${PKG_FALLBACK}"`);
    }
    if (!src) {
      console.warn(`[edge-wasm-copy] WARN: Could not find source for ${fileName}`);
      continue;
    }

    for (const destDir of destDirs) {
      await fsp.mkdir(destDir, { recursive: true });
      const dest = path.join(destDir, fileName);
      await fsp.copyFile(src, dest);
      console.log(`[edge-wasm-copy] ${src}  →  ${dest}`);
    }
  }

  console.log('[edge-wasm-copy] Done.');
}

main().catch(err => {
  console.error('[edge-wasm-copy] Failed:', err);
  // do NOT fail the build hard; match your previous "|| true" behavior
  process.exit(0);
});
