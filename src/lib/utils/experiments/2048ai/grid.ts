import Tile from './tile';
import type { PositionXY, SerializedTile, SerializedGrid } from './types';

export type GridCellRow = (null | Tile)[];
export type GridCells = GridCellRow[];

export default class Grid {
	private size: number;
	private cells: GridCells;

	constructor(size: number, previousState?: SerializedGrid['cells'] | null) {
		this.size = size;
		this.cells = previousState ? this.fromState(previousState) : this.empty();
	}

	/**
	 * needs to be the same cells, not copy so it can animate
	 * @returns
	 */
	getCells() {
		return this.cells;
	}

	empty() {
		const cells: GridCells = [];

		for (let x = 0; x < this.size; x++) {
			const row: GridCellRow = (cells[x] = []);

			for (let y = 0; y < this.size; y++) {
				row.push(null);
			}
		}

		return cells;
	}

	fromState(state: SerializedGrid['cells']): GridCells {
		const cells = [];

		for (let x = 0; x < this.size; x++) {
			const row: GridCellRow = (cells[x] = []);

			for (let y = 0; y < this.size; y++) {
				const tile = state[x][y];
				row.push(tile ? new Tile(tile.position, tile.value) : null);
			}
		}
		return cells;
	}

	// Find the first available random position
	randomAvailableCell() {
		const cells = this.availableCells();

		if (cells.length) {
			return cells[Math.floor(Math.random() * cells.length)];
		}
	}

	availableCells() {
		const cells: PositionXY[] = [];

		this.eachCell(function (x, y, tile) {
			if (!tile) {
				cells.push({ x: x, y: y });
			}
		});

		return cells;
	}
	// Call callback for every cell
	eachCell(callback: (x: number, y: number, tile: Tile | null) => void) {
		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.size; y++) {
				callback(x, y, this.cells[x][y]);
			}
		}
	}
	// Check if there are any cells available
	cellsAvailable() {
		return !!this.availableCells().length;
	}

	// Check if the specified cell is taken
	cellAvailable(cell: PositionXY) {
		return !this.cellOccupied(cell);
	}

	static cellAvailable(cell: PositionXY, gridCells: GridCells) {
		return !Grid.cellOccupied(cell, gridCells);
	}

	cellOccupied(cell: PositionXY) {
		return !!this.cellContent(cell);
	}

	static cellOccupied(cell: PositionXY, gridCells: GridCells) {
		return !!Grid.cellContent(cell, gridCells);
	}

	cellContent(cell: PositionXY) {
		return Grid.cellContent(cell, this.cells);
	}

	static cellContent(cell: PositionXY, gridCells: GridCells) {
		if (Grid.withinBounds(cell, gridCells.length)) {
			return gridCells[cell.x][cell.y];
		} else {
			return null;
		}
	}

	// Inserts a tile at its position
	insertTile(tile: Tile) {
		Grid.insertTile(tile, this.cells);
	}

	static insertTile(tile: Tile, gridCells: GridCells) {
		const position = tile.getPosition();
		gridCells[position.x][position.y] = tile;
	}

	removeTile(tile: Tile) {
		Grid.removeTile(tile, this.cells);
	}

	static removeTile(tile: Tile, gridCells: GridCells) {
		const position = tile.getPosition();
		gridCells[position.x][position.y] = null;
	}

	withinBounds(position: PositionXY) {
		return Grid.withinBounds(position, this.size);
	}

	static withinBounds(position: PositionXY, size: number) {
		return position.x >= 0 && position.x < size && position.y >= 0 && position.y < size;
	}

	serialize(): SerializedGrid {
		const cellState: (SerializedTile | null)[][] = [];

		for (let x = 0; x < this.size; x++) {
			const row: (SerializedTile | null)[] = (cellState[x] = []);

			for (let y = 0; y < this.size; y++) {
				row.push(this.cells[x][y]?.serialize() ?? null);
			}
		}

		return {
			size: this.size,
			cells: cellState
		};
	}
}
