import * as THREE from 'three';

type V3 = [number, number, number];

const WHITE = 0xe8eaf2;
const BLUE = 0x3050d8;
const NAVY = 0x14264f;
const YELLOW = 0xf2d24a;
const DARK = 0x3c4150;

/** Collects raw triangles and builds a single flat-shaded mesh per material. */
class MeshBuilder {
	private verts: number[] = [];

	tri(a: V3, b: V3, c: V3) {
		this.verts.push(...a, ...b, ...c);
	}

	/** a→b→c→d in perimeter order. */
	quad(a: V3, b: V3, c: V3, d: V3) {
		this.tri(a, b, c);
		this.tri(a, c, d);
	}

	/** Extrudes a flat polygon downward to give it thickness. */
	prism(perimeter: V3[], thickness: number) {
		const bottom = perimeter.map(([x, y, z]) => [x, y - thickness, z] as V3);
		for (let i = 1; i < perimeter.length - 1; i++) {
			this.tri(perimeter[0], perimeter[i], perimeter[i + 1]);
			this.tri(bottom[0], bottom[i + 1], bottom[i]);
		}
		for (let i = 0; i < perimeter.length; i++) {
			const j = (i + 1) % perimeter.length;
			this.quad(perimeter[i], perimeter[j], bottom[j], bottom[i]);
		}
	}

	build(material: THREE.Material): THREE.Mesh {
		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.Float32BufferAttribute(this.verts, 3));
		geo.computeVertexNormals();
		return new THREE.Mesh(geo, material);
	}
}

/**
 * Low-poly Arwing modeled on the SF64 design: white hull with a blue
 * nose-top, navy canopy, twin blue dorsal fins, swept main wings with
 * yellow tips and wingtip G-diffusers, blue engine glow. Forward is -Z.
 */
export function createArwing(): THREE.Group {
	const group = new THREE.Group();
	const mat = (color: number, shininess = 22) =>
		new THREE.MeshPhongMaterial({ color, flatShading: true, side: THREE.DoubleSide, shininess });

	const white = new MeshBuilder();
	const blue = new MeshBuilder();
	const navy = new MeshBuilder();
	const yellow = new MeshBuilder();
	const dark = new MeshBuilder();

	// --- Fuselage cross-section rings, nose to tail ---
	const nose: V3 = [0, 0.02, -2.6];
	const b = {
		top: [0, 0.26, -1.1] as V3,
		right: [0.3, 0.02, -1.1] as V3,
		bottom: [0, -0.16, -1.1] as V3,
		left: [-0.3, 0.02, -1.1] as V3
	};
	const c = {
		top: [0, 0.4, 0.1] as V3,
		right: [0.55, 0, 0.1] as V3,
		bottom: [0, -0.3, 0.1] as V3,
		left: [-0.55, 0, 0.1] as V3
	};
	const d = {
		top: [0, 0.32, 1.35] as V3,
		right: [0.42, 0, 1.35] as V3,
		bottom: [0, -0.22, 1.35] as V3,
		left: [-0.42, 0, 1.35] as V3
	};

	// Nose cone: blue upper halves, white lower.
	blue.tri(nose, b.left, b.top);
	blue.tri(nose, b.top, b.right);
	white.tri(nose, b.right, b.bottom);
	white.tri(nose, b.bottom, b.left);

	// Front-mid section: blue continues along the top.
	blue.quad(b.top, b.right, c.right, c.top);
	blue.quad(b.left, b.top, c.top, c.left);
	white.quad(b.right, b.bottom, c.bottom, c.right);
	white.quad(b.bottom, b.left, c.left, c.bottom);

	// Mid-tail section: all white.
	white.quad(c.top, c.right, d.right, d.top);
	white.quad(c.left, c.top, d.top, d.left);
	white.quad(c.right, c.bottom, d.bottom, d.right);
	white.quad(c.bottom, c.left, d.left, d.bottom);

	// Tail cap behind the ring (engine housing covers the middle).
	const tail: V3 = [0, 0.04, 1.45];
	dark.tri(d.top, d.right, tail);
	dark.tri(d.right, d.bottom, tail);
	dark.tri(d.bottom, d.left, tail);
	dark.tri(d.left, d.top, tail);

	// --- Canopy: navy wedge on top of the mid fuselage ---
	const cf = { l: [-0.17, 0.3, -0.6] as V3, r: [0.17, 0.3, -0.6] as V3 };
	const cb = { l: [-0.2, 0.36, 0.35] as V3, r: [0.2, 0.36, 0.35] as V3 };
	const ridgeF: V3 = [0, 0.6, -0.2];
	const ridgeB: V3 = [0, 0.52, 0.4];
	navy.tri(cf.l, cf.r, ridgeF);
	navy.quad(cf.r, cb.r, ridgeB, ridgeF);
	navy.quad(cb.l, cf.l, ridgeF, ridgeB);
	navy.tri(cb.r, cb.l, ridgeB);

	for (const s of [-1, 1]) {
		// --- Twin dorsal fins sweeping up and back in a V ---
		blue.tri([s * 0.14, 0.34, -0.05], [s * 0.2, 0.3, 1.05], [s * 1.0, 1.1, 1.2]);

		// --- Main wing: blue inner panel, white outer blade, with thickness ---
		const innerFront: V3 = [s * 0.32, -0.02, -0.7];
		const innerRear: V3 = [s * 0.45, -0.1, 1.15];
		const midFront: V3 = [s * 0.95, -0.17, -0.18];
		const midRear: V3 = [s * 1.0, -0.2, 1.18];
		const outerFront: V3 = [s * 2.55, -0.62, 0.3];
		const outerRear: V3 = [s * 2.75, -0.68, 1.25];
		blue.prism([innerFront, midFront, midRear, innerRear], 0.1);
		white.prism([midFront, outerFront, outerRear, midRear], 0.08);

		// Yellow wingtip blade.
		yellow.prism([outerFront, [s * 3.2, -0.74, 0.7], outerRear], 0.07);

		// G-diffuser fin hanging from the wingtip.
		dark.tri([s * 2.62, -0.64, 0.45], [s * 2.7, -0.66, 1.1], [s * 2.66, -1.15, 0.9]);
	}

	group.add(white.build(mat(WHITE, 18)));
	group.add(blue.build(mat(BLUE, 26)));
	group.add(navy.build(mat(NAVY, 60)));
	group.add(yellow.build(mat(YELLOW, 20)));
	group.add(dark.build(mat(DARK, 12)));

	// --- Engine housing + blue-white glow ---
	const engineGeo = new THREE.CylinderGeometry(0.3, 0.36, 0.45, 8);
	engineGeo.rotateX(Math.PI / 2);
	const engine = new THREE.Mesh(engineGeo, mat(DARK, 12));
	engine.position.set(0, 0.04, 1.5);
	group.add(engine);

	const glow = new THREE.Group();
	glow.position.set(0, 0.04, 1.76);
	glow.name = 'engineGlow';

	const core = new THREE.Mesh(
		new THREE.CircleGeometry(0.18, 12),
		new THREE.MeshBasicMaterial({ color: 0xcfe2ff })
	);
	glow.add(core);

	const halo = new THREE.Mesh(
		new THREE.CircleGeometry(0.36, 12),
		new THREE.MeshBasicMaterial({
			color: 0x6f9bff,
			transparent: true,
			opacity: 0.45,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		})
	);
	halo.position.z = 0.01;
	glow.add(halo);

	group.add(glow);
	return group;
}
