<script lang="ts">
	import { onMount } from 'svelte';

	class GameManager {
		private target: HTMLDivElement;
		private _cellSize: number;
		private height: number;
		private width: number;
		private playing: boolean;

		constructor(target: HTMLDivElement, numberOfCols: number) {
			this.width = window.innerWidth;
			this._cellSize = this.calculateCellSize(numberOfCols, this.width);
			this.target = target;
			this.height = window.innerHeight; // - target.getBoundingClientRect().top;
			this.playing = false;
		}
		initCells() {
			this.target.innerHTML = '';
			const numRows = this.calcNumberOfRows();
			const numCols = this.calcNumberOfColumns();
			for (let x = 0; x < numRows; x++) {
				const newRow = this.createDiv(`row-${x}`, 'game-row');
				this.target.append(newRow);
				for (let y = 0; y < numCols; y++) {
					const newCol = this.createDiv(`cell-${x}-${y}`, 'cell-off');
					this.setOff(newCol);
					newCol.setAttribute(
						'style',
						`height:${this._cellSize - 1}px; width:${this._cellSize - 1}px`
					);
					newRow.appendChild(newCol);
				}
			}
		}
		initLife(density: number) {
			const numRows = this.calcNumberOfRows();
			const numCols = this.calcNumberOfColumns();
			for (let x = 0; x < numRows; x++) {
				for (let y = 0; y < numCols; y++) {
					const currCell = document.getElementById(`cell-${x}-${y}`);
					if (!currCell) {
						continue;
					}
					if (this.shouldBeLiving(density)) {
						this.setOff(currCell);
					} else {
						this.setOn(currCell);
					}
				}
			}
		}

		private setOff(cell: HTMLElement) {
			cell.setAttribute('class', 'cell-off');
			cell.style.backgroundColor = 'white';
		}
		private setOn(cell: HTMLElement) {
			cell.setAttribute('class', 'cell-on');
			cell.style.backgroundColor = 'black';
		}

		restart() {
			this.stop();
			const density = parseInt(densityInput.value) / 100;
			const cols = parseInt(columnsInput.value ?? '1');
			this._cellSize = this.calculateCellSize(cols, window.innerWidth);
			this.target.innerHTML = '';
			this.initCells();
			this.initLife(density);
		}
		play() {
			if (!this.playing) {
				this.playing = true;
				window.requestAnimationFrame(() => this.animate(this));
			}
		}
		animate(ref: GameManager) {
			if (ref.playing) {
				const nextStates = ref.calculateNextStates();
				ref.applyStates(nextStates);
				window.requestAnimationFrame(() => ref.animate(ref));
			}
		}
		applyStates(nextStates: string[][]) {
			for (let x = 0; x < nextStates.length; x++) {
				for (let y = 0; y < nextStates[x].length; y++) {
					const cell = document.getElementById(`cell-${x}-${y}`);
					const nextState = nextStates[x][y];
					if (cell) {
						cell.setAttribute('class', nextState);
						if (nextState === 'cell-off') {
							this.setOff(cell);
						} else {
							this.setOn(cell);
						}
					}
				}
			}
		}
		calculateNextStates() {
			const states: string[][] = [];
			const numRows = this.calcNumberOfRows();
			const numCols = this.calcNumberOfColumns();
			for (let x = 0; x < numRows; x++) {
				states[x] = [];
				for (let y = 0; y < numCols; y++) {
					const nextClass = this.calculateOnOrOff(x, y);
					states[x].push(nextClass);
				}
			}
			return states;
		}
		calculateOnOrOff(x: number, y: number) {
			const div = document.getElementById(`cell-${x}-${y}`);
			if (!div) {
				return 'cell-off';
			}
			const numberOfLivingNeighbors = this.countAliveNeighbors(x, y);
			if (div.classList.contains('cell-on')) {
				if (numberOfLivingNeighbors > 3) {
					return 'cell-off';
				}
				if (numberOfLivingNeighbors > 1) {
					return 'cell-on';
				}
				return 'cell-off';
			}
			if (numberOfLivingNeighbors === 3) {
				return 'cell-on';
			}
			return 'cell-off';
		}
		countAliveNeighbors(x: number, y: number) {
			let count = 0;
			for (let i = x - 1; i <= x + 1; i++) {
				for (let j = y - 1; j <= y + 1; j++) {
					if (!(i === x && j === y)) {
						const div = document.getElementById(`cell-${i}-${j}`);
						if (div && div.classList.contains('cell-on')) {
							count += 1;
						}
					}
				}
			}
			return count;
		}
		stop() {
			this.playing = false;
		}
		shouldBeLiving(density: number) {
			return Math.random() < density;
		}
		calcNumberOfRows() {
			return Math.ceil(this.height / this._cellSize);
		}
		createDiv(id: string, className: string | null = null) {
			const newDiv = document.createElement('div');
			newDiv.setAttribute('id', id);
			if (className) {
				newDiv.setAttribute('class', className);
				if (className === 'game-row') {
					newDiv.style.display = 'flex';
				}
			}
			return newDiv;
		}
		calculateCellSize(numberOfCols: number, windowWidth: number) {
			return Math.ceil(windowWidth / numberOfCols);
		}
		calcNumberOfColumns() {
			return Math.ceil(this.width / this._cellSize);
		}
	}

	let manager: GameManager | null = null;
	let gameContainer: HTMLDivElement | null = null;
	let columnsInput: HTMLInputElement;
	let densityInput: HTMLInputElement;

	onMount(() => {
		if (gameContainer) {
			manager = new GameManager(gameContainer, 75);
			manager.initCells();
			manager.initLife(0.5);
			console.log(manager);
			manager.play();
		}
	});
