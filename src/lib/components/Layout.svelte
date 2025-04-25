<script lang="ts">
	import type { Snippet } from 'svelte';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';

	interface LayoutProps {
		footer?: Snippet;
		children?: Snippet;
	}

	let { footer, children }: LayoutProps = $props();
</script>

<header>
	<Header />
</header>
<main class="mx-auto max-w-6xl px-6">
	{@render children?.()}
</main>
<Footer />
