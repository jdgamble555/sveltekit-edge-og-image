import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { defaultFont, ImageResponse as OGImageResponse } from '@cf-wasm/og/others';
import { initResvg } from '@cf-wasm/resvg/legacy/others';
import { initSatori, initYoga } from '@cf-wasm/satori/others';
import yogaWasmModule from '@cf-wasm/satori/yoga.wasm?module';
import resvgWasmModule from '@cf-wasm/resvg/legacy/resvg.wasm?module';
import notoSansFontBuffer from '@cf-wasm/og/noto-sans-v27-latin-regular.ttf.bin';
import { html } from 'satori-html';

export const prerender = false;

if (!initResvg.initialized) {
    initResvg(resvgWasmModule);
}

if (!initSatori.initialized) {
    initSatori(initYoga(yogaWasmModule));
}

defaultFont.set(notoSansFontBuffer);


export const ImageResponse = async <T extends Record<string, unknown>>(
    component: Component<T>,
    options?: ConstructorParameters<typeof OGImageResponse>['1']
) => {
    const result = render(component as Component);
    return await OGImageResponse.async(html(result.body), options);
};

