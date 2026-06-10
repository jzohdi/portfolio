import * as THREE from 'three';

const PARTICLE_COUNT = 26;
const DURATION_S = 1.2;
const COLORS = [0xffffff, 0x6cff5e, 0xffb300, 0x3a6cff, 0xff6a7a];

interface Particle {
	mesh: THREE.Mesh;
	velocity: THREE.Vector3;
	spin: THREE.Vector3;
}

const FLASH_DURATION_S = 0.4;

/** Low-poly debris burst with an expanding flash, reused per destroyed target. */
export class Explosion {
	private particles: Particle[] = [];
	private geometry: THREE.TetrahedronGeometry;
	private materials: THREE.MeshBasicMaterial[];
	private flash: THREE.Mesh;
	private flashMaterial: THREE.MeshBasicMaterial;
	private flashLife = 0;
	private life = 0;

	constructor(scene: THREE.Scene) {
		this.geometry = new THREE.TetrahedronGeometry(0.34);
		this.materials = COLORS.map((color) => new THREE.MeshBasicMaterial({ color }));

		this.flashMaterial = new THREE.MeshBasicMaterial({
			color: 0xfff2c8,
			transparent: true,
			opacity: 0.9,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		this.flash = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), this.flashMaterial);
		this.flash.visible = false;
		scene.add(this.flash);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const mesh = new THREE.Mesh(this.geometry, this.materials[i % this.materials.length]);
			mesh.visible = false;
			scene.add(mesh);
			this.particles.push({ mesh, velocity: new THREE.Vector3(), spin: new THREE.Vector3() });
		}
	}

	trigger(position: THREE.Vector3) {
		this.life = DURATION_S;
		this.flashLife = FLASH_DURATION_S;
		this.flash.position.copy(position);
		this.flash.scale.setScalar(0.6);
		this.flash.visible = true;
		for (const p of this.particles) {
			p.mesh.position.copy(position);
			p.velocity
				.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.35)
				.normalize()
				.multiplyScalar(6 + Math.random() * 11);
			p.spin.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
			p.mesh.scale.setScalar(1);
			p.mesh.visible = true;
		}
	}

	update(dt: number) {
		if (this.flashLife > 0) {
			this.flashLife -= dt;
			const fk = Math.max(0, this.flashLife / FLASH_DURATION_S);
			this.flash.scale.setScalar(0.6 + (1 - fk) * 4.2);
			this.flashMaterial.opacity = fk * 0.9;
			this.flash.visible = this.flashLife > 0;
		}
		if (this.life <= 0) {
			return;
		}
		this.life -= dt;
		const k = Math.max(0, this.life / DURATION_S);
		for (const p of this.particles) {
			if (this.life <= 0) {
				p.mesh.visible = false;
				continue;
			}
			p.velocity.y -= 9 * dt;
			p.mesh.position.addScaledVector(p.velocity, dt);
			p.mesh.rotation.x += p.spin.x * dt;
			p.mesh.rotation.y += p.spin.y * dt;
			p.mesh.scale.setScalar(Math.max(0.001, k));
		}
	}

	dispose() {
		this.geometry.dispose();
		this.flash.geometry.dispose();
		this.flashMaterial.dispose();
		for (const mat of this.materials) {
			mat.dispose();
		}
	}
}
