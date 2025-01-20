<script lang="ts">
	import RightIcon from '$lib/components/icons/RightIcon.svelte';
	import ExperimentPreview from '$lib/components/pages/experiments/ExperimentPreview.svelte';
	import FileOrDirectory from '$lib/components/pages/experiments/FileOrDirectory.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import { makeDirectories } from '$lib/utils/experiments/makeDirectories.js';

	const { data } = $props();
	const experiments = data.experiments;
	let isSidebarOpen = $state(false);

	function handleToggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	const experimentsDirectories = makeDirectories(experiments);
</script>

<Spacer height="20px"></Spacer>
<Text element="h1">Experiments</Text>
<Spacer height="40px"></Spacer>
<div class="relative">
	<div class="grid grid-cols-1 sm:grid-cols-3">
		<div
			class={`${isSidebarOpen ? 'left-0' : '-left-36'} fixed top-[130px] z-10 grid h-screen grid-cols-6 overflow-hidden bg-white transition-all dark:bg-slate-950 sm:relative sm:!left-0 sm:top-0 sm:col-span-1 sm:h-full`}
		>
			<div class="col-span-5 flex h-full px-3 pt-2 sm:block sm:pt-1">
				<div class="flex justify-center">
					{#each experimentsDirectories.subs as directory}
						<FileOrDirectory item={directory} path="/experiments/" />
					{/each}
				</div>
			</div>
			<button
				class="group col-span-1 flex h-full items-center border-r-[1px] border-r-slate-500 transition-colors hover:border-r-secondary sm:hidden"
				onclick={handleToggleSidebar}
			>
				<span class:rotate-180={isSidebarOpen} class="transition-transform">
					<RightIcon
						width={24}
						height={30}
						class="stroke-black transition-all group-hover:fill-secondary group-hover:stroke-secondary dark:stroke-white "
					/>
				</span>
			</button>
		</div>
		<ul class="col-span-1 pl-4 sm:col-span-2 sm:pl-0">
			{#each experiments as experiment}
				<ExperimentPreview {experiment} />
			{/each}
		</ul>
	</div>
</div>
