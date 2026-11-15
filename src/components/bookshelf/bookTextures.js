import * as THREE from 'three';

/**
 * Procedural Cover & Spine Texture Generator (Replicating complete-shelf)
 */

export function createFrontCoverTexture(book) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const foil = book.foilColor || '#d4af37';
  const coverBg = book.coverColor || '#1c2838';

  // Base Cover Surface Color
  ctx.fillStyle = coverBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle linen texture noise
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // Foil Outer Border
  ctx.strokeStyle = foil;
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

  // Top Volume Tag
  ctx.font = '700 28px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = foil;
  ctx.fillText(book.vol || 'VOL. I', canvas.width / 2, 130);

  // Divider Line
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 100, 155);
  ctx.lineTo(canvas.width / 2 + 100, 155);
  ctx.strokeStyle = foil;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Book Title (Serif Typography)
  ctx.font = '700 64px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = foil;

  const words = book.title.split(' ');
  if (words.length > 2) {
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
    ctx.fillText(line1, canvas.width / 2, 310);
    ctx.fillText(line2, canvas.width / 2, 385);
  } else {
    ctx.fillText(book.title, canvas.width / 2, 340);
  }

  // Subtitle
  ctx.font = '300 26px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText(book.subtitle || '', canvas.width / 2, 460);

  // Central Emblem (Diamond Motif)
  const cx = canvas.width / 2;
  const cy = 640;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 50);
  ctx.lineTo(cx + 50, cy);
  ctx.lineTo(cx, cy + 50);
  ctx.lineTo(cx - 50, cy);
  ctx.closePath();
  ctx.strokeStyle = foil;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fillStyle = foil;
  ctx.fill();

  // Taxonomy Badge
  ctx.font = '600 22px "Courier New", monospace';
  ctx.fillStyle = foil;
  ctx.fillText(book.taxonomy || '', canvas.width / 2, 910);

  // Author
  ctx.font = '400 28px "Times New Roman", Georgia, serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(`${book.author || 'K. Fraginal'} • ${book.year || '2025'}`, canvas.width / 2, 1040);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createSpineTexture(book) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const foil = book.foilColor || '#d4af37';
  const coverBg = book.coverColor || '#1c2838';

  // Base Cover Color
  ctx.fillStyle = coverBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Foil Horizontal Bands (Spine Ribs drawn on texture)
  ctx.fillStyle = foil;
  const bands = [60, 180, canvas.height - 180, canvas.height - 60];
  bands.forEach(y => {
    ctx.fillRect(0, y, canvas.width, 10);
    ctx.fillRect(0, y + 16, canvas.width, 3);
  });

  // Top Volume Tag
  ctx.font = '700 24px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(book.vol || 'VOL. I', canvas.width / 2, 130);

  // Vertical Title Text (Rotated 90deg)
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);

  ctx.font = '700 44px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = foil;
  ctx.fillText(book.title, 0, 12);
  ctx.restore();

  // Author at Spine Base
  ctx.font = '600 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('K. FRAGINAL', canvas.width / 2, canvas.height - 100);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createBackCoverTexture(book) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const foil = book.foilColor || '#d4af37';
  const coverBg = book.coverColor || '#1c2838';

  ctx.fillStyle = coverBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border Frame
  ctx.strokeStyle = foil;
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Center Seal
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '700 22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = foil;
  ctx.fillText('KF ARCHIVE', canvas.width / 2, canvas.height / 2 + 7);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createPaperEdgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.fillStyle = '#e5daaf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(100, 80, 60, 0.18)';
  ctx.lineWidth = 2;
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
