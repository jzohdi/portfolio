import type { SerializedGameManager } from './types';

const fakeStoreData: Record<string, string> = {};
const fakeStorage = {
	_data: fakeStoreData,

	setItem: function (id: string, val: string) {
		return (this._data[id] = String(val));
	},

	getItem: function (id: string) {
		return this._data[id] !== undefined ? this._data[id] : undefined;
	},

	removeItem: function (id: string) {
		return delete this._data[id];
	},

	clear: function () {
		return (this._data = {});
	}
};

export default class LocalStorageManager {
	private bestScoreKey = 'bestScore';
	private gameStateKey = 'gameState';
	private storage: Storage | typeof fakeStorage;

	constructor() {
		const supported = isLocalStorageSupported();
		this.storage = supported ? window.localStorage : fakeStorage;
	}
	getBestScore() {
		const bestScore = this.storage.getItem(this.bestScoreKey);
		if (!bestScore) {
			return 0;
		}
		return parseInt(bestScore);
	}
	setBestScore(score: number) {
		return this.storage.setItem(this.bestScoreKey, String(score));
	}
	getGameState(): SerializedGameManager | null {
		const stateJSON = this.storage.getItem(this.gameStateKey);
		return stateJSON ? JSON.parse(stateJSON) : null;
	}
	setGameState(gameState: SerializedGameManager) {
		return this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
	}
	clearGameState() {
		return this.storage.removeItem(this.gameStateKey);
	}
}

function isLocalStorageSupported() {
	const testKey = 'test';

	try {
		const storage = window.localStorage;
		storage.setItem(testKey, '1');
		storage.removeItem(testKey);
		return true;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_error) {
		return false;
	}
}
