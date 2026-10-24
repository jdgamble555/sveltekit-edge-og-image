import type { Component } from 'svelte';
import { render } from 'svelte/server';
import type { ImageResponse as OGImageResponse } from '@cf-wasm/og';
import { html } from 'satori-html';

export const ImageResponse = async <T extends Record<string, unknown>>(
	component: Component<T>,
	options?: ConstructorParameters<typeof OGImageResponse>[1]
) => {
	// Load only when handling a request so Node build analysis never loads Worker WASM.
	const { ImageResponse } = import.meta.env.DEV
		? await import('@cf-wasm/og/node')
		: await import('@cf-wasm/og/workerd');
	return ImageResponse.async(html(render(component as Component).body), options);
};
