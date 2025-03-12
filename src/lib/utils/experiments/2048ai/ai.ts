import type GameManager from './game';
import type { GridCells } from './grid';
// import type Grid from './grid';
import Tile from './tile';
import type { MoveDirection } from './types';
import CircularDeque from './utils/CircularDeque';

export type Heuristic = {
	weight: number;
	label: string;
	func: (grid: GridCells) => number;
};

const MAX_ROW = 3;
const MAX_COL = 3;

function getCellValue(grid: GridCells, row: number, col: number) {
	const cell = getCell(grid, row, col);
	if (!cell) {
		return 0;
	}
	return cell.getValue();
}

function* getNeighborCoords(row: number, col: number): Generator<[number, number]> {
	yield [row + 1, col];
	yield [row, col + 1];
}

export const gradientSmoothness: Heuristic = {
	weight: 1,
	label: 'grid smoothness',
	func: (grid) => {
		let score = 100; // default at 100
		const maxSize = grid.length - 2;
		for (const [row, col] of cells(0, maxSize, 0, maxSize)) {
			const value = getCellValue(grid, row, col);
			// the more similar the value is to it's neighbors the better.
			for (const neighbor of getNeighborCoords(row, col)) {
				const neighborValue = getCellValue(grid, neighbor[0], neighbor[1]);
				const smoothNess = Math.abs(value - neighborValue);
				score -= smoothNess / 10;
			}
		}

		return score;
	}
};

export const numberOfEmptySquares: Heuristic = {
	weight: 1,
	label: 'number of empty squares',
	func: (grid) => {
		let score = 0;
		const maxSize = grid.length - 1;
		for (const [row, col] of cells(0, maxSize, 0, maxSize)) {
			const value = getCellValue(grid, row, col);
			if (value === 0) {
				score += 10;
			}
		}
		return score;
	}
};

export function maxTile(grid: GridCells) {
	let maxTile = 0;
	for (const [row, col] of cells(0, grid.length - 1, 0, grid.length - 1)) {
		const value = getCellValue(grid, row, col);
		if (value > maxTile) {
			maxTile = value;
		}
	}
	return maxTile;
}

export const scoreTiles: Heuristic = {
	weight: 2,
	label: 'score of tiles',
	func: (grid) => {
		let score = 0;
		const maxSize = grid.length - 1;
		let maxTile = 0;
		for (const [row, col] of cells(0, maxSize, 0, maxSize)) {
			const value = getCellValue(grid, row, col);
			if (value > 0) {
				score += Math.log2(value);
			}
			if (value > maxTile) {
				maxTile = value;
			}
		}
		// give a bonus for the max tile
		return score + maxTile / 2;
	}
};

export class AlphaBetaAI {
	private gameManager: GameManager;
	private depthLimit = 10; // 4; //10;
	private deque: CircularDeque<GameNode>;
	public heuristics: Heuristic[];

	constructor(gameManager: GameManager, heuristics: Heuristic[]) {
		this.gameManager = gameManager;
		const dequeCapacity = calculateQueueCapacity(this.depthLimit, 4);
		this.deque = new CircularDeque<GameNode>(dequeCapacity);
		this.heuristics = heuristics;
	}

	setDepthLimit(depth: number) {
		this.depthLimit = depth;
	}

	calculateBestMove(): MoveDirection {
		// clear the deque
		this.deque.clear();
		// create initial gameNode to expand..
		const currentState = this.gameManager.getCurrentGridCopy();
		//
		const initialState = new GameNode(0, currentState, undefined);

		// init initial BFS data structures
		const seenStates = new Set<string>();
		seenStates.add(initialState.toString());
		this.deque.addBack(initialState);

		while (!this.deque.isEmpty()) {
			const node = this.deque.removeFront();

			// add children (either it's a player move or is a computer move)
			if (node.getDepth() % 2 === 0) {
				node.expandHumanMoves(this.gameManager, this.getScoreCalculator());
			} else {
				node.expandComputerMove(this.getScoreCalculator());
			}

			// if this node has no children, then there are no possible moves
			// so mark it as very bad score
			if (node.children.length === 0) {
				node.score = -10_000;
			}

			for (const child of node.children) {
				this.scoreNode(child);
				if (child.getDepth() < this.depthLimit) {
					const hash = child.toString();
					if (!seenStates.has(hash)) {
						this.deque.addBack(child);
						seenStates.add(hash);
					}
				}
			}
		}

		let alpha = Number.NEGATIVE_INFINITY;
		let bestMove: MoveDirection | undefined = undefined;

		for (const child of initialState.children) {
			const score = minimize(child, alpha, Number.POSITIVE_INFINITY);
			if (score > alpha) {
				alpha = score;
				bestMove = child.move;
			}
		}
		return bestMove || 0;
	}

	scoreNode(node: GameNode) {
		for (const heuristic of this.heuristics) {
			node.score += heuristic.func(node.copyGrid());
		}
	}

	getScoreCalculator() {
		const heuristics = this.heuristics;
		return (node: GameNode) => {
			let total = 0;
			for (const heuristic of heuristics) {
				const score = heuristic.func(node.copyGrid()) * heuristic.weight;
				node.score += score;
				total += score;
			}
			return total;
		};
	}

	setHeuristics(heuristics: Heuristic[]) {
		this.heuristics = heuristics;
	}
}

function maximize(node: GameNode, alpha: number, beta: number): number {
	if (node.children.length === 0) {
		return node.score;
	}

	let maxScore = Number.NEGATIVE_INFINITY;

	for (const child of node.children) {
		maxScore = Math.max(maxScore, minimize(child, alpha, beta));

		if (maxScore >= beta) {
			return maxScore;
		}
		if (maxScore >= alpha) {
			alpha = maxScore;
		}
	}

	return maxScore;
}

