// @ts-check
import * as fs from 'fs';
import * as path from 'path';
import type { Plugin, ResolvedConfig } from 'vite';

export default function wasmModuleVercelEdge(): Plugin {
  const MATCH = /\.(wasm)(\?(module|url))?$/i;
  let root = process.cwd();

  return {
    name: 'vite:wasm-module-vercel-edge',
    enforce: 'pre',

    configResolved(cfg: ResolvedConfig) {
      root = cfg.root || root;
    },

    async load(id) {
      if (!MATCH.test(id)) return null;

      // Strip query (?module / ?url) and read bytes
      const [fsId] = id.split('?');
      const abs = path.isAbsolute(fsId) ? fsId : path.resolve(root, fsId);
      const source = fs.readFileSync(abs);

      // Tell Vite/Rollup to emit the wasm as an asset in the client build
      const refId = this.emitFile({
        type: 'asset',
        name: path.basename(abs),
        source
      });

      // Rollup replaces this with "/_app/immutable/assets/<hash>.wasm"
      return `
        export const wasmPath = import.meta.ROLLUP_FILE_URL_${refId};

        // Build an absolute URL for the current request (Edge-safe)
        export function wasmURL(baseOrEvent) {
          const base = typeof baseOrEvent === 'string'
            ? baseOrEvent
            : (baseOrEvent && baseOrEvent.url) || 'http://localhost/';
          return new URL(wasmPath, base).toString();
        }

        // Fetch with request-scoped fetch (required on SvelteKit server/edge)
        export async function fetchWasm(eventOrFetch, base) {
          const fetchFn = typeof eventOrFetch === 'function'
            ? eventOrFetch
            : (eventOrFetch && eventOrFetch.fetch) || fetch;
          const url = wasmURL(base || (eventOrFetch && eventOrFetch.url));
          return fetchFn(url);
        }

        export default { wasmPath, wasmURL, fetchWasm };
      `;
    },

    // Make the asset URL be a web path (not file://)
    resolveFileUrl({ fileName }) {
      return `"${'/' + fileName}"`;
    }
  };
}
