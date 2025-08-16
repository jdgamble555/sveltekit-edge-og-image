import wasmB64 from '@resvg/resvg-wasm/index_bg.wasm?raw';

export function cleanBase64(str: string): string {
  return str
    .replace(/^data:[^;]+;base64,/, '') // drop "data:..." if present
    .replace(/\s+/g, '')                 // drop all whitespace/newlines
    .replace(/-/g, '+')                  // URL-safe → standard
    .replace(/_/g, '/');                 // URL-safe → standard
}

export function b64ToU8(str: string): Uint8Array {
  str = cleanBase64(str);

  // Fix padding
  const pad = str.length % 4;
  if (pad) str += '='.repeat(4 - pad);

  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function isWasmMagic(u8: Uint8Array): boolean {
    return u8.length >= 4 && u8[0] === 0x00 && u8[1] === 0x61 && u8[2] === 0x73 && u8[3] === 0x6D;
}

export const RESVG_WASM_BYTES = b64ToU8(wasmB64);
