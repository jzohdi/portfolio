import * as THREE from 'three';

/**
 * Star Fox style targeting reticle: four green corner brackets.
 * Rendered on top of everything (no depth test).
 */
export function createReticle(size: number): THREE.LineSegments {
	const h = size / 2;
	const c = size * 0.3; // corner arm length
	const positions: number[] = [];

	for (const sx of [-1, 1]) {
		for (const sy of [-1, 1]) {
			const x = sx * h;
			const y = sy * h;
			// vertical arm
			positions.push(x, y, 0, x, y - sy * c, 0);
			// horizontal arm
			positions.push(x, y, 0, x - sx * c, y, 0);
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	const mat = new THREE.LineBasicMaterial({
		color: 0x39ff5a,
		transparent: true,
		opacity: 0.9,
		depthTest: false
	});
	const reticle = new THREE.LineSegments(geo, mat);
	reticle.renderOrder = 999;
	return reticle;
}
