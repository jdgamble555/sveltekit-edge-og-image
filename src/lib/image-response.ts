import { ImageResponse as VercelOGImageResponse } from '@vercel/og';
import { html } from 'satori-html';
import type { Component } from 'svelte';
import { render } from 'svelte/server';


export class ImageResponse<T extends Record<string, unknown>> extends VercelOGImageResponse {
    constructor(
        component: Component<T>,
        options?: ConstructorParameters<typeof VercelOGImageResponse>['1']
    ) {
        const result = render(component as Component);
        const element = html(result.body) as React.ReactElement;
        super(element, options);
    }
}