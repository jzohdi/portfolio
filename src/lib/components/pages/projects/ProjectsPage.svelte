<script lang="ts">
	import GithubLogo from '$lib/components/icons/GithubLogo.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Projects } from '$lib/notion/helper';
	import { getImageSrc } from '$lib/utils/svelte-helper';

	interface ProjectsPageProps {
		projects: Projects;
	}
	const { projects }: ProjectsPageProps = $props();
</script>

<div class="m-auto max-w-[900px]">
	<Spacer height="20px"></Spacer>
	<Text element="h1">Projects</Text>
	<Spacer height="40px"></Spacer>
	<ul>
		{#each projects as project}
			<Text element="li" class="relative">
				<Text element="h2" class="text-secondary">{project.title}</Text>
				<div class="grid grid-cols-3">
					<div class="col-span-1 hidden sm:block">
						<img
							src={getImageSrc('projects', project.thumbnail)}
							width={200}
							class="w-full object-cover object-center"
							alt={`thumbnail for ${project.title}`}
						/>
					</div>
					<div class="col-span-3 flex h-full flex-col justify-between gap-5 p-5 sm:col-span-2">
						<Text element="p">{project.description}</Text>
						<div class="flex justify-end gap-5">
							{#if project.source !== undefined}
								<a href={project.source} target="_blank" class="flex items-end pb-1">
									<GithubLogo class="dark:fill-white" width={28} height={28} />
								</a>
							{/if}
							<a
								href={project.link}
								target="_blank"
								class="flex w-fit items-center rounded-sm bg-secondary px-4 py-2 text-white"
							>
								Open
							</a>
						</div>
					</div>
				</div>
			</Text>
			<Spacer height="20px"></Spacer>
		{/each}
	</ul>
</div>
<Spacer height="100px"></Spacer>
