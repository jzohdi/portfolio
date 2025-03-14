<script lang="ts">
	import Spacer from '$lib/components/Spacer.svelte';
	import { onDestroy, onMount } from 'svelte';
	import LocalStorageManager from '$lib/utils/experiments/2048ai/storage';
	import HTMLActuator from '$lib/utils/experiments/2048ai/actuator';
	import {
		KeyboardInputManager,
		handleKeyDown,
		handleTouchEnd,
		handleTouchStart
	} from '$lib/utils/experiments/2048ai/inputManager';
	import GameManager from '$lib/utils/experiments/2048ai/game';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import {
		AlphaBetaAI,
		calculateQueueCapacity,
		gradientSmoothness,
		maxTile,
		numberOfEmptySquares,
		scoreTiles
	} from '$lib/utils/experiments/2048ai/ai';
	import Slider from '$lib/components/ui/slider/slider.svelte';

	let tileContainerDiv: HTMLDivElement;
	let scoreContainerDiv: HTMLDivElement;
	let bestContainerDiv: HTMLDivElement;
	let gameMessageDiv: HTMLDivElement;
	let restartButtonEle: HTMLButtonElement;
	let retryButtonEle: HTMLButtonElement;
	let keepPlayingButtonEle: HTMLButtonElement;
	let gameContainerEle: HTMLDivElement;

	// Respond to swipe events
	let touchStartClientX: number;
	let touchStartClientY: number;
	let inputManager: KeyboardInputManager;
	let isRunningAi: boolean = $state(false);
	let gameManager: GameManager | null = $state(null);
	let gameAI: AlphaBetaAI | null = $state(null);
	let aiAnimationFrameId: number | undefined;
	let aiAnimationClosure = $state(() => {});
	let heuristics = $state([
		{ ...gradientSmoothness, score: 0 },
		{ ...numberOfEmptySquares, score: 0 },
		{ ...scoreTiles, score: 0 }
	]);
	let depth = $state(10);

	// Define an action that attaches an event listener with { passive: false }
	export function nonPassiveEvent(
		node: HTMLElement,
		params: { event: string; handler: (e: Event) => void }
	) {
		const { event, handler } = params;
		node.addEventListener(event, handler, { passive: false });

		return {
			destroy() {
				node.removeEventListener(event, handler);
			}
		};
	}

	function handleRestart(event: Event) {
		inputManager.restart(event);
	}

	onMount(() => {
		inputManager = new KeyboardInputManager(
			restartButtonEle,
			retryButtonEle,
			keepPlayingButtonEle,
			gameContainerEle
		);
		gameManager = new GameManager(
			4,
			inputManager,
			new HTMLActuator(tileContainerDiv, scoreContainerDiv, bestContainerDiv, gameMessageDiv),
			new LocalStorageManager()
		);
		gameAI = new AlphaBetaAI(gameManager, heuristics);

		aiAnimationClosure = () => {
			if (!isRunningAi && aiAnimationFrameId !== undefined) {
				cancelAI();
				return;
			}
			// cancel the ai loop if game got terminated
			if (gameManager?.isGameTerminated()) {
				cancelAI();
				return;
			}
			// calcluate and move if not terminated
			const bestMove = gameAI?.calculateBestMove();
			gameManager?.move(bestMove);

			// updated heuristics scores on ui
			if (gameManager !== null) {
				for (const heur of heuristics) {
					heur.score = heur.func(gameManager.getCurrentGridCopy());
				}
			}
			// debugging didWin gets set even though max tile isn't 2048
			if (gameManager?.didWin()) {
				const currentGrid = gameManager.getCurrentGridCopy();
				const max = maxTile(currentGrid);
				if (max < 2048) {
					gameManager.setDidWin(false);
				}
			}

			aiAnimationFrameId = requestAnimationFrame(aiAnimationClosure);
		};
	});

	function handleToggleRunAi(runAiCheckedState: boolean) {
		isRunningAi = runAiCheckedState;
		gameManager?.setShouldKeepGoing(runAiCheckedState);
		aiAnimationClosure();
	}

	function cancelAI() {
		if (aiAnimationFrameId !== undefined) {
			cancelAnimationFrame(aiAnimationFrameId);
			aiAnimationFrameId = undefined;
		}
		gameManager?.setShouldKeepGoing(false);
		isRunningAi = false;
	}

	onDestroy(() => {
		cancelAI();
	});
</script>

<svelte:head>
	<link href="/2048/main.css" rel="stylesheet" type="text/css" />
</svelte:head>

<svelte:document
	onkeydown={(event) => {
		if (!isRunningAi) {
			handleKeyDown(event, inputManager);
		}
	}}
/>

