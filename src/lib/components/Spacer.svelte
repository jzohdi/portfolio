<script lang="ts">
	interface SpacerProps {
		width?: string
		height?: string
	}
	let { width, height }: SpacerProps = $props();
</script>

<div class="spacer" style:height={height} style:width={width}></div>

<style>
	.spacer {
		width: 100%;
		height: 100%;
	}
</style>