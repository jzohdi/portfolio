import * as THREE from 'three';

const POOL_SIZE = 24;
const SPEED = 170;
const LIFETIME_S = 1.3;

interface Bolt {
	mesh: THREE.Mesh;
	velocity: THREE.Vector3;
	life: number;
}

/** Pooled green laser bolts. */
export class LaserPool {
	private bolts: Bolt[] = [];
	private geometry: THREE.CylinderGeometry;
	private material: THREE.MeshBasicMaterial;
	private haloGeometry: THREE.CylinderGeometry;
	private haloMaterial: THREE.MeshBasicMaterial;

	constructor(scene: THREE.Scene) {
		this.geometry = new THREE.CylinderGeometry(0.07, 0.07, 1.8, 5);
		this.geometry.rotateX(Math.PI / 2); // length along Z so lookAt aims it
		this.material = new THREE.MeshBasicMaterial({ color: 0x9dff86 });

		// Soft additive sheath around each bolt for an N64-style glow.
		this.haloGeometry = new THREE.CylinderGeometry(0.17, 0.17, 1.7, 6);
		this.haloGeometry.rotateX(Math.PI / 2);
		this.haloMaterial = new THREE.MeshBasicMaterial({
			color: 0x3fdc36,
			transparent: true,
			opacity: 0.4,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});

		for (let i = 0; i < POOL_SIZE; i++) {
			const mesh = new THREE.Mesh(this.geometry, this.material);
			mesh.add(new THREE.Mesh(this.haloGeometry, this.haloMaterial));
			mesh.visible = false;
			scene.add(mesh);
			this.bolts.push({ mesh, velocity: new THREE.Vector3(), life: 0 });
		}
	}

	fire(origin: THREE.Vector3, target: THREE.Vector3) {
		const bolt = this.bolts.find((b) => !b.mesh.visible);
		if (!bolt) {
			return;
		}
		bolt.mesh.position.copy(origin);
		bolt.mesh.lookAt(target);
		bolt.velocity.subVectors(target, origin).normalize().multiplyScalar(SPEED);
		bolt.life = LIFETIME_S;
		bolt.mesh.visible = true;
	}

	/**
	 * Deactivates bolts within `radius` of `center` and returns how many hit.
	 */
	collide(center: THREE.Vector3, radius: number): number {
		let hits = 0;
		for (const bolt of this.bolts) {
			if (bolt.mesh.visible && bolt.mesh.position.distanceTo(center) < radius) {
				bolt.mesh.visible = false;
				hits++;
			}
		}
		return hits;
	}

	update(dt: number) {
		for (const bolt of this.bolts) {
			if (!bolt.mesh.visible) {
				continue;
			}
			bolt.life -= dt;
			if (bolt.life <= 0) {
				bolt.mesh.visible = false;
				continue;
			}
			bolt.mesh.position.addScaledVector(bolt.velocity, dt);
		}
	}

	dispose() {
		this.geometry.dispose();
		this.material.dispose();
		this.haloGeometry.dispose();
		this.haloMaterial.dispose();
	}
}
