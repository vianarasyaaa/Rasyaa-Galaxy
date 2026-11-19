import * as THREE from 'three';

export interface PlanetTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createStarSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.18, 'rgba(255, 248, 232, 0.92)');
  grad.addColorStop(0.45, 'rgba(186, 226, 255, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createNebulaSmokeTexture(
  seed: number,
  innerRgba: string,
  midRgba: string
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(seed);

  ctx.clearRect(0, 0, size, size);

  // Soft overlapping organic puffs to evoke wispy cosmic nebula smoke
  for (let i = 0; i < 26; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = rand() * 58;
    const x = size * 0.5 + Math.cos(angle) * dist;
    const y = size * 0.5 + Math.sin(angle) * dist;
    const r = 42 + rand() * 68;

    const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
    grad.addColorStop(0, i % 2 === 0 ? innerRgba : midRgba);
    grad.addColorStop(0.55, midRgba.replace(/[\d.]+\)$/, '0.14)'));
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft outer vignette mask so edges never show hard quads
  ctx.globalCompositeOperation = 'destination-in';
  const mask = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5
  );
  mask.addColorStop(0, 'rgba(255,255,255,1)');
  mask.addColorStop(0.7, 'rgba(255,255,255,0.45)');
  mask.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createPlanetTextures(
  maxAnisotropy: number,
  seed = 101
): PlanetTextureSet {
  const width = 512;
  const height = 256;
  const rand = seededRandom(seed);

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  // Base oceanic / slate-indigo gradient bands
  const baseGrad = cCtx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0, '#1e3a5f');
  baseGrad.addColorStop(0.25, '#0f2947');
  baseGrad.addColorStop(0.5, '#0b3b5a');
  baseGrad.addColorStop(0.75, '#132b4f');
  baseGrad.addColorStop(1, '#1e3a5f');
  cCtx.fillStyle = baseGrad;
  cCtx.fillRect(0, 0, width, height);

  // Smooth specular oceans (dark roughness = shiny)
  rCtx.fillStyle = 'rgb(42, 42, 42)';
  rCtx.fillRect(0, 0, width, height);
  bCtx.fillStyle = 'rgb(70, 70, 70)';
  bCtx.fillRect(0, 0, width, height);

  // Continents / tectonic ridges with warm basalt & mineral copper highlights
  for (let i = 0; i < 65; i++) {
    const x = rand() * width;
    const y = 26 + rand() * (height - 52);
    const rx = 18 + rand() * 54;
    const ry = 10 + rand() * 26;
    const rot = (rand() - 0.5) * 0.8;

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(rot);
    const landGrad = cCtx.createRadialGradient(0, 0, 2, 0, 0, rx);
    landGrad.addColorStop(0, i % 3 === 0 ? '#c88a4b' : '#3a6278');
    landGrad.addColorStop(0.7, '#27465d');
    landGrad.addColorStop(1, 'rgba(39, 70, 93, 0)');
    cCtx.fillStyle = landGrad;
    cCtx.beginPath();
    cCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.restore();

    // Raised continents in bump map & rougher land in roughness map
    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(rot);
    const bGrad = bCtx.createRadialGradient(0, 0, 2, 0, 0, rx);
    bGrad.addColorStop(0, 'rgba(225, 225, 225, 0.9)');
    bGrad.addColorStop(1, 'rgba(100, 100, 100, 0)');
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.restore();

    rCtx.save();
    rCtx.translate(x, y);
    rCtx.rotate(rot);
    const rGrad = rCtx.createRadialGradient(0, 0, 2, 0, 0, rx);
    rGrad.addColorStop(0, 'rgba(215, 215, 215, 0.92)');
    rGrad.addColorStop(1, 'rgba(42, 42, 42, 0)');
    rCtx.fillStyle = rGrad;
    rCtx.beginPath();
    rCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.restore();
  }

  // Subtle city/tech grid veins on dark side & atmospheric cloud bands
  cCtx.strokeStyle = 'rgba(250, 204, 125, 0.25)';
  cCtx.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) {
    const y = 30 + rand() * (height - 60);
    cCtx.beginPath();
    cCtx.moveTo(0, y);
    cCtx.bezierCurveTo(
      width * 0.3,
      y + (rand() - 0.5) * 24,
      width * 0.7,
      y + (rand() - 0.5) * 24,
      width,
      y
    );
    cCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, roughnessMap };
}

