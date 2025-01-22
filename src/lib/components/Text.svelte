<script lang="ts">
	import type { Snippet } from 'svelte';

	type Element = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'ul' | 'li' | 'code';
	interface TextSpecificProps {
		element: Element;
		// class?: string;
		children: Snippet;
		class?: string;
	}
	type TextProps = TextSpecificProps;

	const baseClasses: Record<Element, string> = {
		h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
		h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0',
		h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
		h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
		p: 'leading-7 [&:not(:first-child)]:mt-6',
		ul: 'my-6 ml-1 list-disc [&>li]:mt-2',
		li: '[&:not(:first-child)]:mt-4',
		code: 'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'
	} as const;

	let { element, children, class: classNames }: TextProps = $props();

	let clsx = (classNames ?? '') + ' ' + baseClasses[element] + ' text-primary';
</script>

{#if element === 'h1'}
	<h1 class={clsx}>
		{@render children?.()}
	</h1>
{:else if element === 'h2'}
	<h2 class={clsx}>
		{@render children?.()}
	</h2>
{:else if element === 'h3'}
	<h3 class={clsx}>
		{@render children?.()}
	</h3>
{:else if element === 'h4'}
	<h4 class={clsx}>
		{@render children?.()}
	</h4>
{:else if element === 'ul'}
	<ul class={clsx}>
		{@render children?.()}
	</ul>
{:else if element === 'li'}
	<li class={clsx}>
		{@render children?.()}
	</li>
{:else if element === 'code'}
	<code class={clsx}>
		{@render children?.()}
	</code>
{:else}
	<p class={clsx}>
		{@render children?.()}
	</p>
{/if}
