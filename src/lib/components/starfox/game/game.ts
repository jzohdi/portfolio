import * as THREE from 'three';
import { createArwing } from './arwing';
import { World } from './world';
import { LaserPool } from './lasers';
import { createReticle } from './reticle';
import { KeyboardSource } from './input';
import { ResumeTarget, TARGET_HIT_RADIUS } from './target';
import { Explosion } from './explosion';
import { Contrails } from './contrails';
import { clamp, type InputState } from './types';

// Internal render height in pixels; upscaled with CSS for the chunky N64 look.
const INTERNAL_HEIGHT = 300;

const BOUNDS_X = 9;
const BOUNDS_Y_MIN = 1.5;
const BOUNDS_Y_MAX = 9.5;

const BASE_SPEED = 40;
const BOOST_SPEED = 80;
const BRAKE_SPEED = 16;

const MOVE_SPEED_X = 17;
const MOVE_SPEED_Y = 12;

const FIRE_COOLDOWN_S = 0.16;
const RETICLE_NEAR = 16;
const RETICLE_FAR = 30;

const TARGET_POSITION = new THREE.Vector3(0, 4.6, -48);
const HITS_PER_SECTION = 3;
const SCORE_PER_HIT = 1;
const SCORE_PER_SECTION = 5;
const CLEARED_DELAY_S = 1.5;
const COMPLETE_DELAY_S = 4;

export type SectionEvent = number | null | 'complete';

export interface GameOptions {
	sectionCount: number;
	onScore?: (score: number) => void;
	/** number = section now active, null = section destroyed, 'complete' = all done */
	onSection?: (event: SectionEvent) => void;
}

/**
 * Star Fox style rail-shooter: the ship stays near z=0 while the world
 * scrolls past. Shoot the floating resume core to advance sections.
 */
export class StarFoxGame {
	private renderer: THREE.WebGLRenderer;
	private scene = new THREE.Scene();
	private camera: THREE.PerspectiveCamera;
	private clock = new THREE.Clock();
	private rafId = 0;
	private resizeObserver: ResizeObserver;
	private intersectionObserver: IntersectionObserver;

	private keyboard = new KeyboardSource();
	private world: World;
	private lasers: LaserPool;
	private ship: THREE.Group;
	private model: THREE.Group;
	private engineGlow: THREE.Object3D | null;
	private reticleNear: THREE.Object3D;
	private reticleFar: THREE.Object3D;
	private target: ResumeTarget;
	private explosion: Explosion;
	private contrails: Contrails;

	private speed = BASE_SPEED;
	private fireCooldown = 0;
	private contrailTimer = 0;
	private elapsed = 0;
	private score = 0;

	private sectionIdx = 0;
	private sectionHits = 0;
	private phase: 'active' | 'cleared' | 'complete' = 'active';
	private phaseTimer = 0;

	constructor(
		private container: HTMLElement,
		private touch: InputState,
		private options: GameOptions
	) {
		this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
		this.renderer.setPixelRatio(1);
		const canvas = this.renderer.domElement;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.imageRendering = 'pixelated';
		container.appendChild(canvas);

		this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
		this.camera.position.set(0, 3.4, 8);

		this.world = new World(this.scene);
		this.lasers = new LaserPool(this.scene);
		this.target = new ResumeTarget(this.scene, TARGET_POSITION);
		this.explosion = new Explosion(this.scene);
		this.contrails = new Contrails(this.scene);

		this.model = createArwing();
		this.engineGlow = this.model.getObjectByName('engineGlow') ?? null;
		this.ship = new THREE.Group();
		this.ship.position.set(0, 2.6, 0);
		this.ship.add(this.model);
		this.scene.add(this.ship);

		this.reticleNear = createReticle(0.85);
		this.reticleFar = createReticle(1.5);
		this.scene.add(this.reticleNear, this.reticleFar);

		this.resizeObserver = new ResizeObserver(() => this.resize());
		this.resizeObserver.observe(container);
		this.resize();

		// Only capture arrows/space/etc. while the game is actually on screen,
		// so it doesn't hijack page scrolling when embedded in the home page.
		this.intersectionObserver = new IntersectionObserver((entries) => {
			this.keyboard.enabled = entries[0]?.isIntersecting ?? true;
		});
		this.intersectionObserver.observe(container);
	}

	start() {
		this.keyboard.attach();
		this.clock.start();
		this.options.onSection?.(this.sectionIdx);
		const loop = () => {
			this.rafId = requestAnimationFrame(loop);
			const dt = Math.min(this.clock.getDelta(), 0.05);
			this.update(dt);
			this.renderer.render(this.scene, this.camera);
		};
		loop();
	}

