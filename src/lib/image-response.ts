import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { ImageResponse as OGImageResponse } from '@cf-wasm/og/workerd';
import { html } from 'satori-html';

export const prerender = false;


export const ImageResponse = async <T extends Record<string, unknown>>(
    component: Component<T>,
    options?: ConstructorParameters<typeof OGImageResponse>['1'],
    props?: T
) => {
    const result = render(component as Component, { props });
    return await OGImageResponse.async(html(result.body), options);
};
