export type EventData = undefined | 0 | 1 | 2 | 3;

export class KeyboardInputManager {
	private events: Record<string, ((data: EventData) => void)[]>;

	public restartButton;
	public retryButton;
	public keepPlayingButton;
	public gameContainer;

	constructor(
		restartButton: HTMLButtonElement,
		retryButton: HTMLButtonElement,
		keepPlayingButton: HTMLButtonElement,
		gameContainer: HTMLDivElement
	) {
		this.events = {};
		this.restartButton = restartButton;
		this.retryButton = retryButton;
		this.keepPlayingButton = keepPlayingButton;
		this.gameContainer = gameContainer;

		// Respond to button presses
		this.bindButtonPress(retryButton, this.restart);
		this.bindButtonPress(restartButton, this.restart);
		this.bindButtonPress(keepPlayingButton, this.keepPlaying);
	}

	on(event: string, callback: (data: EventData) => void) {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(callback);
	}

	emit(event: string, data?: 0 | 1 | 2 | 3) {
		const callbacks = this.events[event];
		if (callbacks) {
			callbacks.forEach((callback) => {
				callback(data);
			});
		}
	}

	bindButtonPress(button: HTMLButtonElement, fn: (event: Event) => void) {
		button.addEventListener('click', fn.bind(this));
	}

	keepPlaying(event: Event) {
		event.preventDefault();
		this.emit('keepPlaying');
	}

	restart(event: Event) {
		event.preventDefault();
		this.emit('restart');
	}
}

export type TouchEventPosition = {
	touchStartClientX: number;
	touchStartClientY: number;
};

export function handleTouchStart(event: TouchEvent): TouchEventPosition | undefined {
	if (event.touches.length > 1 || event.targetTouches.length > 1) {
		return; // Ignore if touching with more than 1 finger
	}
	const touchStartClientX = event.touches[0].clientX;
	const touchStartClientY = event.touches[0].clientY;

	event.preventDefault();

	return { touchStartClientX, touchStartClientY };
}

export function handleTouchMove(event: TouchEvent) {
	event.preventDefault();
}

export function handleTouchEnd(
	event: TouchEvent,
	{ touchStartClientX, touchStartClientY }: TouchEventPosition,
	inputManager: KeyboardInputManager
) {
	if (event.touches.length > 0 || event.targetTouches.length > 0) {
		return; // Ignore if still touching with one or more fingers
	}
	const touchEndClientX = event.changedTouches[0].clientX;
	const touchEndClientY = event.changedTouches[0].clientY;

	const dx = touchEndClientX - touchStartClientX;
	const absDx = Math.abs(dx);

	const dy = touchEndClientY - touchStartClientY;
	const absDy = Math.abs(dy);

	if (Math.max(absDx, absDy) > 10) {
		// (right : left) : (down : up)
		inputManager.emit('move', absDx > absDy ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0);
	}
}

const map = {
	ArrowUp: 0, // Up
	ArrowRight: 1, // Right
	ArrowDown: 2, // Down
	ArrowLeft: 3, // Left
	75: 0, // Vim up
	76: 1, // Vim right
	74: 2, // Vim down
	72: 3, // Vim left
	w: 0, // W
	d: 1, // D
	s: 2, // S
	a: 3 // A
} as const;

export function handleKeyDown(event: KeyboardEvent, inputManager: KeyboardInputManager) {
	const modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
	const mapped = map[event.key as keyof typeof map];
	if (!modifiers) {
		if (mapped !== undefined) {
			event.preventDefault();
			inputManager.emit('move', mapped);
		}
	}

	// R key restarts the game
	if (!modifiers && ['R', 'r'].includes(event.key)) {
		inputManager.restart.call(self, event);
	}
}
