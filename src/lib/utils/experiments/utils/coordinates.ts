// utils/coords.ts
export interface Point { x: number; y: number; }
export interface CanvasSize {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
/**
 * Given a MouseEvent or TouchEvent on a <canvas>, returns coords
 * with (0, 0) at the center of the canvas. +x is right, +y is down.
 */
export function getCanvasCoords(
  e: MouseEvent | TouchEvent
): Point & CanvasSize {
  const canvas = (e.currentTarget ||
                  (e.target as any)) as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  
  let clientX: number, clientY: number;
  if ("touches" in e) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const x = clientX - rect.left  - rect.width  / 2;
  const y = clientY - rect.top   - rect.height / 2;
  return { x, y,    
    minX: -halfW,
    maxX:  halfW,
    minY: -halfH,
    maxY:  halfH, };
}

/**
 * Linearly maps `value` from [inMin, inMax] into [outMin, outMax].
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
       + outMin;
}
