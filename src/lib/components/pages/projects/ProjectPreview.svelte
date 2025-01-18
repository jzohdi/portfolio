<script lang="ts">
	import GithubLogo from '$lib/components/icons/GithubLogo.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import { getImageSrc } from '$lib/utils/svelte-helper';

	const { project } = $props();

	let isDescriptionOpen = $state(false);

	function handleOpenDescription() {
		isDescriptionOpen = true;
	}
</script>

<div class="group relative block overflow-hidden p-0">
	<button onclick={handleOpenDescription} class="w-full">
		<div class="relative flex h-64 items-center justify-center overflow-hidden">
			<img
				alt={`project thumbnail for ${project.title}`}
				src={getImageSrc("projects", project.thumbnail)}
				class="h-full w-full object-cover object-center"
				width={192}
			/>
		</div>
		<div
			class="absolute bottom-0 left-0 flex h-6 w-full justify-center border-t-2 bg-white transition-all group-hover:h-10 group-hover:border-secondary"
		>
			<svg
				width={24}
				height={24}
				viewBox="0 0 448 512"
				xmlns="http://www.w3.org/2000/svg"
				class="group-hover:fill-secondary"
			>
				<path
					d="M416 352c-8.188 0-16.38-3.125-22.62-9.375L224 173.3l-169.4 169.4c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25C432.4 348.9 424.2 352 416 352z"
				/>
			</svg>
		</div>
	</button>
	<div
		class={`absolute left-0 h-full w-full bg-white p-2 text-left text-black transition-all ${isDescriptionOpen ? 'top-0' : 'top-80'}`}
	>
		<div class="relative h-full">
			<Text element="h3">{project.title}</Text>
			<Spacer height="20px"></Spacer>
			<p class="text-gray-600 text-sm sm:text-md">{project.description}</p>
			<div class="absolute bottom-0 flex w-full justify-between gap-2">
				{#if project.source !== undefined}
					<a href={project.source} target="_blank" class="flex items-end pb-1">
						<GithubLogo width={32} height={32} />
					</a>
				{/if}
				<span class="flex gap-2">
					<button
						class="rounded-sm bg-zinc-300 px-4 py-2"
						onclick={() => {
							isDescriptionOpen = false;
						}}>Close</button
					>
					<a
						href={project.link}
						target="_blank"
						class="flex w-fit items-center rounded-sm bg-secondary px-4 py-2 text-white"
					>
						Live <svg
							width={20}
							height={20}
							xmlns="http://www.w3.org/2000/svg"
							class={`stroke-white`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width={2}
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</a>
				</span>
			</div>
		</div>
	</div>
</div>
