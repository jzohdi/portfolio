export type PositionXY = { x: number; y: number };

export type MoveDirection = 0 | 1 | 2 | 3;
// 0: up, 1: right, 2: down, 3: left

export type SerializedTile = {
	position: PositionXY;
	value: number;
};

export type SerializedGameManager = {
	grid: SerializedGrid;
	score: number;
	over: boolean;
	won: boolean;
	keepPlaying: boolean;
};

export type SerializedGrid = {
	cells: (SerializedTile | null)[][];
	size: number;
};

export type HTMLActuatorMetaData = {
	score: number;
	over: boolean;
	won: boolean;
	bestScore: number;
	terminated: boolean;
};
