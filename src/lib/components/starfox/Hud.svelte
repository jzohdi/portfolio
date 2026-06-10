<script lang="ts">
	import { onMount } from 'svelte';

	let { score = 0 }: { score?: number } = $props();

	let isTouch = $state(false);

	onMount(() => {
		isTouch = window.matchMedia('(pointer: coarse)').matches;
	});

	const pad = (n: number) => String(Math.max(0, Math.min(n, 999))).padStart(3, '0');
</script>

<div class="hud">
	<div class="top-left">
		<div class="health-bar">
			<div class="health-fill"></div>
		</div>
		<div class="score">{pad(score)}<span class="score-ghost">000</span></div>
	</div>

	<div class="top-right">
		<div class="lives">
			<svg viewBox="0 0 24 16" class="life-icon" aria-hidden="true">
				<polygon points="12,0 14,10 24,13 12,16 0,13 10,10" fill="#cfd6ff" stroke="#5a6aff" stroke-width="1" />
			</svg>
			<span class="lives-count">&times;&nbsp;2</span>
		</div>
		<div class="bombs">
			<span class="bomb"></span>
			<span class="bomb"></span>
			<span class="bomb"></span>
		</div>
	</div>

	<div class="dialog">
		<div class="avatar">JZ</div>
		<div class="dialog-body">
			<div class="speaker">JAKE</div>
			<p class="message">
				{#if isTouch}
					Drag the left side to fly. Hold FIRE to shoot!
				{:else}
					Arrows / WASD to fly &middot; SPACE to fire &middot; SHIFT boost &middot; CTRL brake
				{/if}
			</p>
		</div>
	</div>
</div>

<style>
	.hud {
		position: absolute;
		inset: 0;
		pointer-events: none;
		font-family: 'Courier New', monospace;
		user-select: none;
		-webkit-user-select: none;
	}

	.top-left {
		position: absolute;
		top: 16px;
		left: 20px;
	}

	.health-bar {
		width: 160px;
		height: 18px;
		border: 2px solid #d8dce8;
		border-radius: 3px;
		background: rgba(10, 14, 24, 0.55);
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
	}

	.health-fill {
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, #ff5a00 0%, #ffb300 35%, #ffe95e 65%, #b9c6e8 100%);
	}

	.score {
		margin-top: 4px;
		font-size: 34px;
		font-weight: 700;
		letter-spacing: 2px;
		color: #9fd8e8;
		text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.6);
		line-height: 1;
	}

	.score-ghost {
		color: rgba(255, 255, 255, 0.25);
		margin-left: 2px;
	}

	.top-right {
		position: absolute;
		top: 16px;
		right: 20px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
	}

	.lives {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.life-icon {
		width: 30px;
		height: 20px;
	}

	.lives-count {
		font-size: 20px;
		font-weight: 700;
		color: #ffe95e;
		text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.6);
	}

	.bombs {
		display: flex;
		gap: 6px;
	}

	.bomb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #ff8a8a, #c40016 70%);
		border: 1px solid #5e0010;
		box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.5);
	}

	.dialog {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: 18px;
		display: flex;
		align-items: stretch;
		gap: 10px;
		max-width: min(560px, calc(100% - 32px));
	}

	.avatar {
		flex: 0 0 auto;
		width: 58px;
		height: 58px;
		display: grid;
		place-items: center;
		font-size: 22px;
		font-weight: 700;
		color: #d6ffd9;
		background: linear-gradient(135deg, #1d3a26, #2c5a3a);
		border: 2px solid #58ff7a;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5);
	}

	.dialog-body {
		background: rgba(20, 30, 80, 0.72);
		border: 2px solid rgba(160, 180, 255, 0.55);
		border-radius: 4px;
		padding: 6px 14px 8px;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4);
	}

	.speaker {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 2px;
		color: #ffe95e;
		text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
	}

	.message {
		margin: 2px 0 0;
		font-size: 16px;
		font-weight: 700;
		color: #f0f2ff;
		text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
	}

	/* Touch devices get on-screen buttons instead of written instructions. */
	@media (pointer: coarse) {
		.dialog {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.health-bar {
			width: 110px;
			height: 14px;
		}

		.score {
			font-size: 26px;
		}

		.dialog {
			bottom: 130px;
		}

		.avatar {
			width: 44px;
			height: 44px;
			font-size: 16px;
		}

		.message {
			font-size: 13px;
		}
	}
</style>
