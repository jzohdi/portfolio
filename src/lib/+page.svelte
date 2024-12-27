<script lang="ts">
	import Row from '$lib/components/pages/about/Row.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import type { NotionData } from '$lib/types';
	let { data }: { data: NotionData } = $props();
	let aboutme1 = data.aboutme1;
	let aboutme2 = data.aboutme2;
</script>

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
	<Text element="h3" class="text-secondary">Things I remind myself</Text>
	<Text element="p" class="list-none text-sm">
		<Text element="li">Always take small opportunities to go one level deeper.</Text>
		<Text element="li">Practice with people who are better than you.</Text>
		<Text element="li">Make time for the people around you, and remember what’s important.</Text>
		<Text element="li">"You sure about that?"</Text>
	</Text>
{/snippet}

<Spacer height={'10px'}></Spacer>
<Row top="left" left={headerImage} right={aboutMe} />
