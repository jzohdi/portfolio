<script lang="ts">
	import { getCtx, setupCanvas, toCanvas } from '$lib/utils/htmlpaint/htmlpaint';
	import {
		adjustSize,
		appendStylesAndLinks,
		createIframeWithHtml,
		parseIframe
	} from '$lib/utils/htmlpaint/htmlParser';
	import { onDestroy, onMount } from 'svelte';
	import {
		pan,
		pinch,
		type GestureCustomEvent,
		type PinchCustomEvent,
		type PanCustomEvent
	} from 'svelte-gestures';
	import { isMobileDevice } from '$lib/utils/window';

	let referrenceCanvas: HTMLCanvasElement | null = null;
	let threeCanvas: HTMLCanvasElement | null = $state(null);
	let scene: any;
	let camera: any;
	let renderer: any;
	let controls: any;
	let iframe: HTMLIFrameElement | null = $state(null);
	let appenedToHead: (HTMLLinkElement | HTMLStyleElement)[] = $state([]);
	let THREE: any;
	let OrbitControls: any;
	let mesh: any;
	
	// Mobile pan state
	let isPanning = false;
	let lastPanPosition = { x: 0, y: 0 };

	// Gesture parameters
	const panOptions = () => ({
		delay: 0,
		threshold: 10
	});

	async function initThreeJS() {
		if (!threeCanvas || !isMobileDevice()) return;

		// Dynamically import Three.js only on mobile
		if (!THREE) {
			THREE = await import('three');
			OrbitControls = (await import('three/addons/controls/OrbitControls.js')).OrbitControls;
		}

		// Setup scene
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x000000);

		// Setup camera
		const width = threeCanvas.clientWidth;
		const height = threeCanvas.clientHeight;
		camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
		camera.position.z = 5;
		camera.position.y = 0;
		camera.position.x = 0;
		camera.lookAt(0, 0, 0);

		// Setup renderer with improved settings
		renderer = new THREE.WebGLRenderer({ 
			canvas: threeCanvas, 
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance'
		});
		
		// Set pixel ratio for better resolution
		const pixelRatio = Math.min(window.devicePixelRatio, 2);
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(width, height, false);

		// Setup controls
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.screenSpacePanning = true;
		controls.enableRotate = false;
		controls.enableZoom = true;
		controls.minDistance = 1;
		controls.maxDistance = 50;
		controls.maxPolarAngle = Math.PI;
		controls.minPolarAngle = 0;
		controls.maxAzimuthAngle = Infinity;
		controls.minAzimuthAngle = -Infinity;
		controls.target.set(0, 0, 0);
		controls.update();

		// Disable controls on mobile since we'll handle it manually
		if (isMobileDevice()) {
			controls.enabled = false;
		}
	}

	function animate() {
		if (!isMobileDevice()) return;
		requestAnimationFrame(animate);
		controls.update();
		renderer.render(scene, camera);
	}

	onDestroy(() => {
		if (renderer) {
			renderer.dispose();
		}
		if (iframe) {
			try {
				document.body.removeChild(iframe);
				iframe = null;
			} catch (e) {
				console.log('no iframe to remove on destroy');
			}
		}
		if (appenedToHead.length > 0) {
			appenedToHead.forEach((tag) => {
				document.head.removeChild(tag);
			});
			appenedToHead = [];
		}
	});

	onMount(async () => {
		if (!isMobileDevice()) return;
		const results = await fetch('/files/resume.html');
		const htmlString = await results.text();
		iframe = await createIframeWithHtml(htmlString);
	});

	async function completeRenderResume(
		referrenceIframe: HTMLIFrameElement,
		threeCanvas: HTMLCanvasElement,
		didRetry?: boolean
	) {
		if (!isMobileDevice()) return;
		
		adjustSize(referrenceIframe);
		const tree = await parseIframe(referrenceIframe);
		if (appenedToHead.length === 0) {
			appenedToHead = await appendStylesAndLinks(tree.headElements);
		}
		const targetWidth = threeCanvas.getBoundingClientRect().width;
		const { canvas, ctx, targetHeight } = setupCanvas(tree, targetWidth);

		// Set canvas size with pixel ratio
		const pixelRatio = Math.min(window.devicePixelRatio, 2);
		threeCanvas.width = targetWidth * pixelRatio;
		threeCanvas.height = targetHeight * pixelRatio;
		threeCanvas.style.width = `${targetWidth}px`;
		threeCanvas.style.height = `${targetHeight}px`;

		toCanvas(ctx, tree);
		referrenceCanvas = canvas;

		// Initialize Three.js
		await initThreeJS();

		// Create texture from canvas with improved settings
		const texture = new THREE.CanvasTexture(canvas, THREE.UVMapping);
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
		texture.needsUpdate = true;
		texture.flipY = true;
		
		// Create a more interesting material with glow effect
		const material = new THREE.MeshBasicMaterial({ 
			map: texture,
			transparent: true,
			side: THREE.DoubleSide
		});

		// Add a subtle border glow effect
		const borderGeometry = new THREE.PlaneGeometry(5.1, 5.1 * (targetHeight / targetWidth));
		const borderMaterial = new THREE.MeshBasicMaterial({
			color: 0x4a9eff,
			transparent: true,
			opacity: 0.3,
			side: THREE.BackSide
		});
		const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
		borderMesh.position.z = -0.05;
		scene.add(borderMesh);

		const geometry = new THREE.PlaneGeometry(5, 5 * (targetHeight / targetWidth));
		mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = 0;
		scene.add(mesh);

		// Start animation loop
		animate();

		if (isMobileDevice() && !didRetry) {
			completeRenderResume(referrenceIframe, threeCanvas, true);
		}
	}

	$effect(() => {
		if (iframe && threeCanvas && isMobileDevice()) {
			completeRenderResume(iframe, threeCanvas);
		}
	});

	function handlePanStart(event: GestureCustomEvent) {
		if (!isMobileDevice()) return;
		isPanning = true;
		lastPanPosition = {
			x: event.detail.x,
			y: event.detail.y
		};
	}

	function handlePanMove(event: PanCustomEvent) {
		if (!isPanning || !camera || !threeCanvas || !isMobileDevice()) return;

		const deltaX = event.detail.x - lastPanPosition.x;
		const deltaY = event.detail.y - lastPanPosition.y;

		// Calculate pan sensitivity based on camera distance and canvas size
		const distance = camera.position.distanceTo(controls.target);
		const panSpeed = (distance * 0.001);
		
		// Convert screen movement to world movement
		const panX = -deltaX * panSpeed;
		const panY = deltaY * panSpeed;

		// Apply panning to both camera and target to maintain relative position
		const right = new THREE.Vector3();
		const up = new THREE.Vector3();
		
		camera.getWorldDirection(new THREE.Vector3());
		right.setFromMatrixColumn(camera.matrix, 0);
		up.setFromMatrixColumn(camera.matrix, 1);
		
		// Pan in screen space
		const panVector = new THREE.Vector3();
		panVector.addScaledVector(right, panX);
		panVector.addScaledVector(up, panY);
		
		camera.position.add(panVector);
		controls.target.add(panVector);
		
		lastPanPosition = {
			x: event.detail.x,
			y: event.detail.y
		};
		
		controls.update();
	}

	function handlePanEnd(event: GestureCustomEvent) {
		if (!isMobileDevice()) return;
		isPanning = false;
	}

	function handleWheel(event: WheelEvent) {
		if (!isMobileDevice()) return;
		event.preventDefault();
		
		// Calculate zoom factor based on wheel delta
		// deltaY is negative when scrolling up (zoom in) and positive when scrolling down (zoom out)
		const zoomFactor = 1 + (event.deltaY * -0.001); // Adjust sensitivity with the multiplier
		handleScale(zoomFactor);
	}

	function handlePinch(event: PinchCustomEvent) {
		if (!camera || !isMobileDevice()) return;
		
		// Invert the scale to fix the pinch direction
		const scale = event.detail.scale ? 1 / event.detail.scale : 1;
		handleScale(scale);
	}

	function handleScale(scale: number) {
		if (!isMobileDevice()) return;
		
		// Calculate zoom speed based on screen size
		const screenWidth = window.innerWidth;
		const baseZoomSpeed = 0.1;
		// Adjust zoom speed based on screen size - smaller screens get gentler zoom
		const zoomSpeed = baseZoomSpeed * (screenWidth / 375); // 375 is typical mobile width
		
		const newDistance = camera.position.distanceTo(controls.target) * scale;
		
		// Clamp zoom distance
		const clampedDistance = Math.max(
			controls.minDistance, 
			Math.min(controls.maxDistance, newDistance)
		);
		
		// Move camera closer/further from target
		const direction = new THREE.Vector3()
			.subVectors(camera.position, controls.target)
			.normalize();
		
		camera.position.copy(controls.target).addScaledVector(direction, clampedDistance);
		controls.update();
	}
</script>

{#if isMobileDevice()}
	<canvas
		class="block sm:hidden w-full rounded-md border-2 border-zinc-200 bg-black"
		bind:this={threeCanvas}
		use:pan={panOptions}
		use:pinch={() => ({})}
		onpandown={handlePanStart}
		onpan={handlePanMove}
		onpanup={handlePanEnd}
		onpinch={handlePinch}
		onwheel={handleWheel}
	></canvas>
{/if}