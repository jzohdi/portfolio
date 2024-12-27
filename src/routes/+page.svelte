<script>
	import Row from '$lib/components/pages/about/Row.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
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
	<Text element="h2" class="bold text-primary">About me</Text>
	<Text element="p" class="text-sm">
		The process of turning complex challenges into elegant and useful solutions energizes me,
		sparking creativity. Whether it’s optimizing a system or crafting a new tool, I find
		satisfaction in creating something that not only works but also brings joy or value to others.
		Each line of code represents a step toward leaving a lasting impact by solving meaningful
		problems.
	</Text>
	<Text element="p" class="text-sm">
		Programming inspires me to think differently, and to refine the craft. It’s a pursuit of
		continuous improvement, driven by curiosity and respect for those who paved the way. With every
		project, I strive to create work that is thoughtful and effective, ensuring that I grow as a
		developer while delivering meaningful experiences to others.
	</Text>
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
<Row bp="lg" header={'About Me'} top="left" left={headerImage} right={aboutMe} />
