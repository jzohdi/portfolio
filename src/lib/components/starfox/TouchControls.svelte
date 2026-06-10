<script lang="ts">
	import type { InputState } from './game/types';

	let { input }: { input: InputState } = $props();

	const RADIUS = 56;

	let zone: HTMLDivElement;
	let joyActive = $state(false);
	let baseX = $state(0);
	let baseY = $state(0);
	let knobX = $state(0);
	let knobY = $state(0);
	let pointerId: number | null = null;

	function onJoyDown(e: PointerEvent) {
		if (pointerId !== null) return;
		try {
			zone.setPointerCapture(e.pointerId);
		} catch {
			// capture is best-effort; tracking works without it
		}
		pointerId = e.pointerId;
		const rect = zone.getBoundingClientRect();
		baseX = e.clientX - rect.left;
		baseY = e.clientY - rect.top;
		knobX = 0;
		knobY = 0;
		joyActive = true;
	}

	function onJoyMove(e: PointerEvent) {
		if (e.pointerId !== pointerId) return;
		const rect = zone.getBoundingClientRect();
		let dx = e.clientX - rect.left - baseX;
		let dy = e.clientY - rect.top - baseY;
		const len = Math.hypot(dx, dy);
		if (len > RADIUS) {
			dx *= RADIUS / len;
			dy *= RADIUS / len;
		}
		knobX = dx;
		knobY = dy;
		input.x = dx / RADIUS;
		input.y = -dy / RADIUS; // screen-down drag = fly down
	}

	function onJoyUp(e: PointerEvent) {
		if (e.pointerId !== pointerId) return;
		pointerId = null;
		joyActive = false;
		input.x = 0;
		input.y = 0;
	}

	function hold(key: 'fire' | 'boost') {
		return {
			onpointerdown: (e: PointerEvent) => {
				e.preventDefault();
				try {
					(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
				} catch {
					// capture is best-effort
				}
				input[key] = true;
			},
			onpointerup: () => (input[key] = false),
			onpointercancel: () => (input[key] = false)
		};
	}

	const fireHandlers = hold('fire');
	const boostHandlers = hold('boost');
</script>

<div class="touch-layer">
	<div
		class="joy-zone"
		bind:this={zone}
		onpointerdown={onJoyDown}
		onpointermove={onJoyMove}
		onpointerup={onJoyUp}
		onpointercancel={onJoyUp}
	>
		{#if joyActive}
			<div class="joy-base" style="left: {baseX}px; top: {baseY}px;">
				<div class="joy-knob" style="transform: translate({knobX}px, {knobY}px);"></div>
			</div>
		{/if}
	</div>

	<div class="buttons">
		<button class="btn boost" {...boostHandlers} aria-label="Boost">B</button>
		<button class="btn fire" {...fireHandlers} aria-label="Fire">FIRE</button>
	</div>
</div>

<style>
	.touch-layer {
		display: none;
	}

	@media (pointer: coarse) {
		.touch-layer {
			display: block;
			position: absolute;
			inset: 0;
		}
	}

	.joy-zone {
		position: absolute;
		left: 0;
		bottom: 0;
		width: 55%;
		height: 65%;
		touch-action: none;
	}

	.joy-base {
		position: absolute;
		width: 124px;
		height: 124px;
		margin: -62px 0 0 -62px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.45);
		background: rgba(255, 255, 255, 0.08);
		pointer-events: none;
	}

	.joy-knob {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 52px;
		height: 52px;
		margin: -26px 0 0 -26px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.55);
		box-shadow: 0 0 12px rgba(0, 0, 0, 0.4);
	}

	.buttons {
		position: absolute;
		right: 18px;
		bottom: 24px;
		display: flex;
		align-items: flex-end;
		gap: 14px;
		touch-action: none;
	}

	.btn {
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.6);
		color: #fff;
		font-family: 'Courier New', monospace;
		font-weight: 700;
		text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6);
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
	}

	.btn:active {
		filter: brightness(1.4);
	}

	.fire {
		width: 84px;
		height: 84px;
		font-size: 18px;
		background: radial-gradient(circle at 35% 30%, rgba(120, 255, 120, 0.85), rgba(20, 120, 40, 0.85));
	}

	.boost {
		width: 56px;
		height: 56px;
		font-size: 16px;
		background: radial-gradient(circle at 35% 30%, rgba(150, 180, 255, 0.85), rgba(40, 60, 160, 0.85));
	}
</style>
