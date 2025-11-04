/*import { ImageResponse as VercelOGImageResponse } from '@vercel/og';
import { html } from 'satori-html';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import Card from "../src/lib/card.svelte";

export const config = { runtime: 'edge' };

class ImageResponse<T extends Record<string, unknown>> extends VercelOGImageResponse {
    constructor(
        component: Component<T>,
        options?: ConstructorParameters<typeof VercelOGImageResponse>['1']
    ) {
        const result = render(component as Component);
        const element = html(result.body);
        super(element, options);
    }
}

const width = 1600;
const height = 900;

export default async function handler(): Promise<Response> {
  return new ImageResponse(Card, {
    width,
    height
  });
}*/

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const width = 1200, height = 630;

export default async function handler() {
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
      Hello 👋
    </div>,
    { width, height }
  );
}