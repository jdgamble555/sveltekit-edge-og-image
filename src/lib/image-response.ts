import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { ImageResponse as OGImageResponse } from '@cf-wasm/og';
import { html } from 'satori-html';

export const prerender = false;


export const ImageResponse = async <T extends Record<string, unknown>>(
    component: Component<T>,
    options?: ConstructorParameters<typeof OGImageResponse>['1']
) => {
    const result = render(component as Component);
    return await OGImageResponse.async(html(result.body), options);
};


/*

// THIS WORKS TOO, IF YOU PREFER MANUAL SETUP OVER THE WRAPPER

import satori from 'satori';
import { html as toReactElement } from 'satori-html';
import type { SatoriOptions } from 'satori/wasm';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { getRequestEvent } from '$app/server';

import { defaultFont } from '@cf-wasm/og/others';
import { initResvg, Resvg } from '@cf-wasm/resvg/legacy/others';
import resvgWasmModule from '@cf-wasm/resvg/legacy/resvg.wasm?module';
import notoSansFontBuffer from '@cf-wasm/og/noto-sans-v27-latin-regular.ttf.bin';

if (!initResvg.initialized) {
    initResvg(resvgWasmModule);
}

defaultFont.set(notoSansFontBuffer);



export interface ImageResponseOptions {
    width?: number;
    height?: number;
    fonts?: SatoriOptions['fonts'];
    debug?: boolean;
    text?: string;
    spanText?: string;
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    tailwindConfig?: SatoriOptions['tailwindConfig'];
}



export const generateImage = async <T extends Record<string, unknown>>(
    element: Component<T>,
    options: ImageResponseOptions,
) => {

    const { fetch } = getRequestEvent();

    const { text, spanText } = options;

    const renderedSvelte = render(element as Component, { props: { text, spanText } });

    const fontFile = await fetch(
        'https://og-playground.vercel.app/inter-latin-ext-700-normal.woff',
    );
    const fontData: ArrayBuffer = await fontFile.arrayBuffer();

    options.fonts = [
        {
            name: 'Inter Latin',
            data: fontData,
            style: 'normal',
        },
    ];

    const elementHtml = toReactElement(renderedSvelte.body);

    const svg = await satori(elementHtml, {
        width: options.width || 1200,
        height: options.height || 630,
        fonts: options.fonts?.length ? options.fonts : [],
        tailwindConfig: options.tailwindConfig,
    });

    const new_svg = svg.toString();

    try {
        const png = new Resvg(new_svg, {
            fitTo: {
                mode: 'width',
                value: options.width || 1200
            }
        });

        const pngBuffer = png.render().asPng();

        return pngBuffer;
    } catch (e) {
        console.error('Resvg error:', e);
    }
};

export class ImageResponse<T extends Record<string, unknown>> extends Response {

    constructor(element: Component<T>, options: ImageResponseOptions = {}) {
        super();

        const body = new ReadableStream({
            async start(controller) {
                const buffer = await generateImage(element, options);
                controller.enqueue(buffer);
                controller.close();
            },
        });

        return new Response(body, {
            headers: {
                'content-type': 'image/png',
                'cache-control': 'public, immutable, no-transform, max-age=31536000'
            },
            status: options.status || 200,
            statusText: options.statusText,
        });
    }
}
*/