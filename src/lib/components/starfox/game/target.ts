import * as THREE from 'three';
import { createReticle } from './reticle';

export const TARGET_HIT_RADIUS = 2.4;

/**
 * The shootable "resume core": a spinning octahedron framed by green
 * brackets. Destroying it advances to the next resume section.
 */
export class ResumeTarget {
	readonly group = new THREE.Group();
	active = true;

	private core: THREE.Mesh;
	private coreMat: THREE.MeshPhongMaterial;
	private brackets: THREE.LineSegments;
	private baseY: number;
	private flash = 0;
	private spawnProgress = 1;

	constructor(scene: THREE.Scene, position: THREE.Vector3) {
		this.baseY = position.y;

		this.coreMat = new THREE.MeshPhongMaterial({
			color: 0x3a6cff,
			emissive: 0x101840,
			flatShading: true
		});
		this.core = new THREE.Mesh(new THREE.OctahedronGeometry(1.15), this.coreMat);
		this.group.add(this.core);

		this.brackets = createReticle(4.2);
		this.group.add(this.brackets);

		this.group.position.copy(position);
		scene.add(this.group);
	}

	get position(): THREE.Vector3 {
		return this.group.position;
	}

	hit() {
		this.flash = 0.22;
	}

	explodeOut() {
		this.active = false;
		this.group.visible = false;
	}

	respawn() {
		this.active = true;
		this.group.visible = true;
		this.spawnProgress = 0;
		this.flash = 0;
	}

	update(dt: number, elapsed: number) {
		if (!this.active) {
			return;
		}
		this.spawnProgress = Math.min(1, this.spawnProgress + dt * 2.5);
		this.flash = Math.max(0, this.flash - dt);

		this.core.rotation.y += dt * 1.6;
		this.core.rotation.x += dt * 0.7;
		this.brackets.rotation.z += dt * 0.4;
		this.group.position.y = this.baseY + Math.sin(elapsed * 1.5) * 0.25;

		// Ease-out pop on respawn, plus a bump when hit.
		const spawnScale = 1 - Math.pow(1 - this.spawnProgress, 3);
		const flashBump = this.flash > 0 ? 1.25 : 1;
		this.group.scale.setScalar(Math.max(0.001, spawnScale * flashBump));
		this.coreMat.emissive.setHex(this.flash > 0 ? 0xffffff : 0x101840);
	}
}
