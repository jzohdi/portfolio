export default class GameManager {
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
			const newRow = this.createDiv(`row-${x}`, 'conways-game-row');
			this.target.append(newRow);
			for (let y = 0; y < numCols; y++) {
				const newCol = this.createDiv(`cell-${x}-${y}`, 'cell-off');
				this.setOff(newCol);
				newCol.setAttribute('style', `height:${this._cellSize}px; width:${this._cellSize}px`);
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

	restart(densityInput: string, columnsInput: string) {
		this.stop();
		const density = parseInt(densityInput) / 100;
		const cols = parseInt(columnsInput ?? '1');
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
