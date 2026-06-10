import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

const SKY_COLOR = 0x4a5160;
const CORRIDOR_LENGTH = 420;
const MOUNTAIN_COUNT = 26;
const RIDGE_COUNT = 10;
const ISLAND_COUNT = 8;
const CLOUD_COUNT = 11;
const WATER_LENGTH = 700;
const WATER_REPEAT_Y = 48;

// Brighter than the final look: multiplied by the mottled rock texture.
const MOUNTAIN_COLORS = [0x3e6f4a, 0x357355, 0x54815c, 0x2d583e];
const FOLIAGE_COLORS = [0x2e6b38, 0x3a7a42, 0x25592f];

interface Prop {
	object: THREE.Object3D;
	respawn: (obj: THREE.Object3D, z: number) => void;
}

/**
 * Stormy Corneria-style corridor: animated faceted water flanked by
 * low-poly mountains, islands with trees, a distant ridge line, and
 * drifting clouds, wrapped in heavy fog.
 */
export class World {
	private waterTexture: THREE.CanvasTexture;
	private waterGeo: THREE.PlaneGeometry;
	private waterBase: Float32Array;
	private props: Prop[] = [];
	private clouds: THREE.Object3D[] = [];
	private time = 0;

	constructor(scene: THREE.Scene) {
		scene.background = new THREE.Color(SKY_COLOR);
		scene.fog = new THREE.Fog(SKY_COLOR, 45, 220);

		// --- Overcast sky dome: full mottled cloud deck, no visible sun ---
		const sky = new THREE.Mesh(
			new THREE.SphereGeometry(420, 16, 12),
			new THREE.MeshBasicMaterial({
				map: createOvercastTexture(),
				side: THREE.BackSide,
				fog: false,
				depthWrite: false
			})
		);
		scene.add(sky);

		// N64-style flat-bright lighting: strong ambient so undersides
		// never go black, softer directional for facet definition.
		const hemi = new THREE.HemisphereLight(0xbac4d6, 0x3d4a5c, 1.0);
		scene.add(hemi);
		scene.add(new THREE.AmbientLight(0x6b7488, 0.55));
		// Soft, diffuse key light: overcast sky, no hard sun.
		const sun = new THREE.DirectionalLight(0xe8edf6, 0.85);
		sun.position.set(-30, 60, -40);
		scene.add(sun);
		// Up-light fill so wing undersides stay readable when banking.
		const fill = new THREE.DirectionalLight(0x96a8c8, 0.55);
		fill.position.set(20, -40, 30);
		scene.add(fill);

		// --- Mirror plane below the waves: reflections show through the
		// slightly transparent water surface ---
		const reflector = new Reflector(new THREE.PlaneGeometry(500, WATER_LENGTH), {
			textureWidth: 256,
			textureHeight: 256,
			color: 0x788098,
			clipBias: 0.003
		});
		reflector.rotation.x = -Math.PI / 2;
		reflector.position.set(0, -0.75, -WATER_LENGTH / 2 + 50);
		scene.add(reflector);

		// --- Water: subdivided plane with animated faceted waves ---
		this.waterTexture = createWaterTexture();
		this.waterGeo = new THREE.PlaneGeometry(500, WATER_LENGTH, 40, 56);
		(this.waterGeo.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
		this.waterBase = new Float32Array(this.waterGeo.attributes.position.array);
		const water = new THREE.Mesh(
			this.waterGeo,
			new THREE.MeshPhongMaterial({
				map: this.waterTexture,
				color: 0x96a4c4,
				shininess: 80,
				specular: 0x556699,
				flatShading: true,
				transparent: true,
				opacity: 0.8
			})
		);
		water.rotation.x = -Math.PI / 2;
		water.position.set(0, 0, -WATER_LENGTH / 2 + 50);
		scene.add(water);

		// --- Recycled corridor props ---
		for (let i = 0; i < MOUNTAIN_COUNT; i++) {
			this.addProp(scene, createMountain(false), placeMountain(false));
		}
		for (let i = 0; i < RIDGE_COUNT; i++) {
			this.addProp(scene, createMountain(true), placeMountain(true));
		}
		for (let i = 0; i < ISLAND_COUNT; i++) {
			this.addProp(scene, createIsland(), placeIsland);
		}

		// --- Clouds ---
		for (let i = 0; i < CLOUD_COUNT; i++) {
			const cloud = createCloud();
			placeCloud(cloud, -Math.random() * CORRIDOR_LENGTH + 20);
			scene.add(cloud);
			this.clouds.push(cloud);
		}
	}

	private addProp(
		scene: THREE.Scene,
		object: THREE.Object3D,
		respawn: (obj: THREE.Object3D, z: number) => void
	) {
		respawn(object, -Math.random() * CORRIDOR_LENGTH + 20);
		scene.add(object);
		this.props.push({ object, respawn });
	}

	update(dt: number, speed: number) {
		this.time += dt;

		// Scroll the water texture toward the camera to sell forward motion.
		this.waterTexture.offset.y += ((speed * dt) / WATER_LENGTH) * WATER_REPEAT_Y;

		// Faceted wave displacement (local z is world up after rotation).
		const pos = this.waterGeo.attributes.position;
		const arr = pos.array as Float32Array;
		for (let i = 0; i < pos.count; i++) {
			const x = this.waterBase[i * 3];
			const y = this.waterBase[i * 3 + 1];
			arr[i * 3 + 2] =
				Math.sin(x * 0.07 + this.time * 1.2) * 0.3 + Math.cos(y * 0.05 + this.time * 0.8) * 0.26;
		}
		pos.needsUpdate = true;

		for (const prop of this.props) {
			prop.object.position.z += speed * dt;
			if (prop.object.position.z > 40) {
				prop.respawn(prop.object, prop.object.position.z - CORRIDOR_LENGTH);
			}
		}

		for (const cloud of this.clouds) {
			cloud.position.z += speed * dt * 0.25;
			if (cloud.position.z > 30) {
				placeCloud(cloud, cloud.position.z - CORRIDOR_LENGTH * 0.25 - 80);
			}
		}
	}
}

/** Deterministic pseudo-random in [0, 1) — co-located (duplicated) vertices
 * hash identically, so displacing them never opens cracks in the mesh. */
function hash3(x: number, y: number, z: number): number {
	const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
	return s - Math.floor(s);
}

function createMountain(far: boolean): THREE.Mesh {
	const radius = far ? 16 + Math.random() * 18 : 8 + Math.random() * 12;
	const height = far ? 16 + Math.random() * 22 : 7 + Math.random() * 14;
	const color = MOUNTAIN_COLORS[Math.floor(Math.random() * MOUNTAIN_COLORS.length)];
	const geo = new THREE.ConeGeometry(radius, height, 7, 4);

	// Rough up the silhouette: push each ring vertex in/out and jitter its
	// height so peaks read as craggy rock instead of perfect cones.
	const pos = geo.attributes.position as THREE.BufferAttribute;
	const v = new THREE.Vector3();
	for (let i = 0; i < pos.count; i++) {
		v.fromBufferAttribute(pos, i);
		const radial = 0.72 + hash3(v.x, v.y, v.z) * 0.55;
		v.x *= radial;
		v.z *= radial;
		// Leave the base ring planted so the shoreline never lifts off the water.
		if (v.y > -height / 2 + 0.001) {
			v.y += (hash3(v.z + 13.7, v.x, v.y) - 0.5) * height * 0.12;
		}
		pos.setXYZ(i, v.x, v.y, v.z);
	}
	geo.computeVertexNormals();

	const mat = new THREE.MeshPhongMaterial({
		color,
		flatShading: true,
		map: getMountainTexture()
	});
	const mesh = new THREE.Mesh(geo, mat);
	mesh.userData.height = height;
	return mesh;
}

function placeMountain(far: boolean) {
	return (obj: THREE.Object3D, z: number) => {
		const side = Math.random() < 0.5 ? -1 : 1;
		const height = obj.userData.height as number;
		const distance = far ? 75 + Math.random() * 70 : 24 + Math.random() * 45;
		obj.position.set(side * distance, height / 2 - 0.5, z);
		obj.rotation.y = Math.random() * Math.PI * 2;
	};
}

function createIsland(): THREE.Group {
	const group = new THREE.Group();

	const radius = 2.5 + Math.random() * 2.5;
	const base = new THREE.Mesh(
		new THREE.ConeGeometry(radius, 1.6, 6),
		new THREE.MeshPhongMaterial({ color: 0x4f5a48, flatShading: true })
	);
	base.position.y = 0.4;
	group.add(base);

	const trunkMat = new THREE.MeshPhongMaterial({ color: 0x4a3a28, flatShading: true });
	const treeCount = 2 + Math.floor(Math.random() * 3);
	for (let i = 0; i < treeCount; i++) {
		const angle = Math.random() * Math.PI * 2;
		const r = Math.random() * radius * 0.45;
		const tx = Math.cos(angle) * r;
		const tz = Math.sin(angle) * r;
		const trunkH = 0.7 + Math.random() * 0.5;

		const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, trunkH, 5), trunkMat);
		trunk.position.set(tx, 1.0 + trunkH / 2, tz);
		group.add(trunk);

