import satori from 'satori';
import { html as toReactElement } from 'satori-html';
import type { SatoriOptions } from 'satori/wasm';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { getRequestEvent } from '$app/server';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

import wasmImport from '$lib/index_bg.wasm?module';

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


let ready: Promise<void> | null = null;

function ensureWasm(absUrlFromReq: string) {
    if (!ready) {
        if (wasmImport instanceof WebAssembly.Module) {
            // PRODUCTION on Vercel Edge (with the wasm plugin): module path
            ready = initWasm(wasmImport);
        } else if (typeof wasmImport === 'string') {
            // DEV: Vite returns a URL string (e.g. "/src/lib/resvg.wasm?module")
            // Make it absolute using the current request URL, then init with that URL.
            const abs = new URL(wasmImport, absUrlFromReq).toString();
            ready = initWasm(abs);
        } else {
            throw new Error('Unexpected WASM import type');
        }
    }
    return ready;
}



export const generateImage = async <T extends Record<string, unknown>>(
    element: Component<T>,
    options: ImageResponseOptions,
) => {

    const { fetch, url } = getRequestEvent();


    await ensureWasm(url.toString());


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

    const svgBuffer = Buffer.from(svg);


    const png = new Resvg(svgBuffer, {
        fitTo: {
            mode: 'width',
            value: options.width || 1200
        }
    });

    const pngBuffer = png.render().asPng();

    return pngBuffer;
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