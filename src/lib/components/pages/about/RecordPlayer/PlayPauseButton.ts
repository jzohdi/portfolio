import * as THREE from 'three';

export interface PlayPauseButtonOptions {
  x: number;
  y: number;
  z: number;
  size: number;
  height: number;
  raisedY: number;
  pressedY: number;
  initialPlaying?: boolean;
  onToggle?: (isPlaying: boolean) => void;
}

export function createPlayPauseButton({
  x,
  y,
  z,
  size,
  height,
  raisedY,
  pressedY,
  initialPlaying = true,
  onToggle
}: PlayPauseButtonOptions) {
  // Create button mesh
  const buttonGeometry = new THREE.BoxGeometry(size, height, size);
  const buttonMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.2,
    metalness: 0.8
  });
  const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
  button.position.set(x, initialPlaying ? pressedY : raisedY, z);

  // Play symbol
  const playShape = new THREE.Shape();
  playShape.moveTo(-0.1, -0.1);
  playShape.lineTo(0.1, 0);
  playShape.lineTo(-0.1, 0.1);
  playShape.lineTo(-0.1, -0.1);
  const playGeometry = new THREE.ShapeGeometry(playShape);
  const playMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1,
    metalness: 0.8,
    roughness: 0.2
  });
  const playSymbol = new THREE.Mesh(playGeometry, playMaterial);
  playSymbol.rotation.x = -Math.PI / 2;
  playSymbol.position.set(x, (initialPlaying ? pressedY : raisedY) + (height / 2) + 0.01, z);

  // Pause symbol
  const pauseGroup = new THREE.Group();
  const barGeometry = new THREE.BoxGeometry(0.06, 0.25, 0.02);
  const barMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1,
    metalness: 0.8,
    roughness: 0.2
  });
  const leftBar = new THREE.Mesh(barGeometry, barMaterial);
  leftBar.position.x = -0.06;
  const rightBar = new THREE.Mesh(barGeometry, barMaterial);
  rightBar.position.x = 0.06;
  pauseGroup.add(leftBar);
  pauseGroup.add(rightBar);
  pauseGroup.rotation.x = -Math.PI / 2;
  pauseGroup.position.set(x, (initialPlaying ? pressedY : raisedY) + (height / 2) + 0.01, z);

  // Set initial visibility
  playSymbol.visible = !initialPlaying;
  pauseGroup.visible = initialPlaying;

  // Toggle logic
  let isPlaying = initialPlaying;
  function toggle() {
    isPlaying = !isPlaying;
    button.position.y = isPlaying ? pressedY : raisedY;
    playSymbol.position.y = button.position.y + (height / 2) + 0.01;
    pauseGroup.position.y = button.position.y + (height / 2) + 0.01;
    playSymbol.visible = !isPlaying;
    pauseGroup.visible = isPlaying;
    if (onToggle) onToggle(isPlaying);
  }

  // Return all objects for scene management
  return {
    button,
    playSymbol,
    pauseGroup,
    toggle,
    get isPlaying() { return isPlaying; }
  };
} 