		const foliage = new THREE.Mesh(
			new THREE.IcosahedronGeometry(0.55 + Math.random() * 0.4, 0),
			new THREE.MeshPhongMaterial({
				color: FOLIAGE_COLORS[Math.floor(Math.random() * FOLIAGE_COLORS.length)],
				flatShading: true
			})
		);
		foliage.position.set(tx, 1.0 + trunkH + 0.4, tz);
		foliage.rotation.y = Math.random() * Math.PI;
		group.add(foliage);
	}

	return group;
}

function placeIsland(obj: THREE.Object3D, z: number) {
	const side = Math.random() < 0.5 ? -1 : 1;
	obj.position.set(side * (13 + Math.random() * 40), 0, z);
	obj.rotation.y = Math.random() * Math.PI * 2;
}

function createCloud(): THREE.Group {
	const group = new THREE.Group();
	// Flat unlit color: distant haze blobs that the fog softens, not rocks.
	const mat = new THREE.MeshBasicMaterial({ color: 0x7b8598 });
	const blobCount = 2 + Math.floor(Math.random() * 3);
	for (let i = 0; i < blobCount; i++) {
		const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + Math.random() * 4, 0), mat);
		blob.position.set((i - blobCount / 2) * 5 + Math.random() * 2, Math.random() * 1.5, Math.random() * 2);
		blob.scale.y = 0.32;
		group.add(blob);
	}
	return group;
}

