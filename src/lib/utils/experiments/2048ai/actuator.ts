import type Grid from './grid';
import type Tile from './tile';
import type { HTMLActuatorMetaData, PositionXY } from './types';

export default class HTMLActuator {
	private score: number;
	private tileContainer: HTMLDivElement;
	private scoreContainer: HTMLDivElement;
	private bestContainer: HTMLDivElement;
	private gameMessage: HTMLDivElement;

	constructor(
		tileContainer: HTMLDivElement,
		scoreContainer: HTMLDivElement,
		bestContainer: HTMLDivElement,
		gameMessage: HTMLDivElement
	) {
		this.score = 0;
		this.tileContainer = tileContainer;
		this.scoreContainer = scoreContainer;
		this.bestContainer = bestContainer;
		this.gameMessage = gameMessage;
	}

	actuate(grid: Grid, metadata: HTMLActuatorMetaData) {
		this.clearContainer(this.tileContainer);

		grid.getCells().forEach((column) => {
			column.forEach((cell) => {
				if (cell) {
					this.addTile(cell);
				}
			});
		});

		this.updateScore(metadata.score);
		this.updateBestScore(metadata.bestScore);

		if (metadata.terminated) {
			if (metadata.over) {
				this.message(false); // You lose
			} else if (metadata.won) {
				console.log('winning game', metadata);
				this.message(true); // You win!
			}
		}
	}

	// Continues the game (both restart and keep playing)
	continueGame() {
		this.clearMessage();
	}

	clearContainer(container: HTMLDivElement) {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}

	addTile(tile: Tile) {
		const wrapper = document.createElement('div');
		const inner = document.createElement('div');
		const position = tile.previousPosition || tile.getPosition();
		const positionClass = this.positionClass(position);

		// We can't use classlist because it somehow glitches when replacing classes
		const classes = ['tile', 'tile-' + tile.getValue(), positionClass];

		if (tile.getValue() > 2048) classes.push('tile-super');

		this.applyClasses(wrapper, classes);

		inner.classList.add('tile-inner');
		inner.textContent = `${tile.getValue()}`;

		if (tile.previousPosition) {
			// Make sure that the tile gets rendered in the previous position first
			window.requestAnimationFrame(() => {
				classes[2] = this.positionClass(tile.getPosition());
				this.applyClasses(wrapper, classes); // Update the position
			});
		} else if (tile.mergedFrom) {
			classes.push('tile-merged');
			this.applyClasses(wrapper, classes);

			// Render the tiles that merged
			tile.mergedFrom.forEach((merged) => {
				this.addTile(merged);
			});
		} else {
			classes.push('tile-new');
			this.applyClasses(wrapper, classes);
		}

		// Add the inner part of the tile to the wrapper
		wrapper.appendChild(inner);

		// Put the tile on the board
		this.tileContainer.appendChild(wrapper);
	}

	positionClass(position: PositionXY) {
		position = this.normalizePosition(position);
		return 'tile-position-' + position.x + '-' + position.y;
	}

	normalizePosition(position: PositionXY) {
		return { x: position.x + 1, y: position.y + 1 };
	}

	applyClasses(element: HTMLDivElement, classes: string[]) {
		element.setAttribute('class', classes.join(' '));
	}
	updateScore(score: number) {
		this.clearContainer(this.scoreContainer);

		const difference = score - this.score;
		this.score = score;

		this.scoreContainer.textContent = `${this.score}`;

		if (difference > 0) {
			const addition = document.createElement('div');
			addition.classList.add('score-addition');
			addition.textContent = '+' + difference;

			this.scoreContainer.appendChild(addition);
		}
	}

	clearMessage() {
		// IE only takes one value to remove at a time.
		this.gameMessage.classList.remove('game-won');
		this.gameMessage.classList.remove('game-over');
	}
	updateBestScore(bestScore: number) {
		this.bestContainer.textContent = `${bestScore}`;
	}

	message(won: boolean) {
		const type = won ? 'game-won' : 'game-over';
		const message = won ? 'You win!' : 'Game over!';
		this.gameMessage.classList.add(type);
		this.gameMessage.getElementsByTagName('p')[0].textContent = message;
	}
}