export function createAsteroidBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(404);

  ctx.fillStyle = 'rgb(128, 128, 128)';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 85; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 4 + rand() * 20;
    const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, 'rgb(38, 38, 38)');
    grad.addColorStop(0.7, 'rgb(175, 175, 175)');
    grad.addColorStop(1, 'rgb(128, 128, 128)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBrushedMetalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(777);

  ctx.fillStyle = 'rgb(120, 120, 120)';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 2) {
    const v = Math.floor(95 + rand() * 70);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, size, 1);
  }

  // Technical etched grooves
  ctx.strokeStyle = 'rgb(45, 45, 45)';
  ctx.lineWidth = 2;
  for (let i = 32; i < size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createGasGiantTextures(
  maxAnisotropy: number,
  seed = 303,
  palette: [string, string, string, string] = ['#1e1b4b', '#7c3aed', '#f59e0b', '#38bdf8']
): PlanetTextureSet {
  const width = 512;
  const height = 256;
  const rand = seededRandom(seed);

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(0.28, palette[1]);
  grad.addColorStop(0.52, palette[2]);
  grad.addColorStop(0.76, palette[3]);
  grad.addColorStop(1, palette[0]);
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = 'rgb(120, 120, 120)';
  bCtx.fillRect(0, 0, width, height);
  rCtx.fillStyle = 'rgb(110, 110, 110)';
  rCtx.fillRect(0, 0, width, height);

  // Swirling atmospheric jet-stream bands
  for (let i = 0; i < 42; i++) {
    const y = rand() * height;
    const bandH = 3 + rand() * 14;
    cCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(10,14,32,0.22)';
    cCtx.fillRect(0, y, width, bandH);

    bCtx.fillStyle = i % 2 === 0 ? 'rgb(165,165,165)' : 'rgb(90,90,90)';
    bCtx.fillRect(0, y, width, bandH * 0.7);
  }

  // Great cyclonic storm vortices
  for (let i = 0; i < 6; i++) {
    const x = 40 + rand() * (width - 80);
    const y = 40 + rand() * (height - 80);
    const rx = 20 + rand() * 34;
    const ry = 10 + rand() * 16;
    const vortex = cCtx.createRadialGradient(x, y, 2, x, y, rx);
    vortex.addColorStop(0, palette[2]);
    vortex.addColorStop(0.6, 'rgba(255,255,255,0.28)');
    vortex.addColorStop(1, 'rgba(0,0,0,0)');
    cCtx.fillStyle = vortex;
    cCtx.beginPath();
    cCtx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    cCtx.fill();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, roughnessMap };
}

export function createVolcanicRockyTextures(
  maxAnisotropy: number,
  seed = 505
): PlanetTextureSet {
  const width = 512;
  const height = 256;
  const rand = seededRandom(seed);

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  cCtx.fillStyle = '#1f2430';
  cCtx.fillRect(0, 0, width, height);
  bCtx.fillStyle = 'rgb(110,110,110)';
  bCtx.fillRect(0, 0, width, height);
  rCtx.fillStyle = 'rgb(210,210,210)';
  rCtx.fillRect(0, 0, width, height);

  // Basalt plateaus & craters
  for (let i = 0; i < 95; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 6 + rand() * 24;
    const cGrad = cCtx.createRadialGradient(x, y, 1, x, y, r);
    cGrad.addColorStop(0, i % 4 === 0 ? '#7c2d12' : '#0f172a');
    cGrad.addColorStop(0.7, '#334155');
    cGrad.addColorStop(1, 'rgba(31,36,48,0)');
    cCtx.fillStyle = cGrad;
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();

    const bGrad = bCtx.createRadialGradient(x, y, 1, x, y, r);
    bGrad.addColorStop(0, 'rgb(30,30,30)');
    bGrad.addColorStop(0.75, 'rgb(215,215,215)');
    bGrad.addColorStop(1, 'rgb(110,110,110)');
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Glowing tectonic magma veins
  cCtx.strokeStyle = 'rgba(251, 146, 60, 0.72)';
  cCtx.lineWidth = 1.6;
  for (let i = 0; i < 22; i++) {
    const x = rand() * width;
    const y = rand() * height;
    cCtx.beginPath();
    cCtx.moveTo(x, y);
    cCtx.lineTo(x + (rand() - 0.5) * 90, y + (rand() - 0.5) * 55);
    cCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, roughnessMap };
}

export function createIceCrystalTextures(
  maxAnisotropy: number,
  seed = 707
): PlanetTextureSet {
  const width = 512;
  const height = 256;
  const rand = seededRandom(seed);

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  const baseGrad = cCtx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0, '#bae6fd');
  baseGrad.addColorStop(0.5, '#0284c7');
  baseGrad.addColorStop(1, '#e0f2fe');
  cCtx.fillStyle = baseGrad;
  cCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = 'rgb(128,128,128)';
  bCtx.fillRect(0, 0, width, height);
  rCtx.fillStyle = 'rgb(55,55,55)';
  rCtx.fillRect(0, 0, width, height);

  // Cryo fracture rifts across glassy ice crust
  cCtx.strokeStyle = 'rgba(224, 242, 254, 0.68)';
  bCtx.strokeStyle = 'rgb(220,220,220)';
  for (let i = 0; i < 40; i++) {
    const x1 = rand() * width;
    const y1 = rand() * height;
    const x2 = x1 + (rand() - 0.5) * 140;
    const y2 = y1 + (rand() - 0.5) * 70;
    cCtx.lineWidth = 1 + rand() * 2;
    cCtx.beginPath();
    cCtx.moveTo(x1, y1);
    cCtx.lineTo(x2, y2);
    cCtx.stroke();

    bCtx.lineWidth = 2;
    bCtx.beginPath();
    bCtx.moveTo(x1, y1);
    bCtx.lineTo(x2, y2);
    bCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, bumpMap, roughnessMap };
}