function placeCloud(obj: THREE.Object3D, z: number) {
	const side = Math.random() < 0.5 ? -1 : 1;
	obj.position.set(side * (25 + Math.random() * 100), 27 + Math.random() * 18, z - 120);
}

/**
 * Mottled storm-cloud deck baked into an equirect texture for the sky dome.
 * Canvas top = zenith, middle = horizon (kept at the fog color so distant
 * silhouettes blend seamlessly into the sky).
 */
function createOvercastTexture(): THREE.CanvasTexture {
	const w = 512;
	const h = 256;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createLinearGradient(0, 0, 0, h);
	gradient.addColorStop(0, '#2e3440');
	gradient.addColorStop(0.42, '#3e4553');
	gradient.addColorStop(0.56, '#4a5160');
	gradient.addColorStop(1, '#4a5160');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, w, h);

	// Soft elliptical blotches, light and dark, heaviest near the zenith
	// but reaching down close to the horizon for full overcast coverage.
	for (let i = 0; i < 230; i++) {
		const x = Math.random() * w;
		const y = Math.pow(Math.random(), 1.3) * h * 0.55;
		const r = 16 + Math.random() * 48;
		const light = Math.random() < 0.45;
		const rgb = light ? '102, 111, 127' : '36, 42, 53';
		const alpha = 0.18 + Math.random() * 0.2;
		// Draw at x and x±w so the texture tiles without a vertical seam.
		for (const ox of [x - w, x, x + w]) {
			ctx.save();
			ctx.translate(ox, y);
			ctx.scale(1, 0.3 + Math.random() * 0.25);
			const blob = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
			blob.addColorStop(0, `rgba(${rgb}, ${alpha})`);
			blob.addColorStop(1, `rgba(${rgb}, 0)`);
			ctx.fillStyle = blob;
			ctx.fillRect(-r, -r, r * 2, r * 2);
			ctx.restore();
		}
	}

	const texture = new THREE.CanvasTexture(canvas);
	// Canvas colors are authored in sRGB; without this tag the dome renders
	// washed out and no longer matches the fog color at the horizon.
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.wrapS = THREE.RepeatWrapping;
	texture.repeat.set(2, 1);
	return texture;
}

let mountainTexture: THREE.CanvasTexture | null = null;

/** Shared mottled rock texture, tinted per-mountain by the material color. */
function getMountainTexture(): THREE.CanvasTexture {
	if (mountainTexture) {
		return mountainTexture;
	}
	const size = 64;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = '#a8b0a0';
	ctx.fillRect(0, 0, size, size);

	const tones = ['#8c9684', '#727d68', '#bcc4b0', '#5f6a56', '#99a28e'];
	for (let i = 0; i < 240; i++) {
		ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
		ctx.fillRect(
			Math.floor(Math.random() * size),
			Math.floor(Math.random() * size),
			1 + Math.floor(Math.random() * 4),
			1 + Math.floor(Math.random() * 3)
		);
	}
	// A few darker horizontal striations like exposed rock bands.
	ctx.fillStyle = 'rgba(70, 80, 64, 0.5)';
	for (let i = 0; i < 9; i++) {
		ctx.fillRect(0, Math.floor(Math.random() * size), size, 1 + Math.floor(Math.random() * 2));
	}

	mountainTexture = new THREE.CanvasTexture(canvas);
	mountainTexture.wrapS = THREE.RepeatWrapping;
	mountainTexture.wrapT = THREE.RepeatWrapping;
	mountainTexture.magFilter = THREE.NearestFilter;
	mountainTexture.repeat.set(3, 2);
	return mountainTexture;
}

function createWaterTexture(): THREE.CanvasTexture {
	const size = 64;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = '#2c3850';
	ctx.fillRect(0, 0, size, size);

	const tones = ['#3a4a66', '#25304a', '#46587a', '#202a40'];
	for (let i = 0; i < 260; i++) {
		ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
		const w = 1 + Math.floor(Math.random() * 4);
		ctx.fillRect(
			Math.floor(Math.random() * size),
			Math.floor(Math.random() * size),
			w,
			1 + Math.floor(Math.random() * 2)
		);
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.magFilter = THREE.NearestFilter;
	texture.repeat.set(36, WATER_REPEAT_Y);
	return texture;
}
