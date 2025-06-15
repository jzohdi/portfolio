import * as THREE from 'three';

export interface RecordLabelOptions {
  radius: number;
  height: number;
  vinylHeight: number;
  name: string;
  contactInfo: {
    location: string;
    email: string;
    github: string;
  };
}

export function createRecordLabel({
  radius,
  height,
  vinylHeight,
  name,
  contactInfo
}: RecordLabelOptions) {
  // Create canvas for label texture
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024;
  labelCanvas.height = 1024;
  const ctx = labelCanvas.getContext('2d');
  if (ctx) {
    // Fill background white
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);

    // Draw name in a bold, modern sans-serif font, centered lower
    ctx.save();
    ctx.font = 'bold 120px Arial Black, Impact, Montserrat, Arial, sans-serif';
    ctx.fillStyle = '#e63946';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.fillText(name, labelCanvas.width / 2, 250);
    ctx.restore();

    // Draw contact info in larger, clean font, centered lower, with color and line breaks
    ctx.save();
    ctx.font = 'bold 54px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 4;
    // Location
    ctx.fillStyle = '#222';
    ctx.fillText(contactInfo.location, labelCanvas.width / 2, labelCanvas.height / 2 + 80);
    // Email (red)
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 54px Arial, sans-serif';
    ctx.fillText(contactInfo.email, labelCanvas.width / 2, labelCanvas.height / 2 + 150);
    // GitHub (blue)
    ctx.fillStyle = '#000';
    ctx.font = 'bold 54px Arial, sans-serif';
    ctx.fillText(contactInfo.github, labelCanvas.width / 2, labelCanvas.height / 2 + 220);
    ctx.restore();

    // Draw "SIDE 1" centered below the name
    ctx.save();
    ctx.font = 'bold 70px Arial, sans-serif';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('SIDE 1', labelCanvas.width / 2, 400);
    ctx.restore();
  }
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.needsUpdate = true;
  const labelGeometry = new THREE.CylinderGeometry(radius, radius, height, 64);
  const labelMaterial = new THREE.MeshStandardMaterial({
    map: labelTexture,
    roughness: 0.5,
    metalness: 0.2
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.rotation.x = 0;
  label.position.y = (vinylHeight / 2) + (height / 2) - 0.002;
  return label;
} 