import satori from 'satori';
import { html as toReactElement } from 'satori-html';
import type { SatoriOptions } from 'satori/wasm';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { getRequestEvent } from '$app/server';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
//import wasmInit from '@resvg/resvg-wasm/index_bg.wasm?init'
//import wasmUrl from '@resvg/resvg-wasm/index_bg.wasm?url';
import wasmInline from '@resvg/resvg-wasm/index_bg.wasm?inline';

//import resvg_wasm from "$lib/index_bg.wasm?inline";

//import fs from 'node:fs/promises';


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

let wasmInitialized = false;


export const generateImage = async <T extends Record<string, unknown>>(
    element: Component<T>,
    options: ImageResponseOptions,
) => {

    const { fetch } = getRequestEvent();


    if (!wasmInitialized) {
        try {
            //const wasmPath = process.cwd() + wasmUrl;
            //const wasmBuffer = await fs.readFile(wasmPath);

            //const response = await fetch(wasmUrl);
            //const wasmBuffer = new Uint8Array(await response.arrayBuffer());
            await initWasm(wasmInline);

            //const wasmModule = await import(/* @vite-ignore */ wasmUrl);

            //console.log(wasmModule);
            //await initWasm(resvg_wasm);

            wasmInitialized = true;
        } catch (e) {
            console.error(e);
        }
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