</script>

<div class="tool-bar">
	<span>
		<button id="play-button" onclick={() => manager?.play()} class="button button-play">Play</button
		>
		<button id="restart-button" onclick={() => manager?.restart()} class="button button-restart"
			>Restart</button
		>
		<input
			style="text-align: center; width: 50px; margin-left: 10px;"
			type="number"
			name="density"
			id="density"
			placeholder="Density"
			value="50"
			bind:this={densityInput}
		/>
		<label for="density">Density</label>
		<span class="input">
			<input
				style="text-align: center; width: 50px; margin-left: 10px;"
				type="number"
				name="columns"
				id="columns"
				placeholder="Columbs"
				value="75"
				bind:this={columnsInput}
			/>
			<label for="columns">Columns</label></span
		>
		<button
			id="stop-button"
			onclick={() => manager?.stop()}
			style="margin-left: 10px;"
			class="button button-stop">Stop</button
		>
	</span>
</div>
<div class="w-full pl-5">
	<div class="w-full" bind:this={gameContainer} id="game-container"></div>
</div>

<style>
	.tool-bar {
		display: flex;
		justify-content: center;
	}
	.button {
		cursor: pointer;
		padding: 5px;
		width: 70px;
		border: none;
		color: white;
		border-radius: 3px;
		font-size: 16px;
		transition: background-color 0.5s;
	}
	.button-play {
		background-color: #009688;
	}
	.button-play:hover {
		background-color: #00695c;
	}
	.button-stop {
		background-color: #d32f2f;
	}
	.button-stop:hover {
		background-color: #b71c1c;
	}
	.button-restart {
		background-color: #03a9f4;
	}
	.button-restart:hover {
		background-color: #01579b;
	}
	.input {
		display: inline-block;
		white-space: nowrap;
	}
	/**
    * Add a transition to the label and input.
    * I'm not even sure that touch-action: manipulation works on
    * inputs, but hey, it's new and cool and could remove the 
    * pesky delay.
    */
	label,
	input {
		transition: all 0.2s;
		touch-action: manipulation;
	}

	input {
		font-size: 1.5em;
		border: 0;
		border-bottom: 1px solid #ccc;
		font-family: inherit;
		-webkit-appearance: none;
		border-radius: 0;
		padding: 0;
		cursor: text;
	}

	input:focus {
		outline: 0;
		border-bottom: 1px solid #666;
	}

	label {
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	/**
    * Translate down and scale the label up to cover the placeholder,
    * when following an input (with placeholder-shown support).
    * Also make sure the label is only on one row, at max 2/3rds of the
    * field—to make sure it scales properly and doesn't wrap.
    */
	input:placeholder-shown + label {
		cursor: text;
		max-width: 66.66%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transform-origin: left bottom;
		transform: translate(0, 2.125rem) scale(1.5);
	}
	/**
    * By default, the placeholder should be transparent. Also, it should 
    * inherit the transition.
    */
	::-webkit-input-placeholder {
		opacity: 0;
		transition: inherit;
	}
	/**
    * Show the placeholder when the input is focused.
    */
	input:focus::-webkit-input-placeholder {
		opacity: 1;
	}
	/**
    * When the element is focused, remove the label transform.
    * Also, do this when the placeholder is _not_ shown, i.e. when 
    * there's something in the input at all.
    */
	input:not(:placeholder-shown) + label,
	input:focus + label {
		transform: translate(0, 0) scale(1);
		cursor: pointer;
	}
</style>
