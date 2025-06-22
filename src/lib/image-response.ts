import { ImageResponse as VercelOGImageResponse } from '@vercel/og';
import type { Component } from 'svelte';
import { html } from 'satori-html';
import { render } from 'svelte/server';


export class ImageResponse<T extends Record<string, unknown> = Record<string, unknown>> extends VercelOGImageResponse {
    constructor(
        component: Component<T>,
        props?: T,
        options?: ConstructorParameters<typeof VercelOGImageResponse>[1]        
    ) {
        const result = render(component as Component, ({ props }));
        const element = html(result.body);
        super(element, options);
    }
}