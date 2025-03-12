<script lang="ts">
	import { onMount } from 'svelte';
	import Spinner from './Spinner.svelte';

	let { imageUrl } = $props();
	let imageElement: HTMLImageElement | null = null;
	let imageLoaded = $state(false);
	let imageWidth = $state(0);
	let imageHeight = $state(0);

	function handleImageLoad() {
		if (imageElement === null) {
			return;
		}
		const { naturalWidth, naturalHeight } = imageElement;
		imageWidth = naturalWidth;
		imageHeight = naturalHeight;
		imageLoaded = true;
	}

	onMount(() => {
		if (imageElement === null) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (imageElement) {
							imageElement.src = imageUrl;
							observer.unobserve(imageElement);
						}
					}
				});
			},
			{ threshold: 0.1 }
		);

		observer.observe(imageElement);
	});
</script>

<div class="image-container" style="padding-top: {(imageHeight / imageWidth) * 100}%;">
	<!-- svelte-ignore a11y_img_redundant_alt -->
	<img
		bind:this={imageElement}
		alt="Dynamic Image"
		onload={handleImageLoad}
		loading="lazy"
		width={imageWidth}
		height={imageHeight}
	/>
	{#if !imageLoaded}
		<div class="flex w-full justify-center">
			<Spinner></Spinner>
		</div>
	{/if}
</div>

<style>
	.image-container {
		position: relative;
		width: 100%;
		background-color: #f0f0f0;
		overflow: hidden;
	}

	img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
</style>
