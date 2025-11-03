//import RESVG_WASM from '@resvg/resvg-wasm/index_bg.wasm?url';
import RESVG_WASM from '$lib/index_bg.wasm?url';
import satori from 'satori';
import { html as toReactElement } from 'satori-html';
import type { SatoriOptions } from 'satori/wasm';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { getRequestEvent } from '$app/server';
import { Resvg, initWasm } from '@resvg/resvg-wasm';



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

let initialized = false;


export const generateImage = async <T extends Record<string, unknown>>(
    element: Component<T>,
    options: ImageResponseOptions,
) => {

    const { fetch } = getRequestEvent();

    try {
        if (!initialized) {
            const { default: resvgwasm } = await import(
                /* @vite-ignore */ `${RESVG_WASM}?module`
            );
            await initWasm(resvgwasm);
            initialized = true;
        }
    } catch (e) {
        console.error(e);
        initialized = true;
    }


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