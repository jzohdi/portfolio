import * as THREE from 'three';

export interface SpeedSliderOptions {
  x: number;
  y: number;
  z: number;
  width: number;
  trackThickness?: number;
  knobRadius?: number;
  initialValue?: number; // 0 to 1
  onChange?: (value: number) => void;
}

export function createSpeedSlider({
  x,
  y,
  z,
  width,
  trackThickness = 0.06,
  knobRadius = 0.13,
  initialValue = 0.5,
  onChange
}: SpeedSliderOptions) {
  // Group for the slider
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Track
  const trackGeometry = new THREE.BoxGeometry(width, trackThickness, trackThickness);
  const trackMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.5
  });
  const track = new THREE.Mesh(trackGeometry, trackMaterial);
  group.add(track);

  // Tick marks (scale lines)
  const TICK_HEIGHT = trackThickness * 1.5;
  const TICK_DEPTH_LONG = trackThickness * 2.2;
  const TICK_DEPTH_SHORT = trackThickness * 1.1;
  const TICK_WIDTH = trackThickness * 0.18;
  const TICK_COLOR = 0xffffff;
  const TICK_DIVISIONS = 16; // 1/16th divisions
  for (let i = 0; i <= TICK_DIVISIONS; i++) {
    const frac = i / TICK_DIVISIONS;
    const x = (frac - 0.5) * width;
    // Long ticks at 0, 0.25, 0.5, 0.75, 1
    const isLong = (i === 0 || i === TICK_DIVISIONS || i === TICK_DIVISIONS / 2 || i === TICK_DIVISIONS / 4 || i === 3 * TICK_DIVISIONS / 4);
    const tickDepth = isLong ? TICK_DEPTH_LONG : TICK_DEPTH_SHORT;
    const tickGeometry = new THREE.BoxGeometry(TICK_WIDTH, TICK_HEIGHT, tickDepth);
    const tickMaterial = new THREE.MeshStandardMaterial({ color: TICK_COLOR });
    const tick = new THREE.Mesh(tickGeometry, tickMaterial);
    tick.position.set(x, 0, 0);
    group.add(tick);
  }

  // Knob
  const KNOB_WIDTH = trackThickness * 1.5;
  const KNOB_HEIGHT = trackThickness * 1.8;
  const KNOB_DEPTH = trackThickness * 2.5;
  const knobGeometry = new THREE.BoxGeometry(KNOB_WIDTH, KNOB_HEIGHT, KNOB_DEPTH);
  const knobMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.3,
    metalness: 0.7
  });
  const knob = new THREE.Mesh(knobGeometry, knobMaterial);
  group.add(knob);

  // Value and knob position
  let value = Math.max(0, Math.min(1, initialValue));
  function updateKnobPosition() {
    knob.position.x = (value - 0.5) * width;
    knob.position.y = 0;
    knob.position.z = 0;
  }
  updateKnobPosition();

  // Drag logic
  let dragging = false;
  function onPointerDown(ray: THREE.Ray, camera: THREE.Camera) {
    // Check if knob is hit
    const intersects = new THREE.Raycaster().intersectObject(knob, true);
    if (intersects.length > 0) {
      dragging = true;
      return true;
    }
    return false;
  }
  function onPointerMove(ray: THREE.Ray, camera: THREE.Camera, worldX: number) {
    if (!dragging) return;
    // Project worldX to slider local X
    const localX = Math.max(-width / 2, Math.min(width / 2, worldX - x));
    value = (localX / width) + 0.5;
    value = Math.max(0, Math.min(1, value));
    updateKnobPosition();
    if (onChange) onChange(value);
  }
  function onPointerUp() {
    dragging = false;
  }

  return {
    group,
    knob,
    track,
    get value() { return value; },
    setValue(newValue: number) {
      value = Math.max(0, Math.min(1, newValue));
      updateKnobPosition();
      if (onChange) onChange(value);
    },
    setKnobByWorldX(worldX: number) {
      // Convert worldX to local X
      const local = group.worldToLocal(new THREE.Vector3(worldX, 0, 0));
      // Clamp to slider width
      const clampedX = Math.max(-width / 2, Math.min(width / 2, local.x));
      value = (clampedX / width) + 0.5;
      updateKnobPosition();
      if (onChange) onChange(value);
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isDragging: () => dragging,
    getTrackPlane: () => {
      // The track is aligned with the X axis, so the plane is perpendicular to Y
      // Plane normal is (0, 1, 0) in local space, transform to world
      const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(group.quaternion);
      const point = group.getWorldPosition(new THREE.Vector3());
      return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point);
    }
  };
} 