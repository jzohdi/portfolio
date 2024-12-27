<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import Layout from '$lib/components/Layout.svelte';
	import '../app.css';
	let { children } = $props();
</script>

<ModeWatcher />
<Layout>
	{@render children()}
</Layout>
