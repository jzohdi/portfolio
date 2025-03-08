<script lang="ts">
	import Spacer from '$lib/components/Spacer.svelte';
	import { onMount } from 'svelte';
	import type {
		MoveDirection,
		PositionXY,
		SerializedGameManager,
		SerializedTile
	} from '$lib/utils/experiments/2048ai/types';
	import Tile from '$lib/utils/experiments/2048ai/tile';
	import LocalStorageManager from '$lib/utils/experiments/2048ai/storage';
	import Grid from '$lib/utils/experiments/2048ai/grid';
	import HTMLActuator from '$lib/utils/experiments/2048ai/actuator';
	import {
		KeyboardInputManager,
		handleKeyDown,
		handleTouchEnd,
		handleTouchMove,
		handleTouchStart
	} from '$lib/utils/experiments/2048ai/inputManager';
	import GameManager from '$lib/utils/experiments/2048ai/game';

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

	onMount(() => {
		inputManager = new KeyboardInputManager(
			restartButtonEle,
			retryButtonEle,
			keepPlayingButtonEle,
			gameContainerEle
		);
		// Wait till the browser is ready to render the game (avoids glitches)
		requestAnimationFrame(() => {
			new GameManager(
				4,
				inputManager,
				new HTMLActuator(tileContainerDiv, scoreContainerDiv, bestContainerDiv, gameMessageDiv),
				new LocalStorageManager()
			);
		});
	});
</script>

<svelte:head>
	<link href="/2048/main.css" rel="stylesheet" type="text/css" />
</svelte:head>

<svelte:document on:keydown={(event) => handleKeyDown(event, inputManager)} />

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
		on:touchstart={(event) => {
			const result = handleTouchStart(event);
			if (result) {
				touchStartClientX = result.touchStartClientX;
				touchStartClientY = result.touchStartClientY;
			}
		}}
		on:touchmove={(event) => handleTouchMove(event)}
		on:touchend={(event) =>
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

	<p class="game-explanation">
		<strong class="important">How to play:</strong> Use your <strong>arrow keys</strong> to move the
		tiles. When two tiles with the same number touch, they <strong>merge into one!</strong>
	</p>
	<hr />
	<p>
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
