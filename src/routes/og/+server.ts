import { type RequestHandler } from "@sveltejs/kit";
import { ImageResponse } from "$lib/image-response";
import Card from "$lib/card.svelte";

const width = 1600;
const height = 900;

export const config = {
    runtime: 'edge'
};

export const GET = (async () => {

	return new ImageResponse(
		Card,
        { text: 'Ready to dive in?', spanText: 'Start your free trial today.' },
		{
			width,
			height
		}		
	);

}) satisfies RequestHandler;