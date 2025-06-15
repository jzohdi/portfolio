<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { createPlayPauseButton } from './RecordPlayer/PlayPauseButton';
  import { createRecordLabel } from './RecordPlayer/RecordLabel';
  import { createSpeedSlider } from './RecordPlayer/SpeedSlider';

  // Constants for dimensions
  const PLAYER_SIZE = 5;
  const PLAYER_HEIGHT = 0.3;
  const VINYL_RADIUS = 2;
  const VINYL_HEIGHT = 0.05;
  const LABEL_RADIUS = 0.5;
  const LABEL_HEIGHT = 0.01;
  const BUTTON_SIZE = 0.4;
  const BUTTON_HEIGHT = 0.1;
  const BUTTON_EDGE_OFFSET = 0.6;
  const BUTTON_RAISED_Y = (PLAYER_HEIGHT / 2) + (BUTTON_HEIGHT / 2);
  const BUTTON_PRESSED_Y = BUTTON_RAISED_Y - 0.05;
  const VINYL_Y_OFFSET = (PLAYER_HEIGHT / 2) + (VINYL_HEIGHT / 2);
  const ARTWORK_OUTER_RADIUS = VINYL_RADIUS - 0.12;
  const ARTWORK_INNER_RADIUS = LABEL_RADIUS + 0.16;
  const ARTWORK_THICKNESS = 0.01;
  const ARTWORK_COLOR = 0xF8F8F2;
  const SLIDER_WIDTH = 1.1;
  const SLIDER_LEFT_GAP = 0.18; // Gap from left edge of player
  const SLIDER_BOTTOM_OFFSET = 0.18; // Gap from bottom edge of player
  const SLIDER_FRONT_GAP = 0.6; // Gap from front edge (same as play/pause button)
  const SLIDER_HEIGHT_ABOVE_BASE = -0.02; // Minimal height above the player base

  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let vinyl: THREE.Mesh;
  let player: THREE.Group;
  let playButtonObj: ReturnType<typeof createPlayPauseButton>;
  let speedSliderObj: ReturnType<typeof createSpeedSlider>;
  let isPlaying = true;
  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();
  let vinylSpeed = 0.01;
  let draggingSlider = false;
  let albumArtTexture: THREE.Texture | null = null;
  let container: HTMLDivElement;

  // Sides data
  const sides = [
    {
      label: 'SIDE 1',
      title: {
        name: 'J.P. Morgan',
        dates: '2022–2025',
        job: 'Lead Software Engineer'
      },
      lines: [
        'Scaled onboarding APIs from dozens to millions.',
        'Turned chaos into order: dashboards, virus scanning, and 99%+ success rates.'
      ]
    },
    {
      label: 'SIDE 2',
      title: {
        name: 'Nuage, Bordeaux',
        dates: '2020',
        job: 'Software Eng. Intern'
      },
      lines: [
        'Auto-generated admin dashboards from GraphQL. Demoed, taught, shipped.',
        'ooh la la, ah, oui oui!'
      ]
    },
    {
      label: 'SIDE 3',
      title: {
        name: 'DocuSign',
        dates: '2019',
        job: 'Software Eng. Intern'
      },
      lines: [
        'Built DocuSign–Microsoft Dynamics integration. POC became a real feature.',
        'Turned templates into magic docs.'
      ]
    },
    {
      label: 'SIDE 4',
      title: {
        name: 'Projects',
        dates: '2019–2024',
        job: 'Freelance & Fun'
      },
      lines: [
        'FOIAsearch: SEC doc search for investors. Automated alerts, happy users.',
        'Healing Connections: 10k+ therapy tool requests/month. Live support, open source.'
      ]
    },
    {
      label: 'SIDE 5',
      title: {
        name: 'Skills & School',
        dates: 'UMD 2018–2022',
        job: 'BS. Computer Science'
      },
      lines: [
        'Java, TypeScript, React, SQL, AWS, Python, GraphQL, and more.',
        'Major GPA: 3.8. I build things that work and make people smile.'
      ]
    }
  ];
  let currentSide = 0;
  let flipping = false;
  let artworkTop, artworkBottom, artworkTextureTop, artworkTextureBottom;
  let labelTop, labelBottom, labelTextureTop, labelTextureBottom;
  let isFlipped = false;

  function getWorldXFromEvent(event: MouseEvent) {
    // Convert mouse X to world X at y=0, z=0 plane
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    const y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    const vector = new THREE.Vector3(x, y, 0.5).unproject(camera);
    return vector.x;
  }

  function onMouseDown(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // Check play button
    const playIntersects = raycaster.intersectObject(playButtonObj.button, true);
    if (playIntersects.length > 0) {
      playButtonObj.toggle();
      isPlaying = playButtonObj.isPlaying;
      return;
    }
    // Check slider knob
    const sliderIntersects = raycaster.intersectObject(speedSliderObj.knob, true);
    if (sliderIntersects.length > 0) {
      draggingSlider = true;
      if (controls) controls.enabled = false;
      speedSliderObj.onPointerDown(raycaster.ray, camera);
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!draggingSlider) return;
    // Raycast from camera through mouse to slider's track plane
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    const y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    const mouseNDC = new THREE.Vector2(x, y);
    const raycaster3d = new THREE.Raycaster();
    raycaster3d.setFromCamera(mouseNDC, camera);
    const plane = speedSliderObj.getTrackPlane();
    const intersection = new THREE.Vector3();
    if (raycaster3d.ray.intersectPlane(plane, intersection)) {
      speedSliderObj.setKnobByWorldX(intersection.x);
    }
  }

  function onMouseUp() {
    if (draggingSlider && controls) controls.enabled = true; // Re-enable OrbitControls
    draggingSlider = false;
    speedSliderObj.onPointerUp();
  }

  function drawArtworkTexture(sideIdx) {
    const side = sides[sideIdx];
    const artworkCanvas = document.createElement('canvas');
    artworkCanvas.width = 2048;
    artworkCanvas.height = 2048;
    const actx = artworkCanvas.getContext('2d');
    if (actx) {
      // Set transparent background so underlying vinyl art shows through
      actx.clearRect(0, 0, artworkCanvas.width, artworkCanvas.height);
      actx.globalAlpha = 0.75; // Make the artwork ring semi-transparent
      actx.fillStyle = 'rgba(0,0,0,0.75)'; // Slightly transparent black
      actx.fillRect(0, 0, artworkCanvas.width, artworkCanvas.height);
      actx.globalAlpha = 1.0; // Restore for text
      actx.font = 'bold 38px Arial, sans-serif';
      actx.fillStyle = '#fff'; // White text
      actx.textAlign = 'center';
      actx.textBaseline = 'middle';

      // Convert radii to pixels
      const pxPerUnit = artworkCanvas.width / (VINYL_RADIUS * 2);
      const innerRadiusPx = ARTWORK_INNER_RADIUS * pxPerUnit;
      const outerRadiusPx = ARTWORK_OUTER_RADIUS * pxPerUnit;
      const ringMidRadiusPx = (innerRadiusPx + outerRadiusPx) / 2;
      const squareSize = (outerRadiusPx - innerRadiusPx) * 0.7;
      const centerX = artworkCanvas.width / 2;
      const centerY = artworkCanvas.height / 2;

      // First block is the title (name, dates, job), then the rest are lines
      const blocks = [
        [side.title.name, side.title.dates, side.title.job].filter(Boolean).join('\n'),
        ...side.lines.filter(line => line.trim() !== '')
      ];
      const N = blocks.length;
      for (let i = 0; i < N; i++) {
        const angle = (2 * Math.PI * i) / N - Math.PI / 2; // Start at top, go clockwise
        // Center of the square
        const x = Math.round(centerX + Math.cos(angle) * ringMidRadiusPx);
        const y = Math.round(centerY + Math.sin(angle) * ringMidRadiusPx);
        // Word wrap for this block
        function wrapBlockText(ctx, text, maxWidth) {
          // Support explicit newlines in the title block
          const paragraphs = text.split('\n');
          const lines = [];
          for (const para of paragraphs) {
            const words = para.split(' ');
            let line = '';
            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;
              if (testWidth > maxWidth && n > 0) {
                lines.push(line.trim());
                line = words[n] + ' ';
              } else {
                line = testLine;
              }
            }
            lines.push(line.trim());
          }
          return lines;
        }
        const blockLines = wrapBlockText(actx, blocks[i], squareSize * 0.92);
        // Draw each line centered in the square, stacked vertically
        const blockLineHeight = 38;
        const blockTotalHeight = blockLines.length * blockLineHeight;
        let blockY = -Math.floor(blockTotalHeight / 2) + blockLineHeight / 2;
        actx.save();
        actx.translate(x, y);
        // Do not rotate text for clarity
        for (const line of blockLines) {
          actx.fillStyle = '#fff'; // All text white
          actx.fillText(line, 0, Math.round(blockY), squareSize * 0.92);
          blockY += blockLineHeight;
        }
        actx.restore();
        actx.font = 'bold 32px Arial, sans-serif';
      }
    }
    return new THREE.CanvasTexture(artworkCanvas);
  }

  function drawLabelTexture(sideIdx) {
    const side = sides[sideIdx];
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 1024;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
      ctx.font = 'bold 90px Arial, sans-serif';
      ctx.fillStyle = '#e63946';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('JACOB ZOHDI', labelCanvas.width / 2, 220);
      ctx.font = 'bold 64px Arial, sans-serif';
      ctx.fillStyle = '#222';
      ctx.fillText(side.label, labelCanvas.width / 2, 350);
      ctx.font = 'bold 44px Arial, sans-serif';
      ctx.fillText('Brooklyn, NY', labelCanvas.width / 2, 470);
      ctx.fillText('jzohdi@gmail.com', labelCanvas.width / 2, 520);
      ctx.fillText('github.com/jzohdi', labelCanvas.width / 2, 570);
    }
    return new THREE.CanvasTexture(labelCanvas);
  }

  function updateArtworkTextures(current, next) {
    // If isFlipped is false: top = current, bottom = next
    // If isFlipped is true: top = next, bottom = current
    let topIdx, bottomIdx;
    if (!isFlipped) {
      topIdx = current;
      bottomIdx = (current + 1) % sides.length;
    } else {
      topIdx = (current + 1) % sides.length;
      bottomIdx = current;
    }
    // Update top
    const newTextureTop = drawArtworkTexture(topIdx);
    newTextureTop.needsUpdate = true;
    artworkTop.material.map = newTextureTop;
    artworkTop.material.needsUpdate = true;
    artworkTextureTop = newTextureTop;
    // Update bottom
    const newTextureBottom = drawArtworkTexture(bottomIdx);
    newTextureBottom.needsUpdate = true;
    artworkBottom.material.map = newTextureBottom;
    artworkBottom.material.needsUpdate = true;
    artworkTextureBottom = newTextureBottom;

    // Update label textures
    const newLabelTextureTop = drawLabelTexture(topIdx);
    newLabelTextureTop.needsUpdate = true;
    labelTop.material.map = newLabelTextureTop;
    labelTop.material.needsUpdate = true;
    labelTextureTop = newLabelTextureTop;
    const newLabelTextureBottom = drawLabelTexture(bottomIdx);
    newLabelTextureBottom.needsUpdate = true;
    labelBottom.material.map = newLabelTextureBottom;
    labelBottom.material.needsUpdate = true;
    labelTextureBottom = newLabelTextureBottom;
  }
  let lastFlipTime = 0;
  
  function flipVinyl() {
    if (flipping) return;
    const now = Date.now();
    if (now - lastFlipTime < 300) {
      lastFlipTime = 0;
    } else {
       lastFlipTime = now;
      return;
    }
    flipping = true;
    const vinylStartY = vinyl.position.y;
    const vinylStartRotX = vinyl.rotation.x;
    const liftY = vinylStartY + VINYL_RADIUS + 0.1;
    const flipRotX = vinylStartRotX + Math.PI;
    let t = 0;
    const duration = 0.7; // seconds
    const fps = 60;
    function animateFlip() {
      t += 1 / (duration * fps);
      if (t < 0.5) {
        // Lift up
        vinyl.position.y = vinylStartY + (liftY - vinylStartY) * (t / 0.5);
      } else if (t < 1) {
        // Flip and lower
        vinyl.position.y = liftY - (liftY - vinylStartY) * ((t - 0.5) / 0.5);
        vinyl.rotation.x = vinylStartRotX + Math.PI * ((t - 0.5) / 0.5);
      } else {
        vinyl.position.y = vinylStartY;
        vinyl.rotation.x = flipRotX;
        // Update side and flip state
        currentSide = (currentSide + 1) % sides.length;
        isFlipped = !isFlipped;
        updateArtworkTextures(currentSide, (currentSide + 1) % sides.length);
        flipping = false;
        return;
      }
      requestAnimationFrame(animateFlip);
    }
    animateFlip();
  }

  function resizeRendererToDisplaySize() {
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    resizeRendererToDisplaySize();

    // Controls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load album art texture for vinyl
    const loader = new THREE.TextureLoader();
    loader.load('/images/currents.jpg', (texture) => {
      albumArtTexture = texture;
      albumArtTexture.wrapS = THREE.RepeatWrapping;
      albumArtTexture.wrapT = THREE.RepeatWrapping;
      albumArtTexture.repeat.set(1, 1);
      if (vinyl) {
        vinyl.material.map = albumArtTexture;
        vinyl.material.color.set(0xffffff);
        vinyl.material.needsUpdate = true;
      }
    });

    // Create vinyl record
    const vinylGeometry = new THREE.CylinderGeometry(VINYL_RADIUS, VINYL_RADIUS, VINYL_HEIGHT, 64);
    const vinylMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.7,
      metalness: 0.3
    });
    vinyl = new THREE.Mesh(vinylGeometry, vinylMaterial);
    vinyl.rotation.x = 0;
    vinyl.position.y = VINYL_Y_OFFSET;

    // Create dual artwork rings (top and bottom)
    artworkTextureTop = drawArtworkTexture(currentSide);
    artworkTextureTop.needsUpdate = true;
    artworkTextureBottom = drawArtworkTexture((currentSide + 1) % sides.length);
    artworkTextureBottom.needsUpdate = true;
    const artworkGeometry = new THREE.RingGeometry(ARTWORK_INNER_RADIUS, ARTWORK_OUTER_RADIUS, 64);
    const artworkMaterialTop = new THREE.MeshStandardMaterial({
      map: artworkTextureTop,
      side: THREE.DoubleSide,
      transparent: true
    });
    const artworkMaterialBottom = new THREE.MeshStandardMaterial({
      map: artworkTextureBottom,
      side: THREE.DoubleSide,
      transparent: true
    });
    artworkTop = new THREE.Mesh(artworkGeometry, artworkMaterialTop);
    artworkTop.rotation.x = -Math.PI / 2;
    artworkTop.position.y = (VINYL_HEIGHT / 2) + 0.001;
    vinyl.add(artworkTop);
    artworkBottom = new THREE.Mesh(artworkGeometry, artworkMaterialBottom);
    artworkBottom.rotation.x = Math.PI / 2; // Flipped to bottom
    artworkBottom.position.y = -(VINYL_HEIGHT / 2) - 0.001;
    vinyl.add(artworkBottom);

    // Create dual record labels (top and bottom)
    labelTextureTop = drawLabelTexture(currentSide);
    labelTextureTop.needsUpdate = true;
    labelTextureBottom = drawLabelTexture((currentSide + 1) % sides.length);
    labelTextureBottom.needsUpdate = true;
    const labelGeometry = new THREE.CylinderGeometry(LABEL_RADIUS, LABEL_RADIUS, LABEL_HEIGHT, 64);
    const labelMaterialTop = new THREE.MeshStandardMaterial({
      map: labelTextureTop,
      roughness: 0.5,
      metalness: 0.2
    });
    const labelMaterialBottom = new THREE.MeshStandardMaterial({
      map: labelTextureBottom,
      roughness: 0.5,
      metalness: 0.2
    });
    labelTop = new THREE.Mesh(labelGeometry, labelMaterialTop);
    labelTop.rotation.x = 0;
    labelTop.position.y = (VINYL_HEIGHT / 2) + (LABEL_HEIGHT / 2) - 0.002;
    vinyl.add(labelTop);
    labelBottom = new THREE.Mesh(labelGeometry, labelMaterialBottom);
    labelBottom.rotation.x = Math.PI; // Flipped to bottom
    labelBottom.position.y = -(VINYL_HEIGHT / 2) - (LABEL_HEIGHT / 2) + 0.002;
    vinyl.add(labelBottom);

    // Create player base
    player = new THREE.Group();
    const baseGeometry = new THREE.BoxGeometry(PLAYER_SIZE, PLAYER_HEIGHT, PLAYER_SIZE);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xE63946,
      roughness: 0.3,
      metalness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    player.add(base);

    // Create play/pause button (bottom right)
    const buttonX = (PLAYER_SIZE / 2) - BUTTON_EDGE_OFFSET;
    const buttonZ = (PLAYER_SIZE / 2) - BUTTON_EDGE_OFFSET;
    playButtonObj = createPlayPauseButton({
      x: buttonX,
      y: BUTTON_RAISED_Y,
      z: buttonZ,
      size: BUTTON_SIZE,
      height: BUTTON_HEIGHT,
      raisedY: BUTTON_RAISED_Y,
      pressedY: BUTTON_PRESSED_Y,
      initialPlaying: isPlaying
    });
    player.add(playButtonObj.button);
    player.add(playButtonObj.playSymbol);
    player.add(playButtonObj.pauseGroup);
    // Add a point light specifically for the symbols
    const symbolLight = new THREE.PointLight(0xFFFFFF, 2, 1);
    symbolLight.position.set(buttonX, BUTTON_RAISED_Y + (BUTTON_HEIGHT / 2) + 0.11, buttonZ);
    player.add(symbolLight);

    // Create speed slider (bottom left)
    const sliderX = -(PLAYER_SIZE / 2) + SLIDER_LEFT_GAP + (SLIDER_WIDTH / 2);
    const sliderZ = (PLAYER_SIZE / 2) - SLIDER_FRONT_GAP;
    const sliderY = (PLAYER_HEIGHT / 2) + SLIDER_HEIGHT_ABOVE_BASE;
    speedSliderObj = createSpeedSlider({
      x: sliderX,
      y: sliderY,
      z: sliderZ,
      width: SLIDER_WIDTH,
      initialValue: 0.5,
      onChange: (val) => {
        // Map slider value (0-1) to speed (0.002 to 0.03)
        vinylSpeed = 0.002 + val * (0.05 - 0.002);
      }
    });
    player.add(speedSliderObj.group);

    // Add vinyl to player
    player.add(vinyl);
    scene.add(player);

    // Add mouse event listeners
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      resizeRendererToDisplaySize();
      if (isPlaying) {
        vinyl.rotation.y += vinylSpeed;
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Responsive: observe container size
    const resizeObserver = new ResizeObserver(() => {
      resizeRendererToDisplaySize();
    });
    if (container) resizeObserver.observe(container);
    window.addEventListener('resize', resizeRendererToDisplaySize);
    // Clean up observer on destroy
    onDestroy(() => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeRendererToDisplaySize);
    });

    // Add click event to vinyl for flipping
    vinyl.userData.isVinyl = true;
    canvas.addEventListener('click', (event) => {
      // Raycast to check if vinyl was clicked
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
      const y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
      const mouseNDC = new THREE.Vector2(x, y);
      const raycaster3d = new THREE.Raycaster();
      raycaster3d.setFromCamera(mouseNDC, camera);
      const intersects = raycaster3d.intersectObject(vinyl, true);
      if (intersects.length > 0 && !flipping) {
        flipVinyl();
      }
    });
  }

  onMount(() => {
    init();
  });
</script>

<div class="relative w-full h-[min(700px,65vw)]" bind:this={container}>
  <canvas
    bind:this={canvas}
    class="w-full h-full rounded-md border-2 border-zinc-200 bg-white"
  ></canvas>
</div>