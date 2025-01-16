<script lang="ts">
	let { children } = $props();
</script>

<div class="m-auto max-w-[800px] pb-10">
	{@render children()}
</div>
