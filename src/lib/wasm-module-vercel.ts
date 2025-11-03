// wasmModuleVercel.ts
// @ts-check
import * as fs from 'fs';
import * as path from 'path';
import type { Plugin, ResolvedConfig } from 'vite';
type LoadResult = string | null;

export default function wasmModuleVercel(): Plugin {
  const postfix = '.wasm?module';
  let isDev = false;
  let root = process.cwd();

  return {
    name: 'vite:wasm-helper',
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      isDev = config.command === 'serve';
      root = config.root || root;
    },

    // You don't need the old external rule or renderChunk hack anymore.
    // We’ll just handle ?module directly and always return bytes.
    // If you still want externalize ?url variants for other imports, you can keep it.
    // config() { return { build: { rollupOptions: { external: /.+\.wasm?url$/i } } } },

    load(id: string): LoadResult {
      if (!id.endsWith(postfix)) return null;

      // Resolve the actual file path for the source wasm
      const filePath = id.slice(0, -'?module'.length);

      // Dev + Build: read bytes and inline as base64 → Uint8Array
      // (No runtime fs/fetch on Edge)
      const abs =
        path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);

      if (!fs.existsSync(abs)) {
        this.error(`vite:wasm-helper: cannot read wasm at "${abs}"`);
      }

      const b64 = fs.readFileSync(abs).toString('base64');

      return `
        const b64 = "${b64}";
        function b64ToBytes(b){
          if (typeof atob === 'function') {
            const bin = atob(b);
            const u = new Uint8Array(bin.length);
            for (let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i);
            return u;
          }
          return Uint8Array.from(globalThis.Buffer ? globalThis.Buffer.from(b,'base64') : []);
        }
        const wasmBytes = b64ToBytes(b64);
        export default wasmBytes; // <-- Uint8Array for initWasm
        export { wasmBytes };
      `;
    },
  };
}

