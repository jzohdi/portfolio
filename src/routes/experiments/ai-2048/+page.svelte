<script lang="ts">
	import Spacer from '$lib/components/Spacer.svelte';
	import { onDestroy, onMount } from 'svelte';
	import LocalStorageManager from '$lib/utils/experiments/2048ai/storage';
	import HTMLActuator from '$lib/utils/experiments/2048ai/actuator';
	import {
		KeyboardInputManager,
		handleKeyDown,
		handleTouchEnd,
		handleTouchMove,
		handleTouchStart
	} from '$lib/utils/experiments/2048ai/inputManager';
	import GameManager from '$lib/utils/experiments/2048ai/game';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { AlphaBetaAI, gradientSmoothness } from '$lib/utils/experiments/2048ai/ai';

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
	let gameManager: GameManager;
	let gameAI: AlphaBetaAI;
	let aiAnimationFrameId: number | undefined;
	let heuristics = $state([gradientSmoothness]);

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
	});

	function handleToggleRunAi(runAiCheckedState: boolean) {
		isRunningAi = runAiCheckedState;
		animateAI();
	}

	function animateAI() {
		if (isRunningAi) {
			if (!gameManager.isGameTerminated()) {
				const bestMove = gameAI.calculateBestMove();
				gameManager.move(bestMove);
			}
			aiAnimationFrameId = requestAnimationFrame(animateAI);
		} else if (aiAnimationFrameId !== undefined) {
			cancelAI();
		}
	}

	function cancelAI() {
		if (aiAnimationFrameId !== undefined) {
			cancelAnimationFrame(aiAnimationFrameId);
			aiAnimationFrameId = undefined;
		}
		isRunningAi = false;
	}

	onDestroy(() => {
		cancelAI();
	});
</script>

<svelte:head>
	<link href="/2048/main.css" rel="stylesheet" type="text/css" />
</svelte:head>

<svelte:document onkeydown={(event) => handleKeyDown(event, inputManager)} />

<div class="container-2048">
	<div class="heading">
		<h1 class="title">2048</h1>
		<div class="scores-container">
			<div bind:this={scoreContainerDiv} class="score-container">0</div>
			<div bind:this={bestContainerDiv} class="best-container">0</div>
		</div>
	</div>

	<div class="above-game">
		<p class="game-intro">Join the numbers and get to the <strong>2048 tile!</strong></p>
		<button bind:this={restartButtonEle} class="restart-button">New Game</button>
	</div>

	<div
		ontouchstart={(event) => {
			const result = handleTouchStart(event);
			if (result) {
				touchStartClientX = result.touchStartClientX;
				touchStartClientY = result.touchStartClientY;
			}
		}}
		ontouchmove={(event) => handleTouchMove(event)}
		ontouchend={(event) =>
			handleTouchEnd(event, { touchStartClientX, touchStartClientY }, inputManager)}
		bind:this={gameContainerEle}
		class="game-container"
	>
		<div bind:this={gameMessageDiv} class="game-message">
			<p></p>
			<div class="lower">
				<button bind:this={keepPlayingButtonEle} class="keep-playing-button">Keep going</button>
				<button bind:this={retryButtonEle} class="retry-button">Try again</button>
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
	<Spacer height="50px"></Spacer>
	<div></div>
	<div class="flex items-center space-x-2">
		<Switch
			bind:checked={() => isRunningAi, handleToggleRunAi}
			id="airplane-mode"
			class="data-[state=checked]:bg-secondary"
		/>
		<Label for="airplane-mode">Run AI</Label>
	</div>
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
