<script lang="ts">
	import '../app.css';
	let { children } = $props();
	import WebglBackground from '../lib/components/WebglBackground.svelte';
</script>

<WebglBackground />

{@render children()}