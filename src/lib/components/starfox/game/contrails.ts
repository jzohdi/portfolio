import * as THREE from 'three';

const POOL_SIZE = 48;
const LIFE_S = 0.45;
// Puffs drift toward the camera (the world scrolls past the ship); fade
// them out before z approaches the camera position (~8+).
const FADE_END_Z = 5.5;
const FADE_RANGE = 3;

interface Puff {
	sprite: THREE.Sprite;
	material: THREE.SpriteMaterial;
	velocity: THREE.Vector3;
	life: number;
}

/** Soft round puff so sprites don't render as hard squares. */
function createSmokeTexture(): THREE.CanvasTexture {
	const size = 64;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;
	const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
	gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
	gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);
	return new THREE.CanvasTexture(canvas);
}

/** Smoke puffs streamed off the wingtips while boosting. */
export class Contrails {
	private puffs: Puff[] = [];
	private texture: THREE.CanvasTexture;

	constructor(scene: THREE.Scene) {
		this.texture = createSmokeTexture();
		for (let i = 0; i < POOL_SIZE; i++) {
			const material = new THREE.SpriteMaterial({
				map: this.texture,
				color: 0xcdd4e2,
				transparent: true,
				opacity: 0,
				depthWrite: false
			});
			const sprite = new THREE.Sprite(material);
			sprite.visible = false;
			scene.add(sprite);
			this.puffs.push({ sprite, material, velocity: new THREE.Vector3(), life: 0 });
		}
	}

	emit(position: THREE.Vector3, worldSpeed: number) {
		const puff = this.puffs.find((p) => !p.sprite.visible);
		if (!puff) {
			return;
		}
		puff.sprite.position.copy(position);
		puff.velocity.set(
			(Math.random() - 0.5) * 1.4,
			0.3 + Math.random() * 0.7,
			worldSpeed * 0.4
		);
		puff.life = LIFE_S;
		puff.sprite.visible = true;
	}

	update(dt: number) {
		for (const puff of this.puffs) {
			if (!puff.sprite.visible) {
				continue;
			}
			puff.life -= dt;
			if (puff.life <= 0 || puff.sprite.position.z > FADE_END_Z) {
				puff.sprite.visible = false;
				continue;
			}
			const k = 1 - puff.life / LIFE_S; // 0 → 1 over lifetime
			puff.sprite.position.addScaledVector(puff.velocity, dt);
			puff.sprite.scale.setScalar(0.45 + k * 1.1);
			const zFade = (FADE_END_Z - puff.sprite.position.z) / FADE_RANGE;
			const fade = Math.max(0, Math.min(1 - k, zFade, 1));
			puff.material.opacity = 0.6 * fade;
		}
	}

	dispose() {
		for (const puff of this.puffs) {
			puff.material.dispose();
		}
		this.texture.dispose();
	}
}
