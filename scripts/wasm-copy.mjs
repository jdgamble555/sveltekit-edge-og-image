import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const CLIENT_ASSETS = '.svelte-kit/output/client/_app/immutable/assets';
const SERVER_ENTRY_ROOTS = [
  '.svelte-kit/vercel/entries',       // vercel adapter layout
  '.svelte-kit/output/server/entries' // fallback
];

const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };

async function listFiles(dir, pred) {
  const out = [];
  if (!exists(dir)) return out;
  async function walk(d) {
    for (const e of await fsp.readdir(d, { withFileTypes: true })) {
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

  const wasmFiles = (await fsp.readdir(CLIENT_ASSETS)).filter((f) => f.endsWith('.wasm'));
  if (!wasmFiles.length) {
    console.log('[copy-wasm] no .wasm in client assets, skipping');
    return;
  }

  const serverJs = (await Promise.all(
    SERVER_ENTRY_ROOTS.map((r) => listFiles(r, (p) => p.endsWith('.js')))
  )).flat();

  const destDirs = new Set();
  const needle = /"_app\/immutable\/assets\/([^"]+?\.wasm)\?module"/g;

  for (const js of serverJs) {
    const code = await fsp.readFile(js, 'utf8');
    if (needle.test(code)) {
      destDirs.add(path.join(path.dirname(js), '_app', 'immutable', 'assets'));
    }
  }

  if (!destDirs.size) {
    console.log('[copy-wasm] no server imports of *.wasm?module found');
    return;
  }

  for (const dir of destDirs) {
    await fsp.mkdir(dir, { recursive: true });
    for (const file of wasmFiles) {
      const src = path.join(CLIENT_ASSETS, file);
      const dst = path.join(dir, file);
      await fsp.copyFile(src, dst);
      console.log('[copy-wasm]', src, '→', dst);
    }
  }

  console.log('[copy-wasm] done');
}

main().catch((e) => {
  console.error('[copy-wasm] failed:', e);
  process.exit(0); // keep deploys from hard-failing
});
