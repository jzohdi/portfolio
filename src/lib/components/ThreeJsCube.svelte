<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

	// Receive the textureCanvas as a prop
	export let textureCanvas: HTMLCanvasElement;

	let container: HTMLDivElement | null = null;

	onMount(() => {
		if (!container) {
			return;
		}

		const aspectRatio = textureCanvas.width / textureCanvas.height;
		const targetWidth = container.getBoundingClientRect().width;

		container.style.height = targetWidth + 'px';
		container.style.width = targetWidth * aspectRatio + 'px';
		// === THREE.JS SETUP ===

		// Scene
		const scene = new THREE.Scene();

		// Camera
		const camera = new THREE.PerspectiveCamera(
			75,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);
		camera.position.z = 2.5;

		// Renderer
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		container.appendChild(renderer.domElement);

		// Controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true; // Smooth controls
		controls.dampingFactor = 0.05;
		controls.enablePan = true;
		controls.enableZoom = true;

		// === TEXTURE SETUP ===
		// Create a texture from the textureCanvas
		const texture = new THREE.CanvasTexture(textureCanvas);
		texture.needsUpdate = true; // Ensure the texture updates if the canvas changes

		// === MATERIALS CREATION ===

		// Create a white material for top and bottom
		const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

		// Create a textured material for the four sides
		const texturedMaterial = new THREE.MeshBasicMaterial({ map: texture });

		// Assign materials to each face of the prism
		// The order of materials in BoxGeometry is:
		// [Right, Left, Top, Bottom, Front, Back]
		const materials = [
			texturedMaterial, // Right
			texturedMaterial, // Left
			whiteMaterial, // Top
			whiteMaterial, // Bottom
			texturedMaterial, // Front
			texturedMaterial // Back
		];

		// === GEOMETRY CREATION ===

		// Define the dimensions of the prism
		const prismHeight = 2; // You can adjust this value as needed
		const prismWidth = prismHeight * aspectRatio;
		const prismDepth = prismWidth; // Fixed depth; adjust if needed

		// Create the rectangular prism geometry
		const geometry = new THREE.BoxGeometry(prismWidth, prismHeight, prismDepth);

		// Create the mesh with the geometry and materials
		const prism = new THREE.Mesh(geometry, materials);
		scene.add(prism);

		// === RESIZE HANDLING ===
		const handleResize = () => {
			if (!container) {
				return;
			}
			const width = container.clientWidth;
			const height = container.clientHeight;
			renderer.setSize(width, height);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		};

		window.addEventListener('resize', handleResize);

		// === ANIMATION LOOP ===
		const animate = () => {
			requestAnimationFrame(animate);

			// Optional: Rotate the prism automatically
			// prism.rotation.x += 0.005;
			// prism.rotation.y += 0.005;

			controls.update();
			renderer.render(scene, camera);
		};

		animate();

		// === CLEANUP ===
		return () => {
			window.removeEventListener('resize', handleResize);
			controls.dispose();
			renderer.dispose();
			scene.clear();
		};
	});
</script>

<div bind:this={container} class="three-container w-full"></div>

<style>
	/* Ensure the container takes the full size of its parent */
	.three-container {
		position: relative;
		/* Optional: Add a background color or other styles */
		background-color: #f0f0f0;
	}
</style>
