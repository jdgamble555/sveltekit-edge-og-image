import { ImageResponse as OGImageResponse } from '@cf-wasm/og/others';
import { html } from 'satori-html';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { initSatori, initYoga } from '@cf-wasm/satori/others';
import { initResvg } from '@cf-wasm/resvg/others';
import resvgWasmModule from '@cf-wasm/resvg/resvg.wasm?module';
import yogaWasmModule from '@cf-wasm/satori/yoga.wasm?module';
import notoSansFontBuffer from '@cf-wasm/og/noto-sans-v27-latin-regular.ttf.bin';

if (!initSatori.initialized) {
  initSatori(initYoga(yogaWasmModule));
}

if (!initResvg.initialized) {
  initResvg(resvgWasmModule);
}

import { defaultFont } from '@cf-wasm/og/others';

defaultFont.set(notoSansFontBuffer);


export class ImageResponse<T extends Record<string, unknown>> extends OGImageResponse {
    constructor(
        component: Component<T>,
        options?: ConstructorParameters<typeof OGImageResponse>['1']
    ) {
        const result = render(component as Component);
        const element = html(result.body) as React.ReactElement;
        super(element, options);
    }
}