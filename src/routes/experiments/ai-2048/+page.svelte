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

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// local reactive
	let tim = $state(false);

	// imperatively update `tim` whenever `page` changes
	$effect(() => {
		tim = $page.url.searchParams.get('tim') === 'true';
	});

	function toggleTim(isOn: boolean) {
		const params = new URLSearchParams($page.url.searchParams);
		if (isOn) {
			params.set('tim', 'true');
		} else {
			params.delete('tim');
		}
		const q = params.toString();
		goto($page.url.pathname + (q ? `?${q}` : ''), {
			replaceState: true,
			noScroll: true
		});
	}

	let tileContainerDiv: HTMLDivElement;
	let scoreContainerDiv: HTMLDivElement;
	let bestContainerDiv: HTMLDivElement;
	let gameMessageDiv: HTMLDivElement;
	let restartButtonEle: HTMLButtonElement;
	let retryButtonEle: HTMLButtonElement;
	let keepPlayingButtonEle: HTMLButtonElement;
	let gameContainerEle: HTMLDivElement;

	// tim mode
	// let timRobinsonMode = $state(false);

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
	<style>
		/* @import url(../../../static/2048/fonts/clear-sans.css); */

		body:has(div.body-no-scroll) {
			overflow: hidden;
		}

		.page-content {
			font-family: 'Clear Sans', 'Helvetica Neue', Arial, sans-serif;
			font-size: 18px;
		}

		.field-sizing-content {
			field-sizing: content;
		}

		.heading:after {
			content: '';
			display: block;
			clear: both;
		}

		h1.title {
			font-size: 80px;
			font-weight: bold;
			margin: 0;
			display: block;
			float: left;
		}

		@-webkit-keyframes move-up {
			0% {
				top: 25px;
				opacity: 1;
			}

			100% {
				top: -50px;
				opacity: 0;
			}
		}

		@-moz-keyframes move-up {
			0% {
				top: 25px;
				opacity: 1;
			}

			100% {
				top: -50px;
				opacity: 0;
			}
		}

		@keyframes move-up {
			0% {
				top: 25px;
				opacity: 1;
			}

			100% {
				top: -50px;
				opacity: 0;
			}
		}

		.scores-container {
			float: right;
			text-align: right;
		}

		.score-container,
		.best-container {
			position: relative;
			display: inline-block;
			background: #bbada0;
			padding-top: 19px;
			padding-left: 25px;
			padding-right: 25px;
			height: fit-content;
			line-height: 47px;
			font-weight: bold;
			border-radius: 3px;
			color: white;
			margin-top: 8px;
			text-align: center;
		}

		.score-container:after,
		.best-container:after {
			position: absolute;
			width: 100%;
			top: 10px;
			left: 0;
			text-transform: uppercase;
			font-size: 13px;
			line-height: 13px;
			text-align: center;
			color: #eee4da;
		}

		.score-container .score-addition,
		.best-container .score-addition {
			position: absolute;
			right: 30px;
			color: red;
			font-size: 25px;
			line-height: 25px;
			font-weight: bold;
			color: rgba(119, 110, 101, 0.9);
			z-index: 100;
			-webkit-animation: move-up 600ms ease-in;
			-moz-animation: move-up 600ms ease-in;
			animation: move-up 600ms ease-in;
			-webkit-animation-fill-mode: both;
			-moz-animation-fill-mode: both;
			animation-fill-mode: both;
		}

		.score-container:after {
			content: 'Score';
		}

		.best-container:after {
			content: 'Best';
		}

		strong.important {
			text-transform: uppercase;
		}

		hr {
			border: none;
			border-bottom: 1px solid #d8d4d0;
			margin-top: 20px;
			margin-bottom: 30px;
		}

		.container-2048 {
			width: 500px;
			margin: 0 auto;
		}

		@-webkit-keyframes fade-in {
			0% {
				opacity: 0;
			}

			100% {
				opacity: 1;
			}
		}

		@-moz-keyframes fade-in {
			0% {
				opacity: 0;
			}

			100% {
				opacity: 1;
			}
		}

		@keyframes fade-in {
			0% {
				opacity: 0;
			}

			100% {
				opacity: 1;
			}
		}

		.game-container {
			margin-top: 40px;
			position: relative;
			padding: 15px;
			cursor: default;
			-webkit-touch-callout: none;
			-ms-touch-callout: none;
			-webkit-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
			-ms-touch-action: none;
			touch-action: none;
			background: #bbada0;
			border-radius: 6px;
			width: 500px;
			height: 500px;
			-webkit-box-sizing: border-box;
			-moz-box-sizing: border-box;
			box-sizing: border-box;
		}

		.game-container .game-message {
			display: none;
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			background: rgba(238, 228, 218, 0.5);
			z-index: 100;
			text-align: center;
			-webkit-animation: fade-in 800ms ease 1200ms;
			-moz-animation: fade-in 800ms ease 1200ms;
			animation: fade-in 800ms ease 1200ms;
			-webkit-animation-fill-mode: both;
			-moz-animation-fill-mode: both;
			animation-fill-mode: both;
		}

		.game-container .game-message p {
			font-size: 60px;
			font-weight: bold;
			height: 60px;
			line-height: 60px;
			margin-top: 222px;
		}

		.game-container .game-message .lower {
			display: block;
			margin-top: 59px;
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
		}

		.game-container .game-message button.keep-playing-button {
			display: none;
		}

		.game-container .game-message.game-won {
			background: rgba(237, 194, 46, 0.5);
			color: #f9f6f2;
		}

		.game-container .game-message.game-won button.keep-playing-button {
			display: inline-block;
		}

		.game-container .game-message.game-won,
		.game-container .game-message.game-over {
			display: block;
		}

		.grid-container {
			position: absolute;
			z-index: 1;
		}

		.grid-row {
			margin-bottom: 15px;
		}

		.grid-row:last-child {
			margin-bottom: 0;
		}

		.grid-row:after {
			content: '';
			display: block;
			clear: both;
		}

		.grid-cell {
			width: 106.25px;
			height: 106.25px;
			margin-right: 15px;
			float: left;
			border-radius: 3px;
			background: rgba(238, 228, 218, 0.35);
		}

		.grid-cell:last-child {
			margin-right: 0;
		}

		.tile-container {
			position: absolute;
			z-index: 2;
		}

		.tile,
		.tile .tile-inner {
			width: 107px;
			height: 107px;
			line-height: 107px;
		}

		.tile.tile-position-1-1 {
			-webkit-transform: translate(0px, 0px);
			-moz-transform: translate(0px, 0px);
			-ms-transform: translate(0px, 0px);
			transform: translate(0px, 0px);
		}

		.tile.tile-position-1-2 {
			-webkit-transform: translate(0px, 121px);
			-moz-transform: translate(0px, 121px);
			-ms-transform: translate(0px, 121px);
			transform: translate(0px, 121px);
		}

		.tile.tile-position-1-3 {
			-webkit-transform: translate(0px, 242px);
			-moz-transform: translate(0px, 242px);
			-ms-transform: translate(0px, 242px);
			transform: translate(0px, 242px);
		}

		.tile.tile-position-1-4 {
			-webkit-transform: translate(0px, 363px);
			-moz-transform: translate(0px, 363px);
			-ms-transform: translate(0px, 363px);
			transform: translate(0px, 363px);
		}

		.tile.tile-position-2-1 {
			-webkit-transform: translate(121px, 0px);
			-moz-transform: translate(121px, 0px);
			-ms-transform: translate(121px, 0px);
			transform: translate(121px, 0px);
		}

		.tile.tile-position-2-2 {
			-webkit-transform: translate(121px, 121px);
			-moz-transform: translate(121px, 121px);
			-ms-transform: translate(121px, 121px);
			transform: translate(121px, 121px);
		}

		.tile.tile-position-2-3 {
			-webkit-transform: translate(121px, 242px);
			-moz-transform: translate(121px, 242px);
			-ms-transform: translate(121px, 242px);
			transform: translate(121px, 242px);
		}

		.tile.tile-position-2-4 {
			-webkit-transform: translate(121px, 363px);
			-moz-transform: translate(121px, 363px);
			-ms-transform: translate(121px, 363px);
			transform: translate(121px, 363px);
		}

		.tile.tile-position-3-1 {
			-webkit-transform: translate(242px, 0px);
			-moz-transform: translate(242px, 0px);
			-ms-transform: translate(242px, 0px);
			transform: translate(242px, 0px);
		}

		.tile.tile-position-3-2 {
			-webkit-transform: translate(242px, 121px);
			-moz-transform: translate(242px, 121px);
			-ms-transform: translate(242px, 121px);
			transform: translate(242px, 121px);
		}

		.tile.tile-position-3-3 {
			-webkit-transform: translate(242px, 242px);
			-moz-transform: translate(242px, 242px);
			-ms-transform: translate(242px, 242px);
			transform: translate(242px, 242px);
		}

		.tile.tile-position-3-4 {
			-webkit-transform: translate(242px, 363px);
			-moz-transform: translate(242px, 363px);
			-ms-transform: translate(242px, 363px);
			transform: translate(242px, 363px);
		}

		.tile.tile-position-4-1 {
			-webkit-transform: translate(363px, 0px);
			-moz-transform: translate(363px, 0px);
			-ms-transform: translate(363px, 0px);
			transform: translate(363px, 0px);
		}

		.tile.tile-position-4-2 {
			-webkit-transform: translate(363px, 121px);
			-moz-transform: translate(363px, 121px);
			-ms-transform: translate(363px, 121px);
			transform: translate(363px, 121px);
		}

		.tile.tile-position-4-3 {
			-webkit-transform: translate(363px, 242px);
			-moz-transform: translate(363px, 242px);
			-ms-transform: translate(363px, 242px);
			transform: translate(363px, 242px);
		}

		.tile.tile-position-4-4 {
			-webkit-transform: translate(363px, 363px);
			-moz-transform: translate(363px, 363px);
			-ms-transform: translate(363px, 363px);
			transform: translate(363px, 363px);
		}

		.tile {
			position: absolute;
			-webkit-transition: 100ms ease-in-out;
			-moz-transition: 100ms ease-in-out;
			transition: 100ms ease-in-out;
			-webkit-transition-property: -webkit-transform;
			-moz-transition-property: -moz-transform;
			transition-property: transform;
		}

		.tile .tile-inner {
			border-radius: 3px;
			background: #eee4da;
			text-align: center;
			font-weight: bold;
			z-index: 10;
			font-size: 55px;
		}

		.tile.tile-2 .tile-inner {
			background: #eee4da;
			box-shadow:
				0 0 30px 10px rgba(243, 215, 116, 0),
				inset 0 0 0 1px rgba(255, 255, 255, 0);
		}

		.tile.tile-4 .tile-inner {
			background: #ede0c8;
			box-shadow:
				0 0 30px 10px rgba(243, 215, 116, 0),
				inset 0 0 0 1px rgba(255, 255, 255, 0);
		}

		.tile.tile-8 .tile-inner {
			color: #f9f6f2;
			background: #f2b179;
		}

		.tile.tile-16 .tile-inner {
			color: #f9f6f2;
			background: #f59563;
		}

		.tile.tile-32 .tile-inner {
			color: #f9f6f2;
			background: #f67c5f;
		}

		.tile.tile-64 .tile-inner {
			color: #f9f6f2;
			background: #f65e3b;
		}

		.tile.tile-128 .tile-inner {
			color: #f9f6f2;
			background: #edcf72;
			box-shadow:
				0 0 30px 10px rgba(243, 215, 116, 0.2381),
				inset 0 0 0 1px rgba(255, 255, 255, 0.14286);
			font-size: 45px;
		}

		@media screen and (max-width: 560px) {
			.tile.tile-128 .tile-inner {
				font-size: 25px;
			}
		}

		.tile.tile-256 .tile-inner {
			color: #f9f6f2;
			background: #edcc61;
			box-shadow:
				0 0 30px 10px rgba(243, 215, 116, 0.31746),
				inset 0 0 0 1px rgba(255, 255, 255, 0.19048);
			font-size: 45px;
		}

		@media screen and (max-width: 560px) {
			.tile.tile-256 .tile-inner {
				font-size: 25px;
			}
		}

		.tile.tile-512 .tile-inner {
			color: #f9f6f2;
			background: #edc850;
			box-shadow:
				0 0 30px 10px rgba(243, 215, 116, 0.39683),
				inset 0 0 0 1px rgba(255, 255, 255, 0.2381);
			font-size: 45px;
		}

		@media screen and (max-width: 560px) {
			.tile.tile-512 .tile-inner {
				font-size: 25px;
			}
		}

		.tile.tile-1024 .tile-inner {
			color: #f9f6f2;
			background: #edc53f;
			box-shadow:
				0 0 30px 10px rgba(243, 215, 116, 0.47619),
				inset 0 0 0 1px rgba(255, 255, 255, 0.28571);
			font-size: 35px;
		}

		@media screen and (max-width: 560px) {
			.tile.tile-1024 .tile-inner {
				font-size: 15px;
			}
		}

		.tile.tile-2048 .tile-inner {
			color: #f9f6f2;
			background: #edc22e;
			box-shadow:
				0 0 30px 10px rgba(243, 215, 116, 0.55556),
				inset 0 0 0 1px rgba(255, 255, 255, 0.33333);
			font-size: 35px;
		}

		@media screen and (max-width: 560px) {
			.tile.tile-2048 .tile-inner {
				font-size: 15px;
			}
		}

		.tile.tile-super .tile-inner {
			color: #f9f6f2;
			background: #3c3a32;
			font-size: 30px;
		}

		@media screen and (max-width: 560px) {
			.tile.tile-super .tile-inner {
				font-size: 10px;
			}
		}

		@-webkit-keyframes appear {
			0% {
				opacity: 0;
				-webkit-transform: scale(0);
				-moz-transform: scale(0);
				-ms-transform: scale(0);
				transform: scale(0);
			}

			100% {
				opacity: 1;
				-webkit-transform: scale(1);
				-moz-transform: scale(1);
				-ms-transform: scale(1);
				transform: scale(1);
			}
		}

		@-moz-keyframes appear {
			0% {
				opacity: 0;
				-webkit-transform: scale(0);
				-moz-transform: scale(0);
				-ms-transform: scale(0);
				transform: scale(0);
			}

			100% {
				opacity: 1;
				-webkit-transform: scale(1);
				-moz-transform: scale(1);
				-ms-transform: scale(1);
				transform: scale(1);
			}
		}

		@keyframes appear {
			0% {
				opacity: 0;
				-webkit-transform: scale(0);
				-moz-transform: scale(0);
				-ms-transform: scale(0);
				transform: scale(0);
			}

			100% {
				opacity: 1;
				-webkit-transform: scale(1);
				-moz-transform: scale(1);
				-ms-transform: scale(1);
				transform: scale(1);
			}
		}

		.tile-new .tile-inner {
			-webkit-animation: appear 200ms ease 100ms;
			-moz-animation: appear 200ms ease 100ms;
			animation: appear 200ms ease 100ms;
			-webkit-animation-fill-mode: backwards;
			-moz-animation-fill-mode: backwards;
			animation-fill-mode: backwards;
		}

		@-webkit-keyframes pop {
			0% {
				-webkit-transform: scale(0);
				-moz-transform: scale(0);
				-ms-transform: scale(0);
				transform: scale(0);
			}

			50% {
				-webkit-transform: scale(1.2);
				-moz-transform: scale(1.2);
				-ms-transform: scale(1.2);
				transform: scale(1.2);
			}

			100% {
				-webkit-transform: scale(1);
				-moz-transform: scale(1);
				-ms-transform: scale(1);
				transform: scale(1);
			}
		}

		@-moz-keyframes pop {
			0% {
				-webkit-transform: scale(0);
				-moz-transform: scale(0);
				-ms-transform: scale(0);
				transform: scale(0);
			}

			50% {
				-webkit-transform: scale(1.2);
				-moz-transform: scale(1.2);
				-ms-transform: scale(1.2);
				transform: scale(1.2);
			}

			100% {
				-webkit-transform: scale(1);
				-moz-transform: scale(1);
				-ms-transform: scale(1);
				transform: scale(1);
			}
		}

		@keyframes pop {
			0% {
				-webkit-transform: scale(0);
				-moz-transform: scale(0);
				-ms-transform: scale(0);
				transform: scale(0);
			}

			50% {
				-webkit-transform: scale(1.2);
				-moz-transform: scale(1.2);
				-ms-transform: scale(1.2);
				transform: scale(1.2);
			}

			100% {
				-webkit-transform: scale(1);
				-moz-transform: scale(1);
				-ms-transform: scale(1);
				transform: scale(1);
			}
		}

		.tile-merged .tile-inner {
			z-index: 20;
			-webkit-animation: pop 200ms ease 100ms;
			-moz-animation: pop 200ms ease 100ms;
			animation: pop 200ms ease 100ms;
			-webkit-animation-fill-mode: backwards;
			-moz-animation-fill-mode: backwards;
			animation-fill-mode: backwards;
		}

		.above-game:after {
			content: '';
			display: block;
			clear: both;
		}

		.game-intro {
			float: left;
			line-height: 42px;
			margin-bottom: 0;
		}

		.restart-button {
			display: inline-block;
			background: #8f7a66;
			border-radius: 3px;
			padding: 0 20px;
			text-decoration: none;
			color: #f9f6f2;
			height: 40px;
			line-height: 42px;
			display: block;
			text-align: center;
			float: right;
		}

		.game-explanation {
			margin-top: 50px;
		}

		@media screen and (max-width: 560px) {
			.page-content {
				font-size: 15px;
			}

			h1.title {
				font-size: 27px;
				margin-top: 15px;
			}

			.container-2048 {
				width: 280px;
				margin: 0 auto;
			}

			.game-container {
				width: 280px;
			}

			.score-container,
			.best-container {
				margin-top: 0;
				padding-top: 15px;
				padding-left: 10px;
				padding-right: 10px;
				min-width: 40px;
			}

			.heading {
				margin-bottom: 10px;
			}

			.game-intro {
				width: 55%;
				display: block;
				box-sizing: border-box;
				line-height: 1.65;
			}

			.restart-button {
				width: 42%;
				padding: 0;
				display: block;
				box-sizing: border-box;
				margin-top: 2px;
			}

			.game-container {
				margin-top: 17px;
				position: relative;
				padding: 10px;
				cursor: default;
				-webkit-touch-callout: none;
				-ms-touch-callout: none;
				-webkit-user-select: none;
				-moz-user-select: none;
				-ms-user-select: none;
				-ms-touch-action: none;
				touch-action: none;
				background: #bbada0;
				border-radius: 6px;
				width: 280px;
				height: 280px;
				-webkit-box-sizing: border-box;
				-moz-box-sizing: border-box;
				box-sizing: border-box;
			}

			.game-container .game-message {
				display: none;
				position: absolute;
				top: 0;
				right: 0;
				bottom: 0;
				left: 0;
				background: rgba(238, 228, 218, 0.5);
				z-index: 100;
				text-align: center;
				-webkit-animation: fade-in 800ms ease 1200ms;
				-moz-animation: fade-in 800ms ease 1200ms;
				animation: fade-in 800ms ease 1200ms;
				-webkit-animation-fill-mode: both;
				-moz-animation-fill-mode: both;
				animation-fill-mode: both;
			}

			.game-container .game-message p {
				font-size: 60px;
				font-weight: bold;
				height: 60px;
				line-height: 60px;
				margin-top: 222px;
			}

			.game-container .game-message .lower {
				display: block;
				margin-top: 59px;
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
			}

			.game-container .game-message button.keep-playing-button {
				display: none;
			}

			.game-container .game-message.game-won {
				background: rgba(237, 194, 46, 0.5);
				color: #f9f6f2;
			}

			.game-container .game-message.game-won button.keep-playing-button {
				display: inline-block;
			}

			.game-container .game-message.game-won,
			.game-container .game-message.game-over {
				display: block;
			}

			.grid-container {
				position: absolute;
				z-index: 1;
			}

			.grid-row {
				margin-bottom: 10px;
			}

			.grid-row:last-child {
				margin-bottom: 0;
			}

			.grid-row:after {
				content: '';
				display: block;
				clear: both;
			}

			.grid-cell {
				width: 57.5px;
				height: 57.5px;
				margin-right: 10px;
				float: left;
				border-radius: 3px;
				background: rgba(238, 228, 218, 0.35);
			}

			.grid-cell:last-child {
				margin-right: 0;
			}

			.tile-container {
				position: absolute;
				z-index: 2;
			}

			.tile,
			.tile .tile-inner {
				width: 58px;
				height: 58px;
				line-height: 58px;
			}

			.tile.tile-position-1-1 {
				-webkit-transform: translate(0px, 0px);
				-moz-transform: translate(0px, 0px);
				-ms-transform: translate(0px, 0px);
				transform: translate(0px, 0px);
			}

			.tile.tile-position-1-2 {
				-webkit-transform: translate(0px, 67px);
				-moz-transform: translate(0px, 67px);
				-ms-transform: translate(0px, 67px);
				transform: translate(0px, 67px);
			}

			.tile.tile-position-1-3 {
				-webkit-transform: translate(0px, 135px);
				-moz-transform: translate(0px, 135px);
				-ms-transform: translate(0px, 135px);
				transform: translate(0px, 135px);
			}

			.tile.tile-position-1-4 {
				-webkit-transform: translate(0px, 202px);
				-moz-transform: translate(0px, 202px);
				-ms-transform: translate(0px, 202px);
				transform: translate(0px, 202px);
			}

			.tile.tile-position-2-1 {
				-webkit-transform: translate(67px, 0px);
				-moz-transform: translate(67px, 0px);
				-ms-transform: translate(67px, 0px);
				transform: translate(67px, 0px);
			}

			.tile.tile-position-2-2 {
				-webkit-transform: translate(67px, 67px);
				-moz-transform: translate(67px, 67px);
				-ms-transform: translate(67px, 67px);
				transform: translate(67px, 67px);
			}

			.tile.tile-position-2-3 {
				-webkit-transform: translate(67px, 135px);
				-moz-transform: translate(67px, 135px);
				-ms-transform: translate(67px, 135px);
				transform: translate(67px, 135px);
			}

			.tile.tile-position-2-4 {
				-webkit-transform: translate(67px, 202px);
				-moz-transform: translate(67px, 202px);
				-ms-transform: translate(67px, 202px);
				transform: translate(67px, 202px);
			}

			.tile.tile-position-3-1 {
				-webkit-transform: translate(135px, 0px);
				-moz-transform: translate(135px, 0px);
				-ms-transform: translate(135px, 0px);
				transform: translate(135px, 0px);
			}

			.tile.tile-position-3-2 {
				-webkit-transform: translate(135px, 67px);
				-moz-transform: translate(135px, 67px);
				-ms-transform: translate(135px, 67px);
				transform: translate(135px, 67px);
			}

			.tile.tile-position-3-3 {
				-webkit-transform: translate(135px, 135px);
				-moz-transform: translate(135px, 135px);
				-ms-transform: translate(135px, 135px);
				transform: translate(135px, 135px);
			}

			.tile.tile-position-3-4 {
				-webkit-transform: translate(135px, 202px);
				-moz-transform: translate(135px, 202px);
				-ms-transform: translate(135px, 202px);
				transform: translate(135px, 202px);
			}

			.tile.tile-position-4-1 {
				-webkit-transform: translate(202px, 0px);
				-moz-transform: translate(202px, 0px);
				-ms-transform: translate(202px, 0px);
				transform: translate(202px, 0px);
			}

			.tile.tile-position-4-2 {
				-webkit-transform: translate(202px, 67px);
				-moz-transform: translate(202px, 67px);
				-ms-transform: translate(202px, 67px);
				transform: translate(202px, 67px);
			}

			.tile.tile-position-4-3 {
				-webkit-transform: translate(202px, 135px);
				-moz-transform: translate(202px, 135px);
				-ms-transform: translate(202px, 135px);
				transform: translate(202px, 135px);
			}

			.tile.tile-position-4-4 {
				-webkit-transform: translate(202px, 202px);
				-moz-transform: translate(202px, 202px);
				-ms-transform: translate(202px, 202px);
				transform: translate(202px, 202px);
			}

			.tile .tile-inner {
				font-size: 35px;
			}

			.game-message p {
				font-size: 30px !important;
				height: 30px !important;
				line-height: 30px !important;
				margin-top: 90px !important;
			}

			.game-message .lower {
				margin-top: 30px !important;
			}
		}

		.tim-mode .tile-inner {
			position: relative;
			/* optionally hide the number visually but keep it in the DOM */
			color: transparent;
		}

		.tim-mode .tile-2 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_hotdog.avif') no-repeat center/contain;
		}

		.tim-mode .tile-4 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_fedora_safari.avif') no-repeat center/contain;
		}

		.tim-mode .tile-8 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_carl_havoc.avif') no-repeat center/contain;
		}

		.tim-mode .tile-16 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_slick_back.avif') no-repeat center/contain;
		}

		.tim-mode .tile-32 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_sure_about_that.avif') no-repeat center/contain;
		}

		.tim-mode .tile-64 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_q_zone.avif') no-repeat center/contain;
		}

		.tim-mode .tile-128 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_complicated.avif') no-repeat center/contain;
		}

		.tim-mode .tile-256 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_zipline.avif') no-repeat center/contain;
		}

		.tim-mode .tile-512 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_skip_lunch.avif') no-repeat center/contain;
		}

		.tim-mode .tile-1024 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_doggydoor.avif') no-repeat center/contain;
		}

		.tim-mode .tile-2048 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_embarass.avif') no-repeat center/contain;
		}

		.tim-mode .tile-4096 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_crooner.avif') no-repeat center/contain;
		}

		.tim-mode .tile-8192 .tile-inner::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			background: url('/2048/tim/tim_robinson_stanzos.avif') no-repeat center/contain;
		}
	</style>
	<!-- <link href="/2048/main.css" rel="stylesheet" type="text/css" /> -->
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
	<div class="flex items-center space-x-2">
		<Switch
			checked={tim}
			onCheckedChange={(e) => toggleTim(e)}
			id="tim-robinson-mode-toggle"
			class="data-[state=checked]:bg-secondary"
		/>
		<Label for="tim-robinson-mode-toggle">Tim Robinson Mode</Label>
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
					Number.NEGATIVE_INFINITY;
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

		<div bind:this={tileContainerDiv} class:tim-mode={tim} class="tile-container text-white"></div>
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