function minimize(node: GameNode, alpha: number, beta: number): number {
	if (node.children.length === 0) {
		return node.score;
	}

	let minScore = Number.POSITIVE_INFINITY;

	for (const child of node.children) {
		minScore = Math.min(minScore, maximize(child, alpha, beta));
		if (minScore <= alpha) {
			return minScore;
		}
		if (minScore <= beta) {
			beta = minScore;
		}
	}
	return minScore;
}

const DIRS: MoveDirection[] = [0, 1, 2, 3];

class GameNode {
	private depth: number;
	private grid: GridCells;
	public score: number;
	// the move that got to this board from the parent.
	public move: MoveDirection | undefined;
	public didMove: boolean;
	public children: GameNode[];

	constructor(depth: number, grid: GridCells, move?: MoveDirection) {
		this.depth = depth;
		this.grid = grid;
		this.score = 0;
		this.move = move;
		this.didMove = false;
		this.children = [];
	}

	getDepth() {
		return this.depth;
	}

	// the computer move is adding the worst scoring tile
	expandComputerMove(scoreCalculator: (node: GameNode) => number) {
		let lowestScore = Number.POSITIVE_INFINITY;
		let lowestChild: GameNode | null = null;
		const initialScore = this.score;
		for (const tileValue of [2, 4]) {
			for (const [row, col] of cells(0, 3, 0, 3)) {
				if (getCell(this.grid, row, col) === null) {
					this.score = 0;
					setCell(this.grid, row, col, new Tile({ y: row, x: col }, tileValue));
					const score = scoreCalculator(this);
					if (score < lowestScore) {
						lowestScore = score;
						lowestChild = new GameNode(this.depth + 1, this.copyGrid(), this.move);
					}
					setCell(this.grid, row, col, null);
				}
			}
		}
		if (lowestChild !== null) {
			this.children = [lowestChild];
		} else {
			this.score = initialScore;
			this.children = [];
		}
	}

	// the human moves are trying every possible move (up, down, left, right) that changes the board
	expandHumanMoves(gameManager: GameManager, scoreCalculator: (node: GameNode) => number) {
		for (const moveChoice of DIRS) {
			if (canMoveInDirection(this.grid, moveChoice)) {
				const stateCopy = this.copyGrid();
				// use game manager to move in that direction.
				gameManager.moveGridCells(stateCopy, moveChoice);
				const child = new GameNode(this.depth + 1, stateCopy, moveChoice);
				scoreCalculator(child);
				this.children.push(child);
			}
		}
	}

	copyGrid(): GridCells {
		return this.grid.map((row) =>
			row.map((cell) => (cell ? new Tile(cell.getPosition(), cell.getValue()) : null))
		);
	}

	getGrid() {
		return this.grid;
	}

	toString() {
		return this.grid
			.map((row) => row.map((cell) => (cell ? cell.toString() : 'null')).join('|'))
			.join('||');
	}
}

/**
 * A player can move in that direction if any cell has an empty cell or a tile
 * of the same value in that direction
 * // 0: up, 1: right, 2: down, 3: left
 */
function canMoveInDirection(grid: GridCells, move: MoveDirection): boolean {
	const lowestRow = move === 0 ? 1 : 0; // if move is up, then iterate starting at 1
	const highestRow = move === 2 ? MAX_ROW - 1 : MAX_ROW; // if move is down then don't check last row;
	const lowestCol = move === 3 ? 1 : 0; // if move is left, then iterate starting at 1 (don't check col 0 as there's nothing to the left)
	const highestCol = move === 1 ? MAX_COL - 1 : MAX_COL; // if move is right, don't check last col
	for (const [row, col] of cells(lowestRow, highestRow, lowestCol, highestCol)) {
		const tile = getCell(grid, row, col);
		if (tile === null) {
			continue;
		}
		// if cell is tile check the adjecent cell;
		const adjecentCell = getAdjecentCell(grid, row, col, move);
		if (adjecentCell === null || adjecentCell.getValue() === tile.getValue()) {
			return true;
		}
	}
	return false;
}

/**
 * Generator function that yields [row, col] pairs.
 * @param maxRow - Number of rows.
 * @param maxCol - Number of columns.
 */
export function* cells(
	minRow: number,
	maxRow: number,
	minCol: number,
	maxCol: number
): Generator<[number, number]> {
	for (let row = minRow; row <= maxRow; row++) {
		for (let col = minCol; col <= maxCol; col++) {
			yield [row, col];
		}
	}
}

// 0: up, 1: right, 2: down, 3: left
function getAdjecentCell(grid: GridCells, row: number, col: number, move: MoveDirection) {
	if (move === 0) {
		return getCell(grid, row - 1, col);
	}
	if (move === 2) {
		return getCell(grid, row + 1, col);
	}
	if (move === 3) {
		return getCell(grid, row, col - 1);
	}
	return getCell(grid, row, col + 1);
}

/**
 *
 * @param depth
 * @param maxChildrenPerNode
 * @returns
 */
export function calculateQueueCapacity(depth: number, maxChildrenPerNode: number) {
	return (maxChildrenPerNode ** (depth + 1) - 1) / (maxChildrenPerNode - 1);
}

/**
 * original 2048 stores the matrix columnar wise.
 * meaning that the first array (grid[0]) contains the values of the
 * first column. Use this getter to be consisten about which cell is being accessed.
 * @param grid
 * @param row
 * @param col
 */
function getCell(grid: GridCells, row: number, col: number) {
	return grid[col][row];
}

function setCell(grid: GridCells, row: number, col: number, tile: null | Tile) {
	grid[col][row] = tile;
}
