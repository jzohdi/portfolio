<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	import {
		getInitialBoard,
		loadSudoku,
		resetNewRandom,
		saveBoard,
		type SudokuWasmModule
	} from '$lib/utils/experiments/wasm/sudoku';
	import { onMount } from 'svelte';
	import { number } from 'zod';
	// functional test to verify that it can be called over and over with the correct results
	// for (let i = 0; i < 10; i++) {
	// 	const test1Result = wasm.solve("000000000302540000050301070000000004409006005023054790000000050700810000080060009");
	// 	if (test1Result !== "148697523372548961956321478567983214419276385823154796691432857735819642284765139") {
	// 		throw new Error("Test 1 result regression")
	// 	}

	// 	const test2Result = wasm.solve("000260701680070090190004500820100040004602900050003028009300074040050036703018000");
	// 	console.log("Test2", test2Result)
	// 	if (test2Result !== "435269781682571493197834562826195347374682915951743628519326874248957136763418259") {
	// 		throw new Error("Test 2 result regression")
	// 	}
	// }
	const EMPTY_BOARD = Array(9)
		.fill(null)
		.map(() => Array(9).fill('0'));
	let board = $state(EMPTY_BOARD);
	let invalidCells = $state(new Set<string>());
	let solutionString = $state(
		'000000000000000000000000000000000000000000000000000000000000000000000000000000000'
	);
	let wasmModule: SudokuWasmModule | null = $state(null);
	let hintEle = $state({ row: -1, col: -1 });

	onMount(async () => {
		if (wasmModule === null) {
			wasmModule = await loadSudoku('/sudoku/sudoku_wasi.wasm');
			const { current, solution } = await getInitialBoard(wasmModule);
			board = current;
			solutionString = solution;
		}
	});

	// Function to check if a cell's value is valid
	function isValidPlacement(row: number, col: number, num: string): boolean {
		if (num === '') return true;
		// console.log('is valid placement: ', solutionString[row * 9 + col] === num, { num, row, col });
		return solutionString[row * 9 + col] === num;
	}

	// Handle input changes
	function handleInput(row: number, col: number, event: Event) {
		const input = event.target as HTMLInputElement;
		let value = input.value;

		// Only allow empty or numbers 1-9
		if (value !== '' && !/^[1-9]$/.test(value)) {
			value = board[row][col];
			input.value = value;
			return;
		}

		// Update the board
		board[row][col] = value;
		saveBoard(board);

		// Check for all other cells that might be affected
		validateBoard();
	}

	// Validate the entire board
	function validateBoard() {
		const newInvalid = new Set<string>();
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				const cellKey = `${row},${col}`;
				const value = board[row][col];
				if (value === '' || value === '0') {
					continue;
				}
				if (!isValidPlacement(row, col, value)) {
					newInvalid.add(cellKey);
				}
			}
		}
		invalidCells = newInvalid;
	}

	// Solve the Sudoku puzzle
	function solveSudoku() {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				board[row][col] = solutionString[row * 9 + col];
			}
		}
		saveBoard(board);
	}

	// Provide a hint
	function getHint() {
		const emptyCells = [];
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				const currentValue = board[row][col];
				if (!/^[1-9]$/.test(currentValue)) {
					emptyCells.push({ row, col });
				}
			}
		}
		if (emptyCells.length === 0) {
			return;
		}

		const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
		const value = solutionString[row * 9 + col];
		board[row][col] = value;
		saveBoard(board);
		hintEle = { row, col };
	}

	// Reset the board
	function resetBoard() {
		if (wasmModule === null) {
			// TODO: show some alert if wasm module isn't loaded yet.
			return;
		}
		resetNewRandom(wasmModule).then(({ current, solution }) => {
			board = current;
			solutionString = solution;
			invalidCells.clear();
			hintEle = { row: -1, col: -1 };
		});
	}

	function getDisplayValue(rowIndex: number, colIndex: number) {
		if (board[rowIndex][colIndex] !== '0') {
			return board[rowIndex][colIndex];
		}
		return '';
	}
</script>

<div class="container mx-auto flex flex-col items-center gap-8 py-8">
	<h1 class="text-3xl font-bold">Sudoku Puzzle</h1>

	<div class="grid grid-cols-9 gap-0 border-4 border-black bg-black">
		{#each Array(9) as _, rowIndex}
			{#each Array(9) as _, colIndex}
				{@const cellKey = `${rowIndex},${colIndex}`}
				{@const isInvalid = invalidCells.has(cellKey)}
				{@const boxRow = Math.floor(rowIndex / 3)}
				{@const boxCol = Math.floor(colIndex / 3)}
				{@const isEvenBox = (boxRow + boxCol) % 2 === 0}

				<div
					class={`relative h-10 w-10 border border-gray-300 sm:h-12 sm:w-12
					  ${rowIndex % 3 === 2 && rowIndex < 8 ? 'border-b-2 border-b-black' : ''}
					  ${colIndex % 3 === 2 && colIndex < 8 ? 'border-r-2 border-r-black' : ''}
					  ${isEvenBox ? 'bg-gray-100' : 'bg-white'}`}
				>
					<Input
						type="text"
						inputmode="numeric"
						class={`absolute inset-0 h-full w-full px-0 py-0 text-center text-xl font-medium sm:px-3 sm:py-2
					${isInvalid ? 'bg-red-100 text-red-600' : ''}
					${hintEle.row === rowIndex && hintEle.col === colIndex ? 'bg-blue-100 text-blue-600' : ''}`}
						value={getDisplayValue(rowIndex, colIndex)}
						on:input={(e) => handleInput(rowIndex, colIndex, e)}
						maxlength={1}
					/>
				</div>
			{/each}
		{/each}
	</div>

	<div class="flex gap-4">
		<Button disabled={wasmModule === null} on:click={solveSudoku} variant="outline">
			{#if wasmModule === null}
				<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			Solve</Button
		>
		<Button
			disabled={wasmModule === null || solutionString === board.flat().join('')}
			on:click={getHint}
			variant="outline"
		>
			{#if wasmModule === null}
				<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			Hint</Button
		>
		<Button disabled={wasmModule === null} on:click={resetBoard} variant="destructive">
			{#if wasmModule === null}
				<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			Reset</Button
		>
	</div>

	<div class="text-sm text-gray-600">
		<p>Enter numbers 1-9 in the cells. Invalid entries will be highlighted in red.</p>
		<p>
			Use "Hint" to get a random cell filled, "Solve" to complete the puzzle, or "Reset" to clear
			the board.
		</p>
	</div>
</div>
