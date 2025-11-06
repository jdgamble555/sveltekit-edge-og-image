// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces



declare global {

	declare module '*.wasm?module' {
		const module: WebAssembly.Module;
		export default module;
	}

	declare module '*.txt' {
		const module: string;
		export default module;
	}

	declare module '*.bin' {
		const module: ArrayBuffer;
		export default module;
	}

	/*
	declare module '*.wasm?module' {
		const wasm: ArrayBuffer
		export default wasm
	}
	*/

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}



export { };
