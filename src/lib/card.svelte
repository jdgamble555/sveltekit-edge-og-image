<script lang="ts">
	const { text = '', spanText = '' }: { text: string; spanText: string } = $props();
</script>

<div class="flex h-full w-full items-center justify-center bg-gray-50">
	<div class="flex w-full flex-col justify-between p-8 px-4 py-12 md:flex-row md:items-center">
		<h2 class="flex flex-col text-left text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
			<span>{text}</span>
			<span class="text-indigo-600">{spanText}</span>
		</h2>
		<div class="mt-8 flex md:mt-0">
			<div class="flex rounded-md shadow">
				<a
					href="/"
					class="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-3 text-base font-medium text-white"
				>
					Get started
				</a>
			</div>
			<div class="ml-3 flex rounded-md shadow">
				<a
					href="/"
					class="flex items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-indigo-600"
				>
					Learn more
				</a>
			</div>
		</div>
	</div>
</div>
