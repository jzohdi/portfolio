<script lang="ts">
	import Row from '$lib/components/pages/about/Row.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import type { NotionData } from '$lib/types/types';
	import RenderedResume from '$lib/components/pages/about/RenderedResume.svelte';
	import PostPreview from '$lib/components/pages/about/PostPreview.svelte';

	const { data }: { data: NotionData } = $props();
	const aboutme1 = data.aboutme1;
	const aboutme2 = data.aboutme2;
	const resume = data.resume;
	const recentPosts = data.recentPosts;
</script>

<!-- =============== SECTION 1 ===================== -->
<!-- =============== SECTION 1 ===================== -->
<!-- =============== SECTION 1 ===================== -->
{#snippet headerImage()}
	<div class="flex items-center justify-center overflow-hidden">
		<enhanced:img
			src="/static/images/pink_wig.png?w=468&h=627"
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
			{content}
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

<!-- =============== SECTION 2 ===================== -->
<!-- =============== SECTION 2 ===================== -->
<!-- =============== SECTION 2 ===================== -->
{#snippet resumeDescription()}
<div class="lg:px-5">
	<Text element="h2">{resume.title}</Text>
	{#each resume.p as content}
		<Text element="p" class="text-sm">
			{content}
		</Text>
	{/each}
	<Spacer height="10px"></Spacer>
	<Text element="h3">{resume.title2}</Text>
	<Text element="ul" class="border-2 rounded-md shadow-md" >
		{#each resume.li as content}
		<Text element="li" class="border-b-2 pb-3 px-3 text-xs flex justify-between">
			<span>{content.split("|")[0]}</span>
			<span class="text-secondary">{content.split("|")[1]}</span>
		</Text>
	{/each}
	</Text>
</div>
{/snippet}

{#snippet resumeRender()}
<div class="w-full flex justify-center items-center h-full">
	<RenderedResume />
</div>
{/snippet}

<!-- =============== SECTION 3 ===================== -->
<!-- =============== SECTION 3 ===================== -->
<!-- =============== SECTION 3 ===================== -->
{#snippet mostRecentPost()}
<PostPreview post={recentPosts[0]}></PostPreview>
{/snippet}
{#snippet secondMostRecentPost()}
<PostPreview post={recentPosts[1]}></PostPreview>
{/snippet}

<Spacer height={'10px'}></Spacer>
<Row bp="lg" top="left" left={headerImage} right={aboutMe} />
<Spacer height={'50px'}></Spacer>
<Row bp="lg" top="left" left={resumeDescription} right={resumeRender} />
<Spacer height={'50px'}></Spacer>
<Row bp="md" header="Recent Posts" top="left" left={mostRecentPost} right={secondMostRecentPost} />
<Spacer height={'100px'}></Spacer>