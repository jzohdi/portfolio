<script lang="ts">
	import Row from '$lib/components/pages/about/Row.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import type { NotionData } from '$lib/types';
	const { data }: { data: NotionData } = $props();
	const aboutme1 = data.aboutme1;
	const aboutme2 = data.aboutme2;
	const resume = data.resume;
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
	<Text element="h2">{resume.title}</Text>
	{#each resume.p as content}
		<Text element="p" class="text-sm">
			{content}
		</Text>
	{/each}
	<Spacer height="10px"></Spacer>
	<Text element="h3">{resume.title2}</Text>
	{#each resume.li as content}
		<Text element="p" class="text-sm">
			{content}
		</Text>
	{/each}
{/snippet}

{#snippet resumeRender()}
	<div class="h-full w-full bg-slate-500"></div>
{/snippet}

<Spacer height={'10px'}></Spacer>
<Row top="left" left={headerImage} right={aboutMe} />
<Spacer height={'50px'}></Spacer>
<Row top="left" left={resumeDescription} right={resumeRender} />