<div class="container-2048 body-no-scroll">
	<Spacer height="20px" />
	<div class="heading">
		<h1 class="title">2048</h1>
		<div class="scores-container text-sm">
			<div bind:this={scoreContainerDiv} class="score-container">0</div>
			<div bind:this={bestContainerDiv} class="best-container">0</div>
		</div>
	</div>

	<div class="above-game">
		<p class="game-intro">Join the numbers and get to the <strong>2048 tile!</strong></p>
		<button onclick={handleRestart} bind:this={restartButtonEle} class="restart-button"
			>New Game</button
		>
	</div>

	<div
		use:nonPassiveEvent={{
			event: 'touchmove',
			handler: (e) => {
				if (isRunningAi) {
					return;
				}
				if (gameManager?.isGameTerminated()) {
					return;
				}
				e.preventDefault();
			}
		}}
		use:nonPassiveEvent={{
			event: 'touchstart',
			handler: (e) => {
				if (isRunningAi) {
					return;
				}
				if (gameManager?.isGameTerminated()) {
					return;
				}
				if (e instanceof TouchEvent) {
					const result = handleTouchStart(e);
					if (result) {
						touchStartClientX = result.touchStartClientX;
						touchStartClientY = result.touchStartClientY;
					}
				}
			}
		}}
		use:nonPassiveEvent={{
			event: 'touchend',
			handler: (e) => {
				if (isRunningAi) {
					return;
				}
				if (gameManager?.isGameTerminated()) {
					return;
				}
				if (e instanceof TouchEvent) {
					handleTouchEnd(e, { touchStartClientX, touchStartClientY }, inputManager);
				}
			}
		}}
		bind:this={gameContainerEle}
		class="game-container"
	>
		<div bind:this={gameMessageDiv} class="game-message">
			<p></p>
			<div class="lower">
				<button bind:this={keepPlayingButtonEle} class="keep-playing-button">Keep going</button>
				<button onclick={handleRestart} bind:this={retryButtonEle} class="retry-button"
					>Try again</button
				>
			</div>
		</div>

		<div class="grid-container text-white">
			<div class="grid-row">
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
			</div>
			<div class="grid-row">
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
			</div>
			<div class="grid-row">
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
			</div>
			<div class="grid-row">
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
				<div class="grid-cell"></div>
			</div>
		</div>

		<div bind:this={tileContainerDiv} class="tile-container text-white"></div>
	</div>
	<Spacer height="20px"></Spacer>
	<section>
		<div class="flex items-center space-x-10">
			<div class="flex items-center space-x-2">
				<Switch
					bind:checked={() => isRunningAi, handleToggleRunAi}
					id="run-ai-switch"
					class="data-[state=checked]:bg-secondary"
				/>
				<Label for="run-ai-switch">Run AI</Label>
			</div>
			<div class="flex-1 py-4 text-sm">
				<span class="flex flex-wrap items-center gap-3">
					<span class="whitespace-nowrap">
						<Label for="depth-slider">AI Depth</Label>
						<span>{depth}</span>
					</span>
					<span class="whitespace-nowrap">
						<strong class="">nodes:</strong>
						<span class="ml-1">{calculateQueueCapacity(depth, 3)}</span>
					</span>
				</span>
				<Slider
					class="pt-2"
					id="depth-slider"
					value={[depth]}
					onValueChange={(value) => {
						depth = value[0];
						if (gameAI) {
							gameAI.setDepthLimit(depth);
						}
					}}
					max={14}
					min={2}
					step={1}
				/>
			</div>
		</div>
		<Spacer height="20px"></Spacer>
		{#each heuristics as heur}
			<div>
				<strong class="text-sm">{heur.label}</strong>
				<div class="pb-3 pt-1"><strong class="pr-1">score:</strong>{heur.score}</div>
			</div>
		{/each}
	</section>
	<p class="game-explanation py-4">
		<strong class="important">How to play:</strong> Use your <strong>arrow keys</strong> to move the
		tiles. When two tiles with the same number touch, they <strong>merge into one!</strong>
	</p>
	<hr />
	<p class="py-4">
		Based on <a target="_blank" href="https://play2048.co/">2048</a> by
		<a href="http://gabrielecirulli.com" target="_blank">Gabriele Cirulli.</a>
		Based on
		<a href="https://itunes.apple.com/us/app/1024!/id823499224" target="_blank"
			>1024 by Veewo Studio</a
		>
		and conceptually similar to
		<a href="http://asherv.com/threes/" target="_blank">Threes by Asher Vollmer.</a>
	</p>
	<Spacer height="100px"></Spacer>
</div>

<style>
	/* .keep-playing-button,
	.retry-button {
		color: #776e65;
		font-weight: bold;
		text-decoration: underline;
		cursor: pointer;
	}

	.game-container .game-message button {
		display: inline-block;
		background: #8f7a66;
		border-radius: 3px;
		padding: 0 20px;
		text-decoration: none;
		color: #f9f6f2;
		height: 40px;
		line-height: 42px;
		margin-left: 9px;
	} */
</style>
