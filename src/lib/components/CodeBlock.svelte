<script lang="ts">
	import 'highlight.js/styles/github-dark.min.css';
	import { CodeBlock } from 'svhighlight';
	import Spacer from './Spacer.svelte';

	const { language, code }: { language: string; code?: string } = $props();
</script>

<Spacer height="10px"></Spacer>
<!-- <div class="bg-slate-900 p-4 text-white"> -->
<CodeBlock {language} {code} />
<!-- </div> -->
<Spacer height="10px"></Spacer>
