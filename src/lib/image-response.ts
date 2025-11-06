import { ImageResponse as OGImageResponse } from '@cf-wasm/og';
import { html } from 'satori-html';
import type { Component } from 'svelte';
import { render } from 'svelte/server';


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