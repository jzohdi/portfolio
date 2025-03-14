<script lang="ts">
	import Row from '$lib/components/pages/about/Row.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import type { HomePageData } from '$lib/types/types';
	import RenderedResume from '$lib/components/pages/about/RenderedResume.svelte';
	import PostPreview from '$lib/components/pages/about/PostPreview.svelte';
	import ProjectsGallery from '$lib/components/pages/projects/ProjectsGallery.svelte';
	import ExperimentsGallery from '$lib/components/pages/experiments/ExperimentsGallery.svelte';
	import TextWithLinks from '$lib/components/TextWithLinks.svelte';
	import { Collapsible, CollapsibleTrigger } from '$lib/components/ui/collapsible';
	import CollapsibleContent from '$lib/components/ui/collapsible/collapsible-content.svelte';
	import UpCircleIcon from '$lib/components/icons/UpCircleIcon.svelte';

	const { data }: { data: HomePageData } = $props();
	const aboutme1 = data.aboutme1;
	const aboutme2 = data.aboutme2;
	const resume = data.resume;
	const recentPosts = data.recentPosts;
	const projects = data.projects;
	const experiments = data.experiments;
</script>

{#snippet headerImage()}
	<div class="flex items-center justify-center overflow-hidden">
		<enhanced:img
			src="/static/images/compressed_pink_wig.jpeg?w=468&h=627"
			alt="picture of me"
			class="h-80 object-contain lg:h-full lg:w-full"
			sizes="(min-width:1000px) 470px, (min-width:720px) 640px, (min-width:400px) 400px"
			width="468"
			height="627"
		/>
	</div>
{/snippet}

{#snippet aboutMe()}
	<Text element="h2" class="bold text-primary">{aboutme1.title}</Text>
	{#each aboutme1.p as content}
		<Text element="p" class="text-sm">
			<TextWithLinks {content} />
		</Text>
	{/each}
	<Spacer height="20px"></Spacer>
	<Text element="h3" class="text-secondary">{aboutme2.title}</Text>
	<Text element="p" class="list-none text-sm">
		{#each aboutme2.p as content}
			<Text element="li">{content}</Text>
		{/each}
	</Text>
{/snippet}

{#snippet resumeDescription()}
	<div class="md:px-28 lg:px-48">
		<Text element="h2">{resume.title}</Text>
		{#each resume.p as content}
			<Text element="p" class="text-sm">
				<TextWithLinks {content} />
			</Text>
		{/each}
		{@render resumeRender()}
		<Collapsible>
			<CollapsibleTrigger class="group w-full">
				<Text element="h3" class="flex w-full items-center justify-between"
					>{resume.title2}<UpCircleIcon
						width={24}
						height={24}
						class="fill-secondary group-data-[state=open]:rotate-180"
					/></Text
				>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<Text element="ul" class="rounded-md border-2 shadow-md">
					{#each resume.li as content}
						<Text element="li" class="flex justify-between border-b-2 px-3 pb-3 text-xs">
							<span>{content.split('|')[0]}</span>
							<span class="text-secondary">{content.split('|')[1]}</span>
						</Text>
					{/each}
				</Text>
			</CollapsibleContent>
		</Collapsible>
	</div>
{/snippet}

{#snippet resumeRender()}
	<div class="h-full w-full py-5">
		<RenderedResume />
	</div>
{/snippet}

{#snippet mostRecentPost()}
	<PostPreview post={recentPosts[0]}></PostPreview>
{/snippet}

{#snippet secondMostRecentPost()}
	<PostPreview post={recentPosts[1]}></PostPreview>
{/snippet}

<Spacer height={'10px'}></Spacer>
<Row bp="lg" top="left" left={headerImage} right={aboutMe} />
<Spacer height={'50px'}></Spacer>
<!-- <Row bp="md" top="right" left={resumeDescription} right={resumeRender} /> -->
{@render resumeDescription()}
<Spacer height={'50px'}></Spacer>
<Row bp="md" header="Recent Posts" top="left" left={mostRecentPost} right={secondMostRecentPost} />
<Spacer height={'50px'}></Spacer>
<ProjectsGallery {projects} />
<Spacer height={'50px'}></Spacer>
<ExperimentsGallery {experiments} />
<Spacer height={'100px'}></Spacer>
