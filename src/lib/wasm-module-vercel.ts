// wasmModuleVercel.ts (only the changed parts)
import * as fs from 'fs';
import * as path from 'path';
import type { Plugin, ResolvedConfig } from 'vite';

export default function wasmModuleVercel(): Plugin {
  const POSTFIX = '.wasm?module';
  const VIRTUAL = '\0wasm:inline:';
  let isDev = false;
  let root = process.cwd();

  return {
    name: 'vite:wasm-helper-inline',
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      isDev = config.command === 'serve';
      root = config.root || root;
    },

    async resolveId(source, importer) {
      if (!source.endsWith(POSTFIX)) return null;

      const raw = source.slice(0, -'?module'.length);

      // 1) Try Vite's resolver (handles aliases/tsconfig paths/packages)
      const r = await this.resolve(raw, importer, { skipSelf: true, tryIndex: true });
      if (r?.id) return VIRTUAL + r.id;

      // 2) Try Node resolution from project root (handles node_modules)
      try {
        // @ts-ignore -- require is available in Node at build time
        const resolved = require.resolve(raw, { paths: [root] });
        return VIRTUAL + resolved;
      } catch {}

      // 3) Fallback: project-root relative (last resort)
      return VIRTUAL + path.resolve(root, raw);
    },

    load(id) {
      if (!id.startsWith(VIRTUAL)) return null;

      let filePath = id.slice(VIRTUAL.length);
      if (filePath.endsWith('?module')) filePath = filePath.slice(0, -'?module'.length);

      const exists = fs.existsSync(filePath);

      if (isDev) {
        if (!exists) {
          this.error(
            `wasm-helper-inline (dev): cannot read "${filePath}". ` +
            `Check the import path to your source wasm (e.g. "@resvg/resvg-wasm/index_bg.wasm?module").`
          );
        }
        return `
          import fs from 'fs';
          const buf = fs.readFileSync(${JSON.stringify(filePath)});
          if (!buf || buf.length === 0) throw new Error('wasm-helper-inline: empty wasm bytes: ${filePath}');
          export const wasmBytes = new Uint8Array(buf);
          export default wasmBytes;
        `;
      }

      if (!exists) {
        this.error(`wasm-helper-inline (build): cannot read "${filePath}".`);
      }

      const b64 = fs.readFileSync(filePath).toString('base64');
      return `
        const b64 = "${b64}";
        function b64ToBytes(b){
          if (typeof atob === 'function') {
            const bin = atob(b); const out = new Uint8Array(bin.length);
            for (let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
            return out;
          }
          return Uint8Array.from(globalThis.Buffer ? globalThis.Buffer.from(b,'base64') : []);
        }
        export const wasmBytes = b64ToBytes(b64);
        export async function initWasm(imports){ const mod = await WebAssembly.compile(wasmBytes); return WebAssembly.instantiate(mod, imports ?? {}); }
        export default wasmBytes;
      `;
    }
  };
}
