// wasmModuleVercel.ts
// @ts-check
import * as fs from 'fs';
import * as path from 'path';
import type { Plugin, ResolvedConfig } from 'vite';

export default function wasmModuleVercel(): Plugin {
  const postfix = '.wasm?module';
  let isDev = false;

  return {
    name: 'vite:wasm-helper-inline',
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      isDev = config.command === 'serve';
    },

    load(id) {
      if (!id.endsWith(postfix)) return null;

      const filePath = id.slice(0, -'?module'.length);

      if (isDev) {
        // Dev: read from FS so local SSR works
        return `
          import fs from 'fs';
          const bytes = fs.readFileSync(${JSON.stringify(filePath)});
          export const wasmBytes = new Uint8Array(bytes);
          export default wasmBytes;
        `;
      }

      // Build: inline bytes as base64 to avoid any runtime path/fetch
      const buf = fs.readFileSync(filePath);
      const b64 = buf.toString('base64');

      // Export raw bytes AND a tiny init helper (optional)
      return `
        // inline wasm as base64; no network, no file IO
        const b64 = "${b64}";
        function b64ToBytes(b) {
          if (typeof atob === 'function') {
            const bin = atob(b);
            const out = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
            return out;
          } else {
            // Edge also has Buffer
            return Uint8Array.from(Buffer.from(b, 'base64'));
          }
        }
        export const wasmBytes = b64ToBytes(b64);

        // Optional convenience: compile+instantiate using given imports
        export async function initWasm(imports) {
          // Prefer compile for potential caching
          const mod = await WebAssembly.compile(wasmBytes);
          return WebAssembly.instantiate(mod, imports ?? {});
        }
        export default wasmBytes;
      `;
    }
  };
}