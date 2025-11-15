import { type RequestHandler } from "@sveltejs/kit";
import { ImageResponse } from "$lib/image-response";
import Card from "$lib/card.svelte";


export const prerender = false;


export const GET = (async ({ url }) => {

	const { width, height } = Object.fromEntries(url.searchParams);

	return ImageResponse(
		Card,
		{
			width: Number(width) || 1600,
			height: Number(height) || 900
		}
	);

}) satisfies RequestHandler;