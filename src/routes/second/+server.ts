import { type RequestHandler } from "@sveltejs/kit";


export const prerender = false;

export const config = {
	runtime: 'edge'
};

export const GET = (async ({ fetch }) => {

    const image = await fetch('/og?width=1200&height=630');

    return new Response(image.body, {
        headers: {
            'Content-Type': 'image/png'
        }
    });

}) satisfies RequestHandler;