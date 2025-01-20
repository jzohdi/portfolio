<script lang="ts">
	import ATag from './ATag.svelte';

	const { content } = $props();

	function parseHtmlString(
		htmlString: string
	): (string | { type: 'link'; href: string; text: string })[] {
		const regex = /<a\s+href=["']?([^"'>]+)["']?>(.*?)<\/a>|([^<]+)/g;
		const result: (string | { type: 'link'; href: string; text: string })[] = [];

		let match;
		while ((match = regex.exec(htmlString)) !== null) {
			if (match[1] && match[2]) {
				// Match for anchor tag
				result.push({
					type: 'link',
					href: match[1],
					text: match[2]
				});
			} else if (match[3]) {
				// Match for plain text
				result.push(match[3]);
			}
		}

		return result;
	}
</script>

{#each parseHtmlString(content) as piece}
	{#if typeof piece === 'string'}
		{piece}
	{:else if piece.type === 'link'}
		<ATag href={piece.href} class="">{piece.text}</ATag>
	{/if}
{/each}
