import type { PositionXY, SerializedTile } from './types';

export default class Tile {
	private x: number;
	private y: number;
	private value: number;
	public previousPosition: null | PositionXY;
	public mergedFrom: null | [Tile, Tile];

	constructor(position: PositionXY, value: number) {
		this.x = position.x;
		this.y = position.y;
		this.value = value || 2;

		this.previousPosition = null;
		this.mergedFrom = null; // Tracks tiles that merged together
	}

	getValue(): number {
		return this.value;
	}

	getPosition(): PositionXY {
		return {
			x: this.x,
			y: this.y
		};
	}

	savePosition() {
		this.previousPosition = { x: this.x, y: this.y };
	}
	updatePosition(position: PositionXY) {
		this.x = position.x;
		this.y = position.y;
	}

	serialize(): SerializedTile {
		return {
			position: {
				x: this.x,
				y: this.y
			},
			value: this.value
		};
	}

	toString() {
		return `${this.x},${this.y},${this.value}`;
	}
}
