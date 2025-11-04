import { type RequestHandler } from "@sveltejs/kit";
import { ImageResponse } from "$lib/image-response";
import Card from "$lib/card.svelte";


const width = 1600;
const height = 900;

export const prerender = false;

export const config = {
	runtime: 'edge'
};

export const GET = (async () => {

	return new ImageResponse(
		Card,
		{
			width,
			height,
			fonts: [
				{
					name: "Roboto",
					data: await fetch(
						"https://cdnjs.cloudflare.com/ajax/libs/materialize/0.98.1/fonts/roboto/Roboto-Regular.ttf"
					).then((res) => res.arrayBuffer()),
					weight: 400,
				}
			]
		}
	);

}) satisfies RequestHandler;