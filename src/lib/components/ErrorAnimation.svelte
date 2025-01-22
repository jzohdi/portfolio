<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { type Font, TextGeometry } from 'three/examples/jsm/Addons.js';
	import { FontLoader } from 'three/addons/loaders/FontLoader.js';

	let { message } = $props();

	let container: HTMLDivElement;

	let renderer: THREE.WebGLRenderer,
		scene: THREE.Scene,
		camera: THREE.PerspectiveCamera,
		particles: THREE.Points,
		particleGeometry: THREE.BufferGeometry,
		particleMaterial: THREE.PointsMaterial,
		animationId: number;

	// 3D Text Variables
	let textMesh: THREE.Mesh;
	let font: Font;

	onMount(() => {
		// Initialize scene
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x1e1e1e);

		// Initialize camera
		const width = container.clientWidth;
		const height = container.clientHeight;
		camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
		camera.position.z = 5;

		// Initialize renderer
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(width, height);
		container.appendChild(renderer.domElement);

		// Create particle geometry
		particleGeometry = new THREE.BufferGeometry();
		const particleCount = 500;
		const positions = new Float32Array(particleCount * 3);

		for (let i = 0; i < particleCount; i++) {
			positions[i * 3] = (Math.random() - 0.5) * 10;
			positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
			positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
		}

		particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		// Create particle material
		particleMaterial = new THREE.PointsMaterial({
			color: 0xff4c4c,
			size: 0.1,
			transparent: true,
			opacity: 0.7,
			depthWrite: false
		});

		// Create particles
		particles = new THREE.Points(particleGeometry, particleMaterial);
		scene.add(particles);

		// Add lighting (optional for better visuals)
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const pointLight = new THREE.PointLight(0xffffff, 1);
		pointLight.position.set(10, 10, 10);
		scene.add(pointLight);

		// Load Font and Create 3D Text
		const loader = new FontLoader();
		// https://github.com/mrdoob/three.js/blob/master/examples/fonts/helvetiker_regular.typeface.json
		loader.load('/fonts/helvetiker_regular.typeface.json', (loadedFont) => {
			font = loadedFont;
			create3DText(message, 0.5, 0.2);
		});

		// Handle window resize
		const handleResize = () => {
			const width = container.clientWidth;
			const height = container.clientHeight;
			renderer.setSize(width, height);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		};
		window.addEventListener('resize', handleResize);

		// Animation loop
		const animate = () => {
			animationId = requestAnimationFrame(animate);

			// Rotate the camera for a dynamic effect
			camera.position.x = Math.sin(Date.now() * 0.001) * 5;
			camera.position.z = Math.cos(Date.now() * 0.001) * 5;
			camera.lookAt(scene.position);

			// Update particles (optional: add more dynamic behavior)
			particles.rotation.y += 0.001;

			renderer.render(scene, camera);
		};
		animate();

		// Cleanup on destroy
		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', handleResize);
			renderer.dispose();
		};
	});

	/**
	 * Creates a 3D Text Mesh and adds it to the scene.
	 * @param message The text to display.
	 * @param size The size of the text.
	 * @param height The extrusion depth.
	 */
	function create3DText(message: string, size: number, height: number) {
		if (!font) return;

		const textGeometry = new TextGeometry(message, {
			font: font,
			size: size,
			height: height,
			depth: height,
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: 0.03,
			bevelSize: 0.02,
			bevelOffset: 0,
			bevelSegments: 5
		});

		textGeometry.center(); // Center the text

		const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		textMesh = new THREE.Mesh(textGeometry, textMaterial);
		textMesh.position.y = 0.5; // Position the text above the particles
		scene.add(textMesh);
	}
</script>

<div bind:this={container} class="animation-container"></div>

<style>
	.animation-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: calc(100vh - 60px);
		top: 60px;
		z-index: -1; /* Ensure it's behind other elements */
	}
</style>
