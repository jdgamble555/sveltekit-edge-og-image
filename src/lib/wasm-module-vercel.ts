// wasmModuleVercel.ts
// @ts-check
import * as fs from 'fs'
import * as path from 'path'
import type { Plugin, ResolvedConfig } from 'vite'

export default function wasmModuleVercel(): Plugin {
  const postfix = '.wasm?module'
  const VIRTUAL_PREFIX = '\0wasm:inline:'
  let isDev = false
  let root = process.cwd()

  return {
    name: 'vite:wasm-helper-inline',
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      isDev = config.command === 'serve'
      root = config.root || root
    },

    /**
     * Normalize ANY import that ends with ".wasm?module" (including
     * "_app/immutable/assets/....wasm?module") into a virtual id.
     * This guarantees our load() runs both locally and on Vercel build.
     */
    async resolveId(source, importer) {
      if (!source.endsWith(postfix)) return null

      // If the specifier is already an absolute file path, keep it.
      // If it's something like "_app/immutable/assets/..", we can't read that
      // from disk—so fall back to the *original* importer-relative path
      // resolution (works in dev) or just pass the spec through. We'll still
      // inline by reading from the resolved fs path when possible.

      // Try to resolve to an absolute file on disk from the importer.
      let resolved = null
      if (importer && !source.startsWith('/_app/') && !source.startsWith('_app/')) {
        const r = await this.resolve(source, importer, { skipSelf: true })
        if (r && r.id && r.id.endsWith('.wasm')) resolved = r.id
      }

      // If we couldn’t map to a real file (e.g. spec is already _app/immutable/...),
      // keep the spec string; load() will *not* read FS for dev in that case,
      // but in build we inline from the nearest file we can resolve.
      const id = resolved ?? source
      return VIRTUAL_PREFIX + id
    },

    /**
     * Inline bytes as base64 so there is NO runtime fetch or fs access.
     */
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return null

      const orig = id.slice(VIRTUAL_PREFIX.length) // either fs path or _app/immutable/... fallback

      if (isDev) {
        // In dev, best-effort: if we can find a real file, read it from FS.
        // (Vite dev SSR runs in Node, so fs is fine.)
        let filePath = orig
        // If dev ever hands us a non-fs path, try to make it absolute from root.
        if (!path.isAbsolute(filePath) && !filePath.startsWith('file:') && filePath.endsWith('.wasm?module')) {
          filePath = path.resolve(root, filePath.replace(/\?module$/, ''))
        } else if (filePath.endsWith('?module')) {
          filePath = filePath.replace(/\?module$/, '')
        }

        if (fs.existsSync(filePath)) {
          return `
            import fs from 'fs';
            const bytes = fs.readFileSync(${JSON.stringify(filePath)});
            export const wasmBytes = new Uint8Array(bytes);
            export default wasmBytes;
          `
        }

        // Fallback dev stub (prevents hard crash if path is weird in dev)
        return `
          const wasmBytes = new Uint8Array();
          export { wasmBytes as default, wasmBytes };
        `
      }

      // BUILD: we must inline. Try to map to an actual file on disk.
      // If the orig looks like "...wasm?module", strip ?module.
      let filePath = orig.replace(/\?module$/, '')

      // If it's not absolute and not inside the project, attempt to resolve relative to root.
      if (!path.isAbsolute(filePath)) {
        const tryPath = path.resolve(root, filePath)
        if (fs.existsSync(tryPath)) filePath = tryPath
      }

      if (!fs.existsSync(filePath)) {
        // Give a helpful error so you know which import couldn't be inlined.
        this.error(`wasm-helper-inline: cannot locate source file for "${orig}" → looked for "${filePath}"`)
      }

      const buf = fs.readFileSync(filePath)
      const b64 = buf.toString('base64')

      // Use atob path by default (Edge has atob). Node fallback via Buffer only if present.
      return `
        const b64 = "${b64}";
        function b64ToBytes(b) {
          if (typeof atob === 'function') {
            const bin = atob(b);
            const out = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
            return out;
          }
          return Uint8Array.from(globalThis.Buffer ? globalThis.Buffer.from(b, 'base64') : []);
        }
        export const wasmBytes = b64ToBytes(b64);

        export async function initWasm(imports) {
          const mod = await WebAssembly.compile(wasmBytes);
          return WebAssembly.instantiate(mod, imports ?? {});
        }
        export default wasmBytes;
      `
    }
  }
}
