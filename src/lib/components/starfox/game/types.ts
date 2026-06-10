export interface InputState {
	/** -1 = left, 1 = right */
	x: number;
	/** -1 = down, 1 = up */
	y: number;
	fire: boolean;
	boost: boolean;
	brake: boolean;
}

export function createInputState(): InputState {
	return { x: 0, y: 0, fire: false, boost: false, brake: false };
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
