import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { t } from "@cf-wasm/og/html-to-react";
import { ImageResponse as OGImageResponse } from '@cf-wasm/og';


export class ImageResponse<T extends Record<string, unknown>> extends OGImageResponse {
    constructor(
        component: Component<T>,
        options?: ConstructorParameters<typeof OGImageResponse>['1']
    ) {
        const result = render(component as Component);
        const element = t(result.body) as React.ReactElement;
        super(element, options);
    }
}