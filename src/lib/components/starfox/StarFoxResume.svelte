<script lang="ts">
	import { onMount } from 'svelte';
	import { StarFoxGame, type SectionEvent } from './game/game';
	import { createInputState } from './game/types';
	import { RESUME_SECTIONS } from './game/resume-data';
	import Hud from './Hud.svelte';
	import TouchControls from './TouchControls.svelte';

	let container: HTMLDivElement;
	let bleed: HTMLDivElement;
	const touchInput = createInputState();
	let score = $state(0);
	let sectionIdx = $state(0);
	let phase: 'in' | 'out' | 'complete' = $state('in');

	const section = $derived(RESUME_SECTIONS[sectionIdx]);

	function handleSection(event: SectionEvent) {
		if (event === 'complete') {
			phase = 'complete';
		} else if (event === null) {
			phase = 'out';
		} else {
			sectionIdx = event;
			phase = 'in';
		}
	}

	onMount(() => {
		// 100vw includes the scrollbar; use the real viewport width so the
		// full-bleed block lines up exactly edge to edge.
		const updateBleedWidth = () =>
			bleed.style.setProperty('--full-vw', `${document.documentElement.clientWidth}px`);
		updateBleedWidth();
		window.addEventListener('resize', updateBleedWidth);

		const game = new StarFoxGame(container, touchInput, {
			sectionCount: RESUME_SECTIONS.length,
			onScore: (s) => (score = s),
			onSection: handleSection
		});
		game.start();
		return () => {
			window.removeEventListener('resize', updateBleedWidth);
			game.dispose();
		};
	});
</script>

<div class="game-bleed" bind:this={bleed}>
	<div class="game-canvas" bind:this={container}></div>
	<Hud {score} />

	{#if phase === 'complete'}
		<div class="mission-complete">
			<div class="mission-title">MISSION COMPLETE</div>
			<div class="mission-sub">Thanks for reading my resume!</div>
		</div>
	{:else}
		{#key sectionIdx}
			<div class="resume-card" class:out={phase === 'out'}>
				<div class="card-top">
					<span class="card-progress">{sectionIdx + 1} / {RESUME_SECTIONS.length}</span>
					<span class="card-hint">SHOOT THE CORE &#9670;</span>
				</div>
				<h3 class="card-title">{section.title}</h3>
				{#if section.subtitle}
					<div class="card-subtitle">{section.subtitle}</div>
				{/if}
				<ul class="card-lines">
					{#each section.lines as line}
						<li>{line}</li>
					{/each}
				</ul>
			</div>
		{/key}
	{/if}

	<TouchControls input={touchInput} />
</div>

<style>
	/* Break out of any centered container, edge to edge. */
	.game-bleed {
		position: relative;
		width: var(--full-vw, 100vw);
		margin-left: calc((100% - var(--full-vw, 100vw)) / 2);
		height: calc(100dvh - 64px);
		min-height: 420px;
		overflow: hidden;
		background: #4a5160;
		touch-action: none;
		font-family: 'Courier New', monospace;
	}

	.game-canvas {
		position: absolute;
		inset: 0;
	}

	.game-canvas :global(canvas) {
		display: block;
	}

	.resume-card {
		position: absolute;
		top: 88px;
		left: 50%;
		transform: translateX(-50%);
		width: min(440px, calc(100% - 24px));
		padding: 10px 16px 12px;
		background: rgba(14, 22, 58, 0.78);
		border: 2px solid rgba(160, 180, 255, 0.6);
		border-radius: 4px;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.45);
		color: #f0f2ff;
		pointer-events: none;
		animation: card-in 0.3s ease-out;
	}

	.resume-card.out {
		animation: card-out 0.25s ease-in forwards;
	}

	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateX(-50%) scale(0.85);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) scale(1);
		}
	}

	@keyframes card-out {
		to {
			opacity: 0;
			transform: translateX(-50%) scale(1.12);
		}
	}

	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1px;
		color: #9fd8e8;
		text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
	}

	.card-hint {
		color: #58ff7a;
	}

	.card-title {
		margin: 4px 0 0;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: 2px;
		color: #ffe95e;
		text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.7);
	}

	.card-subtitle {
		font-size: 13px;
		font-weight: 700;
		color: #9fd8e8;
		text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
	}

	.card-lines {
		margin: 8px 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.card-lines li {
		font-size: 13px;
		font-weight: 700;
		line-height: 1.35;
		text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
		padding-left: 14px;
		position: relative;
	}

	.card-lines li::before {
		content: '\25B8';
		position: absolute;
		left: 0;
		color: #58ff7a;
	}

	.mission-complete {
		position: absolute;
		top: 22%;
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: calc(100% - 24px);
		text-align: center;
		pointer-events: none;
		animation: card-in 0.4s ease-out;
	}

	.mission-title {
		font-size: clamp(28px, 6vw, 52px);
		font-weight: 700;
		letter-spacing: 4px;
		color: #ffe95e;
		text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.7);
	}

	.mission-sub {
		margin-top: 8px;
		font-size: 16px;
		font-weight: 700;
		color: #f0f2ff;
		text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.7);
	}

	@media (max-width: 640px) {
		/* Keep as much of the canvas clear as possible: pin the card to the
		   very top, overlapping the HUD. */
		.resume-card {
			top: 6px;
			padding: 8px 12px 10px;
		}

		.card-title {
			font-size: 16px;
		}

		.card-subtitle {
			font-size: 11px;
		}

		.card-lines li {
			font-size: 11px;
		}
	}
</style>
