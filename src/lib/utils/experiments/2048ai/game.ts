import type HTMLActuator from './actuator';
import Grid from './grid';
import type { KeyboardInputManager } from './inputManager';
import type LocalStorageManager from './storage';
import Tile from './tile';
import type { MoveDirection, PositionXY, SerializedGameManager } from './types';

// Vectors representing tile movement
const VECTOR_MAP = {
	0: { x: 0, y: -1 }, // Up
	1: { x: 1, y: 0 }, // Right
	2: { x: 0, y: 1 }, // Down
	3: { x: -1, y: 0 } // Left
} as const;
type Vector = (typeof VECTOR_MAP)[keyof typeof VECTOR_MAP];
type Traversals = {
	x: number[];
	y: number[];
};

export default class GameManager {
	private size: number;
	private inputManager: KeyboardInputManager;
	private storageManager: LocalStorageManager;
	private actuator: HTMLActuator;
	private startTiles = 2;
	private shouldKeepPlaying: boolean;
	private isGameOver: boolean;
	private didWinGame: boolean;
	private grid: Grid;
	private score: number;

	constructor(
		size: number,
		inputManager: KeyboardInputManager,
		actuator: HTMLActuator,
		storageManager: LocalStorageManager
	) {
		this.size = size; // Size of the grid
		this.inputManager = inputManager;
		this.storageManager = storageManager;
		this.actuator = actuator;
		this.isGameOver = false;
		this.startTiles = 2;
		this.score = 0;
		this.didWinGame = false;
		this.grid = new Grid(this.size);
		this.shouldKeepPlaying = false;

		this.inputManager.on('move', this.move.bind(this));
		this.inputManager.on('restart', this.restart.bind(this));
		this.inputManager.on('keepPlaying', this.keepPlaying.bind(this));

		this.setup(this.storageManager.getGameState());
	}
	restart() {
		this.storageManager.clearGameState();
		this.actuator.continueGame(); // Clear the game won/lost message
		this.setup(this.storageManager.getGameState());
	}

	// Keep playing after winning (allows going over 2048)
	keepPlaying() {
		this.shouldKeepPlaying = true;
		this.actuator.continueGame(); // Clear the game won/lost message
	}

	// Return true if the game is lost, or has won and the user hasn't kept playing
	isGameTerminated() {
		return this.isGameOver || (this.didWinGame && !this.shouldKeepPlaying);
	}

	// Set up the game
	setup(previousState: SerializedGameManager | null) {
		// Reload the game from a previous game if present
		if (previousState) {
			this.grid = new Grid(previousState.grid.size, previousState.grid.cells); // Reload grid
			this.score = previousState.score;
			this.isGameOver = previousState.over;
			this.didWinGame = previousState.won;
			this.shouldKeepPlaying = previousState.keepPlaying;
		} else {
			this.grid = new Grid(this.size);
			this.score = 0;
			this.isGameOver = false;
			this.didWinGame = false;
			this.shouldKeepPlaying = false;
			// Add the initial tiles
			this.addStartTiles();
		}

		// Update the actuator
		this.actuate();
	}

	// Set up the initial tiles to start the game with
	addStartTiles() {
		for (let i = 0; i < this.startTiles; i++) {
			this.addRandomTile();
		}
	}
	// Adds a tile in a random position
	addRandomTile() {
		const randomCell = this.grid.randomAvailableCell();
		if (this.grid.cellsAvailable() && randomCell) {
			const value = Math.random() < 0.9 ? 2 : 4;
			const tile = new Tile(randomCell, value);

			this.grid.insertTile(tile);
		}
	}

	// Sends the updated grid to the actuator
	actuate() {
		if (this.storageManager.getBestScore() < this.score) {
			this.storageManager.setBestScore(this.score);
		}

		// Clear the state when the game is over (game over only, not win)
		if (this.isGameOver) {
			this.storageManager.clearGameState();
		} else {
			this.storageManager.setGameState(this.serialize());
		}

		this.actuator.actuate(this.grid, {
			score: this.score,
			over: this.isGameOver,
			won: this.didWinGame,
			bestScore: this.storageManager.getBestScore(),
			terminated: this.isGameTerminated()
		});
	}

