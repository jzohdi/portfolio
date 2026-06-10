import { createInputState } from './types';

const LEFT_KEYS = ['arrowleft', 'a'];
const RIGHT_KEYS = ['arrowright', 'd'];
const UP_KEYS = ['arrowup', 'w'];
const DOWN_KEYS = ['arrowdown', 's'];
const FIRE_KEYS = [' '];
const BOOST_KEYS = ['shift'];
const BRAKE_KEYS = ['control'];

const ALL_KEYS = [
	...LEFT_KEYS,
	...RIGHT_KEYS,
	...UP_KEYS,
	...DOWN_KEYS,
	...FIRE_KEYS,
	...BOOST_KEYS,
	...BRAKE_KEYS
];

/**
 * Tracks keyboard state (arrows + WASD steer, space fires, shift boosts,
 * ctrl brakes) and exposes it as a normalized InputState.
 */
export class KeyboardSource {
	readonly state = createInputState();
	private keys = new Set<string>();
	private _enabled = true;

	/** When disabled (e.g. game scrolled off screen), keys pass through to the page. */
	set enabled(value: boolean) {
		if (!value && this._enabled) {
			this.keys.clear();
			this.recompute();
		}
		this._enabled = value;
	}

	private onKeyDown = (e: KeyboardEvent) => this.handleKey(e, true);
	private onKeyUp = (e: KeyboardEvent) => this.handleKey(e, false);
	private onBlur = () => {
		this.keys.clear();
		this.recompute();
	};

	attach() {
		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
		window.addEventListener('blur', this.onBlur);
	}

	detach() {
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);
		window.removeEventListener('blur', this.onBlur);
	}

	private handleKey(e: KeyboardEvent, down: boolean) {
		if (!this._enabled) {
			return;
		}
		const key = e.key.toLowerCase();
		if (!ALL_KEYS.includes(key)) {
			return;
		}
		// Stop arrows/space from scrolling the page while flying.
		e.preventDefault();
		if (down) {
			this.keys.add(key);
		} else {
			this.keys.delete(key);
		}
		this.recompute();
	}

	private recompute() {
		const has = (keys: string[]) => keys.some((k) => this.keys.has(k));
		this.state.x = (has(RIGHT_KEYS) ? 1 : 0) - (has(LEFT_KEYS) ? 1 : 0);
		this.state.y = (has(UP_KEYS) ? 1 : 0) - (has(DOWN_KEYS) ? 1 : 0);
		this.state.fire = has(FIRE_KEYS);
		this.state.boost = has(BOOST_KEYS);
		this.state.brake = has(BRAKE_KEYS);
	}
}
