// @ts-check
import * as fs from 'fs'
import * as path from 'path'
import type { Plugin, ResolvedConfig } from 'vite'

export default function wasmModuleVercel(): Plugin {
  const POSTFIX = '.wasm?module'
  const VIRTUAL = 'virtual:wasm-inline'
  const RESOLVED = '\0' + VIRTUAL

  let isDev = false
  let root = process.cwd()
  let pkgWasmPath: string | null = null

  return {
    name: 'vite:wasm-helper',
    enforce: 'pre',

    configResolved(cfg: ResolvedConfig) {
      isDev = cfg.command === 'serve'
      root = cfg.root || root
      // Resolve resvg wasm once (package path)
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        pkgWasmPath = require.resolve('@resvg/resvg-wasm/index_bg.wasm', { paths: [root] })
      } catch {
        pkgWasmPath = null
      }
    },

    /**
     * Resolve any *.wasm?module (including emitted _app/immutable forms)
     * to our virtual module so SSR never tries to import an asset path.
     * If we know the actual file for this import, stash it in the meta id.
     */
    async resolveId(source, importer) {
      if (source === VIRTUAL) return RESOLVED

      if (source.endsWith(POSTFIX)) {
        // Try to resolve the real file from the importer first
        const raw = source.slice(0, -'?module'.length)
        // 1) vite resolver (aliases/tsconfig)
        if (importer && !source.startsWith('/_app/') && !source.includes('_app/immutable/')) {
          const r = await this.resolve(raw, importer, { skipSelf: true })
          if (r?.id) return RESOLVED + '::' + r.id
        }
        // 2) package fallback: @resvg/resvg-wasm
        if (raw.includes('@resvg/resvg-wasm') && pkgWasmPath) {
          return RESOLVED + '::' + pkgWasmPath
        }
        // 3) last resort: let load() find something
        return RESOLVED
      }

      // If an emitted SSR chunk still references _app/immutable/*.wasm?module
      if (source.includes('_app/immutable/') && source.endsWith(POSTFIX)) {
        // redirect to our virtual; actual file will be pkg fallback
        return RESOLVED
      }

      return null
    },

    /**
     * Provide Uint8Array bytes. In dev: read from fs. In build: inline base64.
     */
    load(id) {
      if (!id.startsWith(RESOLVED)) return null

      // Optional file hint after '::'
      const hint = id.includes('::') ? id.slice(id.indexOf('::') + 2) : null

      let filePath: string | null = null

      // Prefer the hinted path (resolved from importer)
      if (hint && hint !== RESOLVED) {
        const cleaned = hint.endsWith('?module') ? hint.slice(0, -'?module'.length) : hint
        filePath = path.isAbsolute(cleaned) ? cleaned : path.resolve(root, cleaned)
      }

      // Fallback to package file
      if (!filePath && pkgWasmPath) filePath = pkgWasmPath

      // Final guard / local fallback (adjust if you keep a local wasm)
      if (!filePath || !fs.existsSync(filePath)) {
        const candidates = [
          path.resolve(root, 'src/lib/index_bg.wasm'),
          path.resolve(root, 'index_bg.wasm')
        ].filter((p) => fs.existsSync(p))
        filePath = candidates[0] || null
      }

      if (!filePath || !fs.existsSync(filePath)) {
        this.error('vite:wasm-helper: cannot locate a source .wasm for *.wasm?module import')
      }

      const buf = fs.readFileSync(filePath)
      if (buf.length === 0) {
        this.error(`vite:wasm-helper: empty wasm at ${filePath}`)
      }

      const b64 = buf.toString('base64')

      // dev & build: always export bytes; Node has Buffer, Edge has atob
      return `
        const b64="${b64}";
        function b64ToBytes(b){
          if (typeof atob === 'function') {
            const s = atob(b);
            const u = new Uint8Array(s.length);
            for (let i=0;i<s.length;i++) u[i] = s.charCodeAt(i);
            return u;
          }
          return Uint8Array.from(globalThis.Buffer ? globalThis.Buffer.from(b, 'base64') : []);
        }
        const wasmBytes = b64ToBytes(b64);
        export default wasmBytes;
        export { wasmBytes };
      `
    }
  }
}