	serialize() {
		return {
			grid: this.grid.serialize(),
			score: this.score,
			over: this.isGameOver,
			won: this.didWinGame,
			keepPlaying: this.shouldKeepPlaying
		};
	}

	prepareTiles() {
		this.grid.eachCell(function (x, y, tile) {
			if (tile) {
				tile.mergedFrom = null;
				tile.savePosition();
			}
		});
	}
	moveTile(tile: Tile, cell: PositionXY) {
		const { x, y } = tile.getPosition();
		this.grid.getCells()[x][y] = null;
		this.grid.getCells()[cell.x][cell.y] = tile;
		tile.updatePosition(cell);
	}

	move(direction?: MoveDirection) {
		if (direction === undefined) return;
		// 0: up, 1: right, 2: down, 3: left
		if (this.isGameTerminated()) return; // Don't do anything if the game's over

		const vector = this.getVector(direction);
		const traversals = this.buildTraversals(vector);
		let didMove = false;

		// Save the current tile positions and remove merger information
		this.prepareTiles();

		// Traverse the grid in the right direction and move tiles
		traversals.x.forEach((x) => {
			traversals.y.forEach((y) => {
				const cell = { x: x, y: y };
				const tile = this.grid.cellContent(cell);

				if (tile) {
					const positions = this.findFarthestPosition(cell, vector);
					const next = this.grid.cellContent(positions.next);

					// Only one merger per row traversal?
					if (next && next.getValue() === tile.getValue() && !next.mergedFrom) {
						const merged = new Tile(positions.next, tile.getValue() * 2);
						merged.mergedFrom = [tile, next];

						this.grid.insertTile(merged);
						this.grid.removeTile(tile);

						// Converge the two tiles' positions
						tile.updatePosition(positions.next);

						// Update the score
						this.score += merged.getValue();

						// The mighty 2048 tile
						if (merged.getValue() === 2048) this.didWinGame = true;
					} else {
						this.moveTile(tile, positions.farthest);
					}

					if (!this.positionsEqual(cell, tile)) {
						didMove = true; // The tile moved from its original cell!
					}
				}
			});
		});

		if (didMove) {
			this.addRandomTile();

			if (!this.movesAvailable()) {
				this.isGameOver = true; // Game over!
			}

			this.actuate();
		}
	}

	getVector(direction: MoveDirection): Vector {
		return VECTOR_MAP[direction];
	}

	buildTraversals(vector: Vector): Traversals {
		const traversals: Traversals = { x: [], y: [] };

		for (let pos = 0; pos < this.size; pos++) {
			traversals.x.push(pos);
			traversals.y.push(pos);
		}

		// Always traverse from the farthest cell in the chosen direction
		if (vector.x === 1) traversals.x = traversals.x.reverse();
		if (vector.y === 1) traversals.y = traversals.y.reverse();

		return traversals;
	}

	findFarthestPosition(cell: PositionXY, vector: Vector) {
		let previous;

		// Progress towards the vector direction until an obstacle is found
		do {
			previous = cell;
			cell = { x: previous.x + vector.x, y: previous.y + vector.y };
		} while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

		return {
			farthest: previous,
			next: cell // Used to check if a merge is required
		};
	}

	movesAvailable() {
		return this.grid.cellsAvailable() || this.tileMatchesAvailable();
	}

	tileMatchesAvailable() {
		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.size; y++) {
				const tile = this.grid.cellContent({ x: x, y: y });

				if (!tile) continue;

				for (let direction = 0; direction < 4; direction++) {
					const vector = this.getVector(direction as MoveDirection);
					const cell = { x: x + vector.x, y: y + vector.y };

					const other = this.grid.cellContent(cell);

					if (other && other.getValue() === tile.getValue()) {
						return true; // These two tiles can be merged
					}
				}
			}
		}

		return false;
	}

	positionsEqual(first: PositionXY, tile: Tile) {
		const second = tile.getPosition();
		return first.x === second.x && first.y === second.y;
	}
}