	dispose() {
		cancelAnimationFrame(this.rafId);
		this.keyboard.detach();
		this.resizeObserver.disconnect();
		this.intersectionObserver.disconnect();
		this.lasers.dispose();
		this.explosion.dispose();
		this.contrails.dispose();
		this.scene.traverse((obj) => {
			if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
				obj.geometry.dispose();
				const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
				for (const mat of materials) {
					mat.dispose();
				}
			}
		});
		this.renderer.dispose();
		this.renderer.domElement.remove();
	}

	private update(dt: number) {
		this.elapsed += dt;

		const kb = this.keyboard.state;
		const ix = clamp(kb.x + this.touch.x, -1, 1);
		const iy = clamp(kb.y + this.touch.y, -1, 1);
		const fire = kb.fire || this.touch.fire;
		const boost = kb.boost || this.touch.boost;
		const brake = kb.brake || this.touch.brake;

		// Forward speed with smooth boost/brake transitions.
		const targetSpeed = boost ? BOOST_SPEED : brake ? BRAKE_SPEED : BASE_SPEED;
		this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 3.5);

		// Steer within the corridor bounds.
		const pos = this.ship.position;
		pos.x = clamp(pos.x + ix * MOVE_SPEED_X * dt, -BOUNDS_X, BOUNDS_X);
		pos.y = clamp(pos.y + iy * MOVE_SPEED_Y * dt, BOUNDS_Y_MIN, BOUNDS_Y_MAX);

		// Bank/pitch/yaw the model toward the input, with an idle bob.
		const lerpRate = 1 - Math.exp(-dt * 8);
		const rot = this.model.rotation;
		rot.z += (-ix * 0.65 - rot.z) * lerpRate;
		rot.x += (iy * 0.28 - rot.x) * lerpRate;
		rot.y += (-ix * 0.32 - rot.y) * lerpRate;
		this.model.position.y = Math.sin(this.elapsed * 2) * 0.06;

		// Camera trails the ship with smoothing.
		const camZ = 8 + (this.speed - BASE_SPEED) * 0.035;
		const camLerp = 1 - Math.exp(-dt * 4.5);
		this.camera.position.x += (pos.x * 0.55 - this.camera.position.x) * camLerp;
		this.camera.position.y += (2.4 + (pos.y - 2.6) * 0.55 + 1.2 - this.camera.position.y) * camLerp;
		this.camera.position.z += (camZ - this.camera.position.z) * camLerp;
		this.camera.lookAt(pos.x * 0.85, pos.y * 0.85 + 0.4, -20);

		// Reticle floats ahead of the ship; lasers converge on the far one.
		this.reticleNear.position.set(pos.x, pos.y, pos.z - RETICLE_NEAR);
		this.reticleFar.position.set(pos.x, pos.y, pos.z - RETICLE_FAR);

		this.fireCooldown -= dt;
		if (fire && this.fireCooldown <= 0) {
			this.fireCooldown = FIRE_COOLDOWN_S;
			const target = new THREE.Vector3(pos.x, pos.y, pos.z - RETICLE_FAR - 6);
			// Spawn bolts under the banked wings so they track the ship's roll.
			for (const side of [-1, 1]) {
				const origin = new THREE.Vector3(side * 2.0, -0.45, 0.4)
					.applyQuaternion(this.model.quaternion)
					.add(pos);
				this.lasers.fire(origin, target);
			}
		}

		if (this.engineGlow) {
			const pulse = 0.7 + this.speed / 130 + Math.sin(this.elapsed * 30) * 0.06;
			this.engineGlow.scale.setScalar(pulse);
		}

		// Smoke contrails stream off the wingtips while boosting.
		this.contrailTimer -= dt;
		if (boost && this.contrailTimer <= 0) {
			this.contrailTimer = 0.025;
			for (const side of [-1, 1]) {
				const tip = new THREE.Vector3(side * 2.95, -0.72, 0.9)
					.applyQuaternion(this.model.quaternion)
					.add(pos);
				this.contrails.emit(tip, this.speed);
			}
		}

		this.world.update(dt, this.speed);
		this.lasers.update(dt);
		this.target.update(dt, this.elapsed);
		this.explosion.update(dt);
		this.contrails.update(dt);
		this.updateSectionPhase(dt);
	}

	private updateSectionPhase(dt: number) {
		if (this.phase === 'active') {
			if (!this.target.active) {
				return;
			}
			const hits = this.lasers.collide(this.target.position, TARGET_HIT_RADIUS);
			if (hits === 0) {
				return;
			}
			this.target.hit();
			this.sectionHits += hits;
			this.addScore(hits * SCORE_PER_HIT);
			if (this.sectionHits >= HITS_PER_SECTION) {
				this.explosion.trigger(this.target.position);
				this.target.explodeOut();
				this.addScore(SCORE_PER_SECTION);
				this.phase = 'cleared';
				this.phaseTimer = CLEARED_DELAY_S;
				this.options.onSection?.(null);
			}
			return;
		}

		this.phaseTimer -= dt;
		if (this.phaseTimer > 0) {
			return;
		}
		if (this.phase === 'cleared') {
			if (this.sectionIdx + 1 >= this.options.sectionCount) {
				this.phase = 'complete';
				this.phaseTimer = COMPLETE_DELAY_S;
				this.options.onSection?.('complete');
			} else {
				this.startSection(this.sectionIdx + 1);
			}
		} else {
			// 'complete' — loop back to the first section.
			this.startSection(0);
		}
	}

	private startSection(idx: number) {
		this.sectionIdx = idx;
		this.sectionHits = 0;
		this.phase = 'active';
		this.target.respawn();
		this.options.onSection?.(idx);
	}

	private addScore(amount: number) {
		this.score += amount;
		this.options.onScore?.(this.score);
	}

	private resize() {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		if (width === 0 || height === 0) {
			return;
		}
		const scale = Math.min(1, INTERNAL_HEIGHT / height);
		this.renderer.setSize(Math.round(width * scale), Math.round(height * scale), false);
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	}
}
