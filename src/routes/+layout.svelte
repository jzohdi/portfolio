<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import Layout from '$lib/components/Layout.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	import { dev } from '$app/environment';
	import '../app.css';

	let { children } = $props();

	// Inject the Analytics functionality
    injectAnalytics({ mode: dev ? 'development' : 'production' });
</script>

<ModeWatcher />
<Layout>
	{@render children()}
</Layout>
