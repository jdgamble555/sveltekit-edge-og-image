import { ImageResponse as WorkersResponse } from 'og-img';
import { html } from 'satori-html';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import type { ReactNode } from 'react';


export class ImageResponse<T extends Record<string, unknown>> extends WorkersResponse {
    constructor(
        component: Component<T>,
        options: ConstructorParameters<typeof WorkersResponse>['1']
    ) {
        const result = render(component as Component);
        const element = html(result.body) as ReactNode;
        super(element, options);
    }
}