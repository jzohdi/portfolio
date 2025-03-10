export default class CircularDeque<T> {
	private capacity: number;
	private buffer: Array<T>;
	private head: number;
	private tail: number;

	constructor(capacity: number) {
		this.capacity = capacity + 1;
		this.buffer = new Array(this.capacity);
		this.head = 0;
		this.tail = 0;
	}

	addFront(value: T) {
		if (this.isFull()) throw new Error('Deque is full');
		this.head = (this.head - 1 + this.capacity) % this.capacity;
		this.buffer[this.head] = value;
	}

	addBack(value: T) {
		if (this.isFull()) throw new Error('Deque is full');
		this.buffer[this.tail] = value;
		this.tail = (this.tail + 1) % this.capacity;
	}

	removeFront() {
		if (this.isEmpty()) throw new Error('Deque is empty');
		const value = this.buffer[this.head];
		this.head = (this.head + 1) % this.capacity;
		return value;
	}

	removeBack() {
		if (this.isEmpty()) throw new Error('Deque is empty');
		this.tail = (this.tail - 1 + this.capacity) % this.capacity;
		return this.buffer[this.tail];
	}

	peekFront() {
		if (this.isEmpty()) return null;
		return this.buffer[this.head];
	}

	peekBack() {
		if (this.isEmpty()) return null;
		return this.buffer[(this.tail - 1 + this.capacity) % this.capacity];
	}

	isEmpty() {
		return this.head === this.tail;
	}

	isFull() {
		return (this.tail + 1) % this.capacity === this.head;
	}

	size() {
		return (this.tail - this.head + this.capacity) % this.capacity;
	}

	clear() {
		this.head = this.tail = 0;
	}
}
