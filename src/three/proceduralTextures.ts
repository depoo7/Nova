import * as THREE from 'three';
import type { PlanetTextureKind } from '../types/game';

function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface PbrTextureBundle {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export function createSpaceSkyboxTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const rand = pseudoRandom(909);

  // Rich cosmic void gradient (deep abyssal obsidian-navy)
  const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0, '#010308');
  baseGrad.addColorStop(0.35, '#030712');
  baseGrad.addColorStop(0.5, '#060c1d');
  baseGrad.addColorStop(0.65, '#030712');
  baseGrad.addColorStop(1, '#010206');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle Galactic Milky Way & Cosmic Dust Band (deep & realistic, never neon)
  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.rotate(-0.3);

  for (let i = 0; i < 65; i++) {
    const x = (rand() - 0.5) * width * 1.15;
    const y = (rand() - 0.5) * 230;
    const rx = 90 + rand() * 220;
    const ry = 20 + rand() * 64;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, rx);
    if (i % 4 === 0) {
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.055)');
      grad.addColorStop(0.45, 'rgba(29, 78, 216, 0.025)');
    } else if (i % 4 === 1) {
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.038)');
      grad.addColorStop(0.45, 'rgba(154, 52, 18, 0.018)');
    } else if (i % 4 === 2) {
      grad.addColorStop(0, 'rgba(148, 163, 184, 0.045)');
      grad.addColorStop(0.45, 'rgba(51, 65, 85, 0.02)');
    } else {
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.032)');
      grad.addColorStop(0.45, 'rgba(30, 41, 59, 0.015)');
    }
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (rand() - 0.5) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark cosmic dust rift ribbons along Milky Way spine
  for (let i = 0; i < 24; i++) {
    const x = (rand() - 0.5) * width;
    const y = (rand() - 0.5) * 70;
    const rx = 80 + rand() * 160;
    const ry = 10 + rand() * 26;
    const darkGrad = ctx.createRadialGradient(x, y, 1, x, y, rx);
    darkGrad.addColorStop(0, 'rgba(1, 3, 9, 0.62)');
    darkGrad.addColorStop(1, 'rgba(1, 3, 9, 0)');
    ctx.fillStyle = darkGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (rand() - 0.5) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Crisp multi-magnitude stars (clean pinpoint realism)
  for (let i = 0; i < 1650; i++) {
    const sx = rand() * width;
    const sy = rand() * height;
    const isBright = rand() < 0.025;
    const r = isBright ? 1.25 + rand() * 0.6 : 0.4 + rand() * 0.65;
    const alpha = isBright ? 0.72 + rand() * 0.18 : 0.16 + rand() * 0.48;
    const tint =
      i % 7 === 0
        ? `rgba(186, 230, 253, ${alpha})`
        : i % 11 === 0
          ? `rgba(253, 230, 138, ${alpha})`
          : i % 17 === 0
            ? `rgba(254, 202, 202, ${alpha})`
            : `rgba(255, 255, 255, ${alpha})`;

    if (isBright) {
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.0);
      halo.addColorStop(0, tint);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 3.0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBrushedMetalTexture(baseHex = '#1e293b'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = pseudoRandom(442);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Fine horizontal brushed grain
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.055)';
    ctx.fillRect(0, rand() * size, size, 1);
  }

  // Aerospace plating panel grid + corner rivets
  ctx.strokeStyle = 'rgba(0,0,0,0.34)';
  ctx.lineWidth = 2;
  for (let p = 0; p < size; p += 128) {
    ctx.strokeRect(p + 1, 1, 126, size - 2);
    ctx.strokeRect(1, p + 1, size - 2, 126);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = 10; x < size; x += 128) {
    for (let y = 10; y < size; y += 128) {
      ctx.fillRect(x, y, 3, 3);
      ctx.fillRect(x + 106, y, 3, 3);
      ctx.fillRect(x, y + 106, 3, 3);
      ctx.fillRect(x + 106, y + 106, 3, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createAerospaceHullTextures(
  baseHex = '#e2e8f0',
  maxAnisotropy = 4
): PbrTextureBundle {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = roughCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;
  const rand = pseudoRandom(519);

  cCtx.fillStyle = baseHex;
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  // Matte aerospace ceramic & coated alloy roughness baseline (eliminates plastic sheen)
  rCtx.fillStyle = '#cfcfcf';
  rCtx.fillRect(0, 0, size, size);

  // Smooth macro aerospace panel tone variation + subtle corner registration ticks (Photo 1 inspo)
  const step = 128;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const shade = Math.round((rand() - 0.5) * 9);
      cCtx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade / 255})` : `rgba(0,0,0,${-shade / 255})`;
      cCtx.fillRect(x + 2, y + 2, step - 4, step - 4);

      const roughVal = 204 + Math.round(rand() * 34);
      rCtx.fillStyle = `rgb(${roughVal},${roughVal},${roughVal})`;
      rCtx.fillRect(x + 2, y + 2, step - 4, step - 4);

      const bumpVal = 128 + Math.round((rand() - 0.5) * 7);
      bCtx.fillStyle = `rgb(${bumpVal},${bumpVal},${bumpVal})`;
      bCtx.fillRect(x + 2, y + 2, step - 4, step - 4);

      // Subtle muted technical panel stencil corner ticks
      cCtx.strokeStyle = 'rgba(100, 116, 139, 0.22)';
      cCtx.lineWidth = 1;
      cCtx.strokeRect(x + 8, y + 8, 10, 10);
    }
  }

  // Subtle matte thermal-coating grain
  for (let i = 0; i < 650; i++) {
    cCtx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.014)' : 'rgba(0,0,0,0.024)';
    cCtx.fillRect(0, rand() * size, size, 1);
  }

  // Clean hairline panel seams
  for (let p = 0; p < size; p += step) {
    cCtx.strokeStyle = 'rgba(0,0,0,0.16)';
    cCtx.lineWidth = 1.5;
    cCtx.beginPath();
    cCtx.moveTo(p, 0);
    cCtx.lineTo(p, size);
    cCtx.moveTo(0, p);
    cCtx.lineTo(size, p);
    cCtx.stroke();

    bCtx.strokeStyle = '#626262';
    bCtx.lineWidth = 1.5;
    bCtx.beginPath();
    bCtx.moveTo(p, 0);
    bCtx.lineTo(p, size);
    bCtx.moveTo(0, p);
    bCtx.lineTo(size, p);
    bCtx.stroke();

    rCtx.strokeStyle = '#e0e0e0';
    rCtx.lineWidth = 1.5;
    rCtx.beginPath();
    rCtx.moveTo(p, 0);
    rCtx.lineTo(p, size);
    rCtx.moveTo(0, p);
    rCtx.lineTo(size, p);
    rCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  [map, bumpMap, roughnessMap].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAnisotropy;
  });

  return { map, bumpMap, roughnessMap };
}

export function createEvaSuitTextures(maxAnisotropy = 4): PbrTextureBundle {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = roughCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;
  const rand = pseudoRandom(814);

  // Neutral white-grey base so suitMat.color tints cleanly without muddy buildup
  cCtx.fillStyle = '#eceff3';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#dedede';
  rCtx.fillRect(0, 0, size, size);

  // Fine woven Ortho-Fabric / Beta-Cloth crosshatch + pressure-suit seam ribs (Photo 4)
  cCtx.strokeStyle = 'rgba(30, 41, 59, 0.05)';
  bCtx.strokeStyle = '#737373';
  cCtx.lineWidth = 1;
  bCtx.lineWidth = 1;
  for (let i = 0; i < size; i += 8) {
    cCtx.beginPath();
    cCtx.moveTo(i, 0);
    cCtx.lineTo(i, size);
    cCtx.moveTo(0, i);
    cCtx.lineTo(size, i);
    cCtx.stroke();
  }

  // Horizontal pressure-bellow folds & thermal-blanket quilting lines
  for (let y = 24; y < size; y += 36) {
    cCtx.fillStyle = 'rgba(15, 23, 42, 0.06)';
    cCtx.fillRect(0, y, size, 4);
    cCtx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    cCtx.fillRect(0, y + 4, size, 3);

    bCtx.fillStyle = '#5c5c5c';
    bCtx.fillRect(0, y, size, 4);
    bCtx.fillStyle = '#9c9c9c';
    bCtx.fillRect(0, y + 4, size, 3);
  }

  // Subtle fabric micro-creases & surface wear
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 8 + rand() * 28;
    cCtx.strokeStyle = rand() > 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)';
    cCtx.beginPath();
    cCtx.moveTo(x, y);
    cCtx.lineTo(x + len, y + (rand() - 0.5) * 8);
    cCtx.stroke();
  }

  // Vertical seam stitching
  [128, 384].forEach((sx) => {
    cCtx.strokeStyle = 'rgba(51, 65, 85, 0.22)';
    cCtx.lineWidth = 2;
    cCtx.setLineDash([5, 4]);
    cCtx.beginPath();
    cCtx.moveTo(sx, 0);
    cCtx.lineTo(sx, size);
    cCtx.stroke();
    cCtx.setLineDash([]);
  });

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  [map, bumpMap, roughnessMap].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAnisotropy;
  });
  return { map, bumpMap, roughnessMap };
}

export function createArmorShellTextures(maxAnisotropy = 4): PbrTextureBundle {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = roughCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;
  const rand = pseudoRandom(927);

  // Clean ceramic-composite base
  cCtx.fillStyle = '#f2f4f7';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#9a9a9a';
  rCtx.fillRect(0, 0, size, size);

  // Subtle composite micro-grain
  for (let i = 0; i < 650; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 4 + rand() * 22;
    const h = 1 + rand() * 3;
    cCtx.fillStyle = rand() > 0.5 ? 'rgba(30,41,59,0.032)' : 'rgba(255,255,255,0.08)';
    cCtx.fillRect(x, y, w, h);
    rCtx.fillStyle = rand() > 0.5 ? '#ababab' : '#858585';
    rCtx.fillRect(x, y, w, h);
  }

  // Molded armor panel seam lines + bevel highlights
  const panels = [
    [16, 16, 224, 224],
    [256, 16, 240, 224],
    [16, 256, 224, 240],
    [256, 256, 240, 240],
  ];
  for (const [px, py, pw, ph] of panels) {
    cCtx.strokeStyle = 'rgba(30, 41, 59, 0.24)';
    cCtx.lineWidth = 2.5;
    cCtx.strokeRect(px, py, pw, ph);

    cCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    cCtx.lineWidth = 1.2;
    cCtx.strokeRect(px + 2, py + 2, pw - 4, ph - 4);

    bCtx.strokeStyle = '#383838';
    bCtx.lineWidth = 3;
    bCtx.strokeRect(px, py, pw, ph);

    // Corner micro-rivets
    const offsets = [
      [px + 12, py + 12],
      [px + pw - 12, py + 12],
      [px + 12, py + ph - 12],
      [px + pw - 12, py + ph - 12],
    ];
    for (const [rx, ry] of offsets) {
      cCtx.fillStyle = 'rgba(51, 65, 85, 0.36)';
      cCtx.beginPath();
      cCtx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      cCtx.fill();

      bCtx.fillStyle = '#c8c8c8';
      bCtx.beginPath();
      bCtx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  // Light realistic edge-scuff marks near seams
  for (let i = 0; i < 110; i++) {
    const x = rand() * size;
    const y = rand() * size;
    cCtx.strokeStyle = 'rgba(51, 65, 85, 0.08)';
    cCtx.lineWidth = 1 + rand() * 1.5;
    cCtx.beginPath();
    cCtx.moveTo(x, y);
    cCtx.lineTo(x + (rand() - 0.5) * 18, y + (rand() - 0.5) * 10);
    cCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  [map, bumpMap, roughnessMap].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAnisotropy;
  });
  return { map, bumpMap, roughnessMap };
}

export function createHairStrandTextures(maxAnisotropy = 4): PbrTextureBundle {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = roughCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;
  const rand = pseudoRandom(318);

  cCtx.fillStyle = '#231814';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#8e8e8e';
  rCtx.fillRect(0, 0, size, size);

  // Fine directional combed hair fibers
  for (let i = 0; i < 680; i++) {
    const x = rand() * size;
    const w = 0.8 + rand() * 1.8;
    const tone = rand();
    cCtx.fillStyle =
      tone > 0.78
        ? 'rgba(84, 58, 44, 0.42)'
        : tone > 0.38
          ? 'rgba(46, 31, 25, 0.55)'
          : 'rgba(18, 12, 10, 0.65)';
    cCtx.fillRect(x, 0, w, size);

    const bVal = Math.round(92 + tone * 72);
    bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
    bCtx.fillRect(x, 0, w, size);
  }

  // Soft anisotropic silk sheen band across mid-strand
  const sheenGrad = cCtx.createLinearGradient(0, 0, 0, size);
  sheenGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
  sheenGrad.addColorStop(0.42, 'rgba(120,86,66,0.16)');
  sheenGrad.addColorStop(0.55, 'rgba(145,108,85,0.22)');
  sheenGrad.addColorStop(1, 'rgba(0,0,0,0.20)');
  cCtx.fillStyle = sheenGrad;
  cCtx.fillRect(0, 0, size, size);

  const roughBand = rCtx.createLinearGradient(0, 0, 0, size);
  roughBand.addColorStop(0, '#a6a6a6');
  roughBand.addColorStop(0.5, '#666666');
  roughBand.addColorStop(1, '#a6a6a6');
  rCtx.fillStyle = roughBand;
  rCtx.fillRect(0, 0, size, size);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  [map, bumpMap, roughnessMap].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAnisotropy;
  });
  return { map, bumpMap, roughnessMap };
}

export function createAfroCurlTextures(maxAnisotropy = 4): PbrTextureBundle {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = roughCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;
  const rand = pseudoRandom(559);

  cCtx.fillStyle = '#140f0d';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#484848';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#d4d4d4';
  rCtx.fillRect(0, 0, size, size);

  // Seamless tiled tight afro curl rings & micro-coils
  for (let i = 0; i < 1600; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const rad = 2.2 + rand() * 3.8;
    const a0 = rand() * Math.PI * 2;
    const span = Math.PI * (1.1 + rand() * 0.8);
    const bright = rand();

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const px = cx + ox * size;
        const py = cy + oy * size;
        if (px + rad < 0 || px - rad > size || py + rad < 0 || py - rad > size) continue;

        cCtx.strokeStyle =
          bright > 0.72
            ? 'rgba(58, 43, 35, 0.75)'
            : bright > 0.3
              ? 'rgba(34, 24, 20, 0.85)'
              : 'rgba(14, 10, 9, 0.9)';
        cCtx.lineWidth = 1.4 + rand() * 1.1;
        cCtx.beginPath();
        cCtx.arc(px, py, rad, a0, a0 + span);
        cCtx.stroke();

        const bVal = Math.round(135 + bright * 110);
        bCtx.strokeStyle = `rgb(${bVal},${bVal},${bVal})`;
        bCtx.lineWidth = 1.6 + rand();
        bCtx.beginPath();
        bCtx.arc(px, py, rad, a0, a0 + span);
        bCtx.stroke();
      }
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  [map, bumpMap, roughnessMap].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    t.anisotropy = maxAnisotropy;
  });
  return { map, bumpMap, roughnessMap };
}

export function createEyeIrisTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const rand = pseudoRandom(612);

  // Outer limbal ring
  const bg = ctx.createRadialGradient(cx, cy, 8, cx, cy, cx);
  bg.addColorStop(0, '#16110e');
  bg.addColorStop(0.32, '#5a3d2a');
  bg.addColorStop(0.74, '#3d2a1e');
  bg.addColorStop(0.92, '#1d1614');
  bg.addColorStop(1, '#14171c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Radial iris stroma fibers
  for (let i = 0; i < 96; i++) {
    const angle = (i / 96) * Math.PI * 2 + (rand() - 0.5) * 0.04;
    const r0 = 16 + rand() * 8;
    const r1 = 44 + rand() * 14;
    ctx.strokeStyle =
      i % 3 === 0 ? 'rgba(164, 122, 82, 0.42)' : 'rgba(92, 62, 42, 0.48)';
    ctx.lineWidth = 1.2 + rand() * 1.1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
    ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.stroke();
  }

  // Soft natural upper specular catchlight dot
  const catchlight = ctx.createRadialGradient(cx - 14, cy - 16, 1, cx - 14, cy - 16, 10);
  catchlight.addColorStop(0, 'rgba(255,255,255,0.85)');
  catchlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = catchlight;
  ctx.beginPath();
  ctx.arc(cx - 14, cy - 16, 10, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRealisticFaceTextures(
  gender: 'male' | 'female',
  maxAnisotropy = 4
): PbrTextureBundle {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = roughCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;
  const rand = pseudoRandom(gender === 'male' ? 401 : 709);

  // Base warm realistic human skin tone
  const baseSkin = gender === 'male' ? '#cfa084' : '#ddb399';
  cCtx.fillStyle = baseSkin;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Skin roughness base (T-zone slightly smoother, cheeks satin-matte)
  rCtx.fillStyle = gender === 'male' ? '#9e9e9e' : '#909090';
  rCtx.fillRect(0, 0, size, size);

  // Multi-zone skin tonal variation (forehead, cheeks, nose, jaw)
  const foreheadGrad = cCtx.createRadialGradient(256, 175, 10, 256, 175, 85);
  foreheadGrad.addColorStop(0, 'rgba(232, 184, 155, 0.36)');
  foreheadGrad.addColorStop(1, 'rgba(207, 160, 132, 0)');
  cCtx.fillStyle = foreheadGrad;
  cCtx.fillRect(150, 90, 212, 160);

  // Natural cheek warmth & cheekbone glow
  [-48, 48].forEach((dx) => {
    const cheekGrad = cCtx.createRadialGradient(256 + dx, 282, 4, 256 + dx, 282, 42);
    cheekGrad.addColorStop(
      0,
      gender === 'female' ? 'rgba(218, 122, 118, 0.38)' : 'rgba(196, 122, 106, 0.22)'
    );
    cheekGrad.addColorStop(1, 'rgba(207, 160, 132, 0)');
    cCtx.fillStyle = cheekGrad;
    cCtx.fillRect(180, 232, 152, 112);

    if (gender === 'female') {
      // Subtle cheekbone specular sheen
      const cheekGlow = rCtx.createRadialGradient(256 + dx, 268, 2, 256 + dx, 268, 22);
      cheekGlow.addColorStop(0, '#6a6a6a');
      cheekGlow.addColorStop(1, 'rgba(144,144,144,0)');
      rCtx.fillStyle = cheekGlow;
      rCtx.fillRect(256 + dx - 24, 244, 48, 48);
    }
  });

  // Subtle nose bridge highlight & T-zone lower roughness
  const noseHighlight = cCtx.createLinearGradient(248, 225, 264, 290);
  noseHighlight.addColorStop(0, 'rgba(255, 234, 218, 0.28)');
  noseHighlight.addColorStop(1, 'rgba(255, 234, 218, 0)');
  cCtx.fillStyle = noseHighlight;
  cCtx.fillRect(244, 220, 24, 72);

  if (gender === 'female') {
    // Soft warm rose hint on nose tip & subtle sun-kissed freckles
    const noseTipBlush = cCtx.createRadialGradient(256, 284, 2, 256, 284, 16);
    noseTipBlush.addColorStop(0, 'rgba(214, 128, 120, 0.22)');
    noseTipBlush.addColorStop(1, 'rgba(214, 128, 120, 0)');
    cCtx.fillStyle = noseTipBlush;
    cCtx.fillRect(238, 266, 36, 36);

    for (let i = 0; i < 48; i++) {
      const fx = 212 + rand() * 88;
      const fy = 262 + rand() * 28;
      cCtx.fillStyle = `rgba(146, 94, 72, ${0.14 + rand() * 0.14})`;
      cCtx.beginPath();
      cCtx.arc(fx, fy, 0.7 + rand() * 0.8, 0, Math.PI * 2);
      cCtx.fill();
    }
  }

  const tZoneRough = rCtx.createRadialGradient(256, 240, 8, 256, 240, 75);
  tZoneRough.addColorStop(0, '#707070');
  tZoneRough.addColorStop(1, 'rgba(150,150,150,0)');
  rCtx.fillStyle = tZoneRough;
  rCtx.fillRect(175, 160, 162, 170);

  // Soft eye socket ambient occlusion + natural eyelid crease & lash definition
  [-31, 31].forEach((dx) => {
    const sign = dx < 0 ? -1 : 1;
    const sockGrad = cCtx.createRadialGradient(256 + dx, 232, 6, 256 + dx, 232, 26);
    sockGrad.addColorStop(
      0,
      gender === 'female' ? 'rgba(122, 80, 68, 0.28)' : 'rgba(105, 68, 56, 0.32)'
    );
    sockGrad.addColorStop(0.6, 'rgba(135, 92, 76, 0.14)');
    sockGrad.addColorStop(1, 'rgba(207, 160, 132, 0)');
    cCtx.fillStyle = sockGrad;
    cCtx.fillRect(256 + dx - 28, 204, 56, 56);

    if (gender === 'female') {
      // Soft natural warm-bronze lid crease shading
      cCtx.strokeStyle = 'rgba(116, 72, 60, 0.34)';
      cCtx.lineWidth = 2.6;
      cCtx.beginPath();
      cCtx.ellipse(256 + dx, 229, 13, 6.5, sign * 0.08, Math.PI * 1.1, Math.PI * 1.9);
      cCtx.stroke();
    }

    // Expressive lash-line accent & delicate outer-corner lash wing
    cCtx.strokeStyle = gender === 'female' ? 'rgba(28, 20, 18, 0.78)' : 'rgba(48, 36, 30, 0.42)';
    cCtx.lineWidth = gender === 'female' ? 2.6 : 1.6;
    cCtx.beginPath();
    cCtx.ellipse(256 + dx, 231, 12, 5, 0, Math.PI * 1.05, Math.PI * 1.95);
    cCtx.stroke();

    if (gender === 'female') {
      cCtx.lineWidth = 1.4;
      cCtx.beginPath();
      cCtx.moveTo(256 + dx + sign * 11, 230);
      cCtx.lineTo(256 + dx + sign * 15, 226.5);
      cCtx.stroke();

      // Subtle lower-lid soft definition
      cCtx.strokeStyle = 'rgba(90, 58, 48, 0.28)';
      cCtx.lineWidth = 1.1;
      cCtx.beginPath();
      cCtx.ellipse(256 + dx, 233, 10, 4, 0, Math.PI * 0.15, Math.PI * 0.85);
      cCtx.stroke();
    }
  });

  // Natural feathered eyebrows baked onto face skin + subtle bump
  [-31, 31].forEach((dx) => {
    const sign = dx < 0 ? -1 : 1;
    cCtx.save();
    cCtx.strokeStyle = gender === 'male' ? 'rgba(36, 26, 22, 0.85)' : 'rgba(44, 28, 22, 0.82)';
    cCtx.lineWidth = gender === 'male' ? 4.2 : 2.5;
    cCtx.lineCap = 'round';
    cCtx.beginPath();
    if (gender === 'female') {
      // Gracefully arched tapered female brow
      cCtx.moveTo(256 + dx - sign * 12, 214);
      cCtx.quadraticCurveTo(256 + dx + sign * 2, 205.5, 256 + dx + sign * 14, 211.5);
    } else {
      cCtx.moveTo(256 + dx - sign * 12, 214);
      cCtx.quadraticCurveTo(256 + dx, 208, 256 + dx + sign * 13, 212);
    }
    cCtx.stroke();

    // Fine hair strokes along brow
    cCtx.lineWidth = 1.05;
    for (let i = -10; i <= 11; i += 2.0) {
      cCtx.beginPath();
      cCtx.moveTo(256 + dx + i, 215 - (1 - Math.abs(i) / 14) * 4.5);
      cCtx.lineTo(256 + dx + i + sign * 2, 209.5 - (1 - Math.abs(i) / 14) * 3.5);
      cCtx.stroke();
    }
    cCtx.restore();
  });

  // Subtle nasolabial & under-lip contour shadows
  cCtx.strokeStyle = gender === 'female' ? 'rgba(130, 82, 66, 0.16)' : 'rgba(130, 82, 66, 0.22)';
  cCtx.lineWidth = 2.2;
  [-1, 1].forEach((side) => {
    cCtx.beginPath();
    cCtx.moveTo(256 + side * 14, 282);
    cCtx.quadraticCurveTo(256 + side * 24, 302, 256 + side * 20, 326);
    cCtx.stroke();
  });

  // Under-lower-lip chin shadow
  const chinShadow = cCtx.createRadialGradient(256, 336, 2, 256, 336, 20);
  chinShadow.addColorStop(0, 'rgba(110, 68, 56, 0.26)');
  chinShadow.addColorStop(1, 'rgba(207, 160, 132, 0)');
  cCtx.fillStyle = chinShadow;
  cCtx.fillRect(230, 322, 52, 28);

  // Subtle lip tint gradient on the mouth zone (supports 3D sculpted lips cleanly)
  const lipGrad = cCtx.createRadialGradient(256, 322, 3, 256, 322, 22);
  lipGrad.addColorStop(
    0,
    gender === 'female' ? 'rgba(182, 92, 92, 0.72)' : 'rgba(164, 102, 92, 0.45)'
  );
  lipGrad.addColorStop(1, 'rgba(207, 160, 132, 0)');
  cCtx.fillStyle = lipGrad;
  cCtx.fillRect(232, 308, 48, 28);

  // Male natural facial stubble / groomed beard integrated directly into skin texture
  if (gender === 'male') {
    const jawShade = cCtx.createRadialGradient(256, 355, 16, 256, 350, 76);
    jawShade.addColorStop(0, 'rgba(42, 32, 28, 0.36)');
    jawShade.addColorStop(0.65, 'rgba(54, 42, 36, 0.24)');
    jawShade.addColorStop(1, 'rgba(207, 160, 132, 0)');
    cCtx.fillStyle = jawShade;
    cCtx.fillRect(170, 290, 172, 120);

    // Individual realistic stubble dots along jaw, chin, and upper lip
    for (let i = 0; i < 1650; i++) {
      const sx = 256 + (rand() - 0.5) * 136;
      const sy = 296 + rand() * 98;
      const dx = (sx - 256) / 68;
      const dy = (sy - 344) / 48;
      // Keep mouth opening & central cheek clear
      const inMouth = Math.abs(sx - 256) < 20 && sy > 312 && sy < 332;
      const inMustache = Math.abs(sx - 256) < 28 && sy >= 298 && sy <= 312;
      const inJaw = dx * dx + dy * dy < 0.92 && sy > 304;
      if ((inJaw || inMustache) && !inMouth) {
        cCtx.fillStyle =
          rand() > 0.35 ? 'rgba(34, 25, 21, 0.55)' : 'rgba(60, 46, 38, 0.38)';
        cCtx.fillRect(sx, sy, 1.4, 1.8);
        bCtx.fillStyle = '#9c9c9c';
        bCtx.fillRect(sx, sy, 1.4, 1.4);
      }
    }
  }

  // Fine organic skin pore & micro-freckle texture across entire face
  for (let i = 0; i < 2400; i++) {
    const px = 140 + rand() * 232;
    const py = 120 + rand() * 270;
    cCtx.fillStyle =
      rand() > 0.5 ? 'rgba(130, 82, 62, 0.042)' : 'rgba(255, 238, 224, 0.05)';
    cCtx.fillRect(px, py, 1.5, 1.5);
    bCtx.fillStyle = rand() > 0.5 ? '#757575' : '#8b8b8b';
    bCtx.fillRect(px, py, 1.5, 1.5);
  }

  // Soft scalp hair base at top & rear so hair roots blend into scalp naturally
  const scalpGrad = cCtx.createLinearGradient(0, 0, 0, 170);
  scalpGrad.addColorStop(0, '#1c1512');
  scalpGrad.addColorStop(0.72, '#241b17');
  scalpGrad.addColorStop(1, 'rgba(36, 27, 23, 0)');
  cCtx.fillStyle = scalpGrad;
  cCtx.fillRect(0, 0, size, 170);

  if (gender === 'female') {
    // Delicate pulled-back hairline wisps around forehead & temples
    cCtx.strokeStyle = 'rgba(36, 25, 20, 0.42)';
    cCtx.lineWidth = 1.1;
    for (let x = 185; x <= 327; x += 4.5) {
      const arch = Math.pow((x - 256) / 72, 2) * 18;
      cCtx.beginPath();
      cCtx.moveTo(x, 146 + arch);
      cCtx.quadraticCurveTo(x + (x < 256 ? -5 : 5), 156 + arch, x + (x < 256 ? -8 : 8), 165 + arch);
      cCtx.stroke();
    }
  }

  // Back of head hair base (u < 0.28 and u > 0.72)
  cCtx.fillStyle = '#1e1613';
  cCtx.fillRect(0, 0, 145, gender === 'female' ? 360 : 420);
  cCtx.fillRect(size - 145, 0, 145, gender === 'female' ? 360 : 420);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  [map, bumpMap, roughnessMap].forEach((t) => {
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = maxAnisotropy;
  });
  return { map, bumpMap, roughnessMap };
}

export function createDcmModuleTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#555e68';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#333b44';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Top telemetry mini readout bar (muted amber/cyan, not oversaturated)
  ctx.fillStyle = '#18212b';
  ctx.fillRect(20, 18, w - 40, 48);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 18, w - 40, 48);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('O2 98%  PSU OK', 30, 48);

  // Rotary purge & valve dials
  [56, 128, 200].forEach((cx, idx) => {
    ctx.fillStyle = '#2d3640';
    ctx.beginPath();
    ctx.arc(cx, 114, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = idx === 2 ? '#b45309' : '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(cx, 114);
    ctx.lineTo(cx + (idx - 1) * 10, 96);
    ctx.stroke();
  });

  // Lower toggle switches & warning label
  ctx.fillStyle = '#1e2630';
  ctx.fillRect(24, 162, w - 48, 66);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i === 1 ? '#b91c1c' : '#94a3b8';
    ctx.fillRect(38 + i * 50, 178, 22, 32);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createModelGraphicOverlayTexture(label = 'NOVA // EVA-04'): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Faint transparent technical mesh grid (Photo 1 & 3 inspo)
  ctx.strokeStyle = 'rgba(148, 197, 232, 0.24)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Corner registration brackets
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
  ctx.lineWidth = 3;
  const m = 10;
  const b = 26;
  // Top-left & top-right
  ctx.beginPath();
  ctx.moveTo(m, m + b); ctx.lineTo(m, m); ctx.lineTo(m + b, m);
  ctx.moveTo(w - m - b, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, m + b);
  ctx.moveTo(m, h - m - b); ctx.lineTo(m, h - m); ctx.lineTo(m + b, h - m);
  ctx.moveTo(w - m - b, h - m); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m, h - m - b);
  ctx.stroke();

  // Muted Aerospace Flag / Emblem block (Photo 1 inspo, low saturation)
  ctx.fillStyle = 'rgba(30, 58, 95, 0.72)';
  ctx.fillRect(36, 46, 56, 44);
  ctx.fillStyle = 'rgba(185, 68, 56, 0.72)';
  for (let s = 0; s < 5; s++) {
    ctx.fillRect(92, 46 + s * 16, 86, 8);
  }
  ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
  for (let s = 0; s < 4; s++) {
    ctx.fillRect(92, 54 + s * 16, 86, 8);
  }
  ctx.fillRect(36, 90, 56, 36);

  // Stencil callout & attitude axis marks
  ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(label, 206, 86);

  ctx.fillStyle = 'rgba(125, 211, 252, 0.65)';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('FRAME // +X  NOMINAL', 206, 118);

  // Attitude vector chevron graphics
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.58)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(36, 178);
  ctx.lineTo(w - 36, 178);
  ctx.stroke();

  ctx.fillStyle = 'rgba(148, 163, 184, 0.62)';
  ctx.font = '14px monospace';
  ctx.fillText('RCS ATTITUDE REF  00.0°  |  TPS NOMINAL', 38, 212);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDeckFloorTextures(maxAnisotropy = 4): PbrTextureBundle {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = roughCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;
  const rand = pseudoRandom(633);

  cCtx.fillStyle = '#0f172a';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#7a7a7a';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#a0a0a0';
  rCtx.fillRect(0, 0, size, size);

  // Clean matte aerospace deck plates (low visual noise)
  const tile = 128;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      cCtx.fillStyle = (x / tile + y / tile) % 2 === 0 ? '#141e30' : '#111a29';
      cCtx.fillRect(x + 2, y + 2, tile - 4, tile - 4);

      bCtx.fillStyle = '#888888';
      bCtx.fillRect(x + 2, y + 2, tile - 4, tile - 4);

      rCtx.fillStyle = '#929292';
      rCtx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    }
  }

  for (let i = 0; i < 120; i++) {
    cCtx.fillStyle = 'rgba(255,255,255,0.012)';
    cCtx.fillRect(rand() * size, rand() * size, 10 + rand() * 24, 1.5);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  [map, bumpMap, roughnessMap].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAnisotropy;
  });

  return { map, bumpMap, roughnessMap };
}

export function createCockpitConsoleTexture(
  title: string,
  accentHex = '#38bdf8'
): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#040a14';
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 24; x < w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 24; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // Header bar
  ctx.fillStyle = accentHex;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(12, 12, w - 24, 42);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(title, 24, 41);

  // Telemetry waveform & secondary harmonic wave
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 26; x < w - 26; x += 10) {
    const y = 128 + Math.sin(x * 0.08) * 28 + Math.cos(x * 0.03) * 12;
    if (x === 26) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 26; x < w - 26; x += 10) {
    const y = 128 + Math.cos(x * 0.06) * 20;
    if (x === 26) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Indicator bars
  for (let b = 0; b < 6; b++) {
    ctx.fillStyle = b < 5 ? accentHex : '#f59e0b';
    ctx.fillRect(28 + b * 76, 194, 58, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMfdTelemetryTexture(
  kind: 'left' | 'center' | 'right' | 'armrest'
): THREE.CanvasTexture {
  const w = kind === 'center' ? 512 : 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#06101c';
  ctx.fillRect(0, 0, w, h);

  // Subtle scanline grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.13)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  if (kind === 'left') {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('FUEL / RCS', 18, 30);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('H2  92%', 20, 74);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(20, 84, 210, 22);
    ctx.fillRect(22, 86, 190, 18);

    ctx.fillStyle = '#10b981';
    ctx.fillText('RCS 98%', 20, 140);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(20, 150, 210, 22);
    ctx.fillRect(22, 152, 202, 18);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '14px monospace';
    ctx.fillText('APU: NOMINAL', 20, 216);
  } else if (kind === 'center') {
    ctx.fillStyle = 'rgba(56,189,248,0.16)';
    ctx.fillRect(8, 8, w - 16, 26);
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('STABLE ORBIT   [HUD MODE]', 18, 26);

    const rows = [
      ['Apoapsis', '185.7 km'],
      ['Periapsis', '177.8 km'],
      ['Inc', '28.5 deg'],
      ['Ecc', '0.00061'],
      ['Period', '5196.6 s'],
      ['Gravity', '9.47 m/s2'],
    ];
    rows.forEach(([k, v], idx) => {
      const y = 62 + idx * 24;
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '13px monospace';
      ctx.fillText(k, 18, y);
      ctx.fillStyle = idx === 5 ? '#fbbf24' : '#e2e8f0';
      ctx.fillText(v, 118, y);
    });

    const rx = 252;
    const ry = 46;
    const rw = 240;
    const rh = 176;
    ctx.fillStyle = 'rgba(14, 116, 144, 0.25)';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(rx, ry, rw, rh);
    const scanGrad = ctx.createLinearGradient(rx + 120, ry, rx + 165, ry);
    scanGrad.addColorStop(0, 'rgba(56,189,248,0)');
    scanGrad.addColorStop(0.7, 'rgba(125,211,252,0.75)');
    scanGrad.addColorStop(1, 'rgba(255,255,255,0.9)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(rx + 120, ry + 2, 46, rh - 4);

    ctx.strokeStyle = '#bae6fd';
    ctx.strokeRect(rx + 68, ry + 48, 80, 64);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.fillText('S   W   N   E       LONG 62.9   LAT 0.0', 22, 240);
  } else if (kind === 'right') {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('ORBITAL ALIGN', 20, 28);

    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, 68, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125,211,252,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(128, 128, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(154, 174, 8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ORBITER SYS', 18, 26);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(128, 48);
    ctx.lineTo(148, 106);
    ctx.lineTo(206, 178);
    ctx.lineTo(206, 202);
    ctx.lineTo(50, 202);
    ctx.lineTo(50, 178);
    ctx.lineTo(108, 106);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(128, 70);
    ctx.lineTo(128, 198);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRoomHeaderTexture(
  roomCode: string,
  title: string,
  specialist: string,
  accentHex = '#38bdf8'
): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#070b12';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  ctx.fillStyle = accentHex;
  ctx.fillRect(10, 10, 14, h - 20);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 18px monospace';
  ctx.fillText(roomCode, 38, 38);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(title, 38, 74);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 17px monospace';
  ctx.fillText(`SPECIALIST: ${specialist}`, 38, 106);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createAtriumDashboardTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#060a11';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  ctx.fillStyle = 'rgba(14, 116, 144, 0.28)';
  ctx.fillRect(12, 12, w - 24, 54);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('NASA ORBITER MASTER TELEMETRY DASHBOARD  •  ALL 10 ROOMS ONLINE', 28, 47);

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(24, 84, 300, 396);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 84, 300, 396);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('SHUTTLE SYSTEMS', 42, 114);

  const sysRows = [
    ['RS-25 THRUST', 'NOMINAL'],
    ['LIFE SUPPORT O2', '100.0 %'],
    ['THERMAL TILES', '98.4 %'],
    ['SHIELD ARRAY', 'CHARGED'],
    ['DSN ARRAY', 'LOCKED'],
    ['GMAT TRAJ', 'VERIFIED'],
    ['CML STAGE', 'LEVEL 1-4'],
  ];
  sysRows.forEach(([k, v], i) => {
    const y = 156 + i * 44;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px monospace';
    ctx.fillText(k, 42, y);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(v, 210, y);
  });

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(344, 84, 336, 396);
  ctx.strokeStyle = 'rgba(56,189,248,0.28)';
  ctx.strokeRect(344, 84, 336, 396);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('ORBITER DECK SCHEMATIC', 385, 114);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(512, 146);
  ctx.lineTo(548, 224);
  ctx.lineTo(646, 368);
  ctx.lineTo(646, 424);
  ctx.lineTo(378, 424);
  ctx.lineTo(378, 368);
  ctx.lineTo(476, 224);
  ctx.closePath();
  ctx.stroke();

  const pts: Array<[number, number, string]> = [
    [512, 180, 'DECK'],
    [512, 240, 'GMAT'],
    [438, 286, 'LAB'],
    [586, 286, 'MDL'],
    [418, 344, 'BIO'],
    [606, 344, 'BAY'],
    [436, 396, 'HAB'],
    [588, 396, 'DSN'],
    [512, 326, 'MED'],
    [512, 412, 'LOCK'],
  ];
  pts.forEach(([px, py, lbl]) => {
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(lbl, px + 9, py + 4);
  });

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(700, 84, 300, 396);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.strokeRect(700, 84, 300, 396);
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('10 ROOM SPECIALISTS', 718, 114);

  const specs = [
    '01 Capt. Ryan  • Flight',
    '02 Dr. Nadia   • GMAT',
    '03 Dr. Elena   • Optics',
    '04 Dr. Omar    • Botany',
    '05 Maya Lin    • Galley',
    '06 Dr. Sophia  • MedBay',
    '07 Marcus Chen • Reactor',
    '08 Sgt. Devon  • Rover',
    '09 Lt. Aria    • DSN',
    '10 Cmdr. Leo   • Airlock',
  ];
  specs.forEach((line, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#cbd5e1' : '#7dd3fc';
    ctx.font = '14px monospace';
    ctx.fillText(line, 718, 152 + i * 28);
  });

  ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.fillRect(718, 430, 264, 34);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('[E] OPEN LIVE DASHBOARD', 738, 452);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSurfaceSkyTexture(
  skyHex: string,
  starStrength = 1
): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const rand = pseudoRandom(1337);

  const base = new THREE.Color(skyHex);
  const top = base.clone().multiplyScalar(0.55);
  const horizon = base.clone().lerp(new THREE.Color('#334155'), starStrength > 0.7 ? 0.14 : 0.25);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, `#${top.getHexString()}`);
  grad.addColorStop(0.58, `#${base.getHexString()}`);
  grad.addColorStop(1, `#${horizon.getHexString()}`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  if (starStrength > 0.05) {
    const count = Math.round(950 * starStrength);
    for (let i = 0; i < count; i++) {
      const sx = rand() * width;
      const sy = rand() * (height * 0.62);
      const isBright = rand() < 0.04;
      const r = isBright ? 1.1 + rand() * 0.65 : 0.4 + rand() * 0.6;
      const alpha = (isBright ? 0.85 : 0.22 + rand() * 0.52) * Math.min(1, starStrength);
      ctx.fillStyle =
        i % 9 === 0
          ? `rgba(186, 230, 253, ${alpha})`
          : i % 13 === 0
            ? `rgba(253, 230, 138, ${alpha})`
            : `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTerrainDetailTexture(
  baseHex: string,
  accentHex: string,
  maxAnisotropy: number
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 1024;
  const canvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  canvas.width = bumpCanvas.width = size;
  canvas.height = bumpCanvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rand = pseudoRandom(773);

  const baseCol = new THREE.Color(baseHex);
  const darkCol = baseCol.clone().multiplyScalar(0.56);
  const lightCol = baseCol.clone().lerp(new THREE.Color('#f8fafc'), 0.34);
  const accentCol = new THREE.Color(accentHex);

  ctx.fillStyle = `#${baseCol.getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Broad organic albedo & dust patches (seamless tiled across edges)
  const drawWrapped = (
    target: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    drawFn: (x: number, y: number) => void
  ) => {
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const px = cx + ox * size;
        const py = cy + oy * size;
        if (px + r < 0 || px - r > size || py + r < 0 || py - r > size) continue;
        drawFn(px, py);
      }
    }
  };

  for (let i = 0; i < 60; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const rx = 45 + rand() * 110;
    const useLight = i % 2 === 0;
    drawWrapped(ctx, cx, cy, rx, (px, py) => {
      const patch = ctx.createRadialGradient(px, py, 2, px, py, rx);
      patch.addColorStop(
        0,
        useLight
          ? `rgba(${Math.round(lightCol.r * 255)},${Math.round(lightCol.g * 255)},${Math.round(lightCol.b * 255)},0.16)`
          : `rgba(${Math.round(darkCol.r * 255)},${Math.round(darkCol.g * 255)},${Math.round(darkCol.b * 255)},0.14)`
      );
      patch.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.arc(px, py, rx, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Fine mineral regolith grit
  for (let i = 0; i < 6500; i++) {
    const sx = rand() * size;
    const sy = rand() * size;
    const sr = 0.7 + rand() * 2.1;
    ctx.fillStyle =
      i % 5 === 0
        ? `#${accentCol.getHexString()}`
        : i % 2 === 0
          ? 'rgba(0,0,0,0.16)'
          : 'rgba(255,255,255,0.11)';
    ctx.globalAlpha = 0.14 + rand() * 0.16;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();

    const bv = i % 2 === 0 ? 148 + Math.round(rand() * 40) : 98 + Math.round(rand() * 25);
    bCtx.fillStyle = `rgba(${bv},${bv},${bv},0.35)`;
    bCtx.beginPath();
    bCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    bCtx.fill();
  }
  ctx.globalAlpha = 1;

  // Multi-scale shaded impact craters (large basins -> medium craters -> micro-pits)
  const paintCrater = (cx: number, cy: number, r: number, depthAlpha: number) => {
    drawWrapped(ctx, cx, cy, r * 1.35, (px, py) => {
      // Soft outer ejecta / raised rim halo
      const rimGrad = ctx.createRadialGradient(px, py, r * 0.65, px, py, r * 1.25);
      rimGrad.addColorStop(0, 'rgba(255,255,255,0)');
      rimGrad.addColorStop(
        0.55,
        `rgba(${Math.round(lightCol.r * 255)},${Math.round(lightCol.g * 255)},${Math.round(lightCol.b * 255)},${(0.32 * depthAlpha).toFixed(3)})`
      );
      rimGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(px, py, r * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Sunlit directional inner shadow bowl (sun from upper-right -> shadow on upper-right inner wall)
      const bowlGrad = ctx.createRadialGradient(
        px - r * 0.18,
        py - r * 0.18,
        r * 0.08,
        px,
        py,
        r * 0.94
      );
      bowlGrad.addColorStop(0, `rgba(15, 23, 42, ${(0.34 * depthAlpha).toFixed(3)})`);
      bowlGrad.addColorStop(0.55, `rgba(15, 23, 42, ${(0.22 * depthAlpha).toFixed(3)})`);
      bowlGrad.addColorStop(0.86, `rgba(255, 255, 255, ${(0.22 * depthAlpha).toFixed(3)})`);
      bowlGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bowlGrad;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.94, 0, Math.PI * 2);
      ctx.fill();

      // Bump heightmap crater depression + raised rim
      const bGrad = bCtx.createRadialGradient(px, py, r * 0.1, px, py, r * 1.18);
      bGrad.addColorStop(0, '#363636');
      bGrad.addColorStop(0.62, '#5a5a5a');
      bGrad.addColorStop(0.84, '#d8d8d8');
      bGrad.addColorStop(1, 'rgba(128,128,128,0)');
      bCtx.fillStyle = bGrad;
      bCtx.beginPath();
      bCtx.arc(px, py, r * 1.18, 0, Math.PI * 2);
      bCtx.fill();
    });
  };

  for (let i = 0; i < 22; i++) {
    paintCrater(rand() * size, rand() * size, 28 + rand() * 34, 0.95);
  }
  for (let i = 0; i < 68; i++) {
    paintCrater(rand() * size, rand() * size, 10 + rand() * 18, 0.85);
  }
  for (let i = 0; i < 160; i++) {
    paintCrater(rand() * size, rand() * size, 3.5 + rand() * 6.5, 0.65);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(14, 14);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(14, 14);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createPlanetTexture(
  kind: PlanetTextureKind,
  maxAnisotropy: number
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  emissiveMap?: THREE.CanvasTexture;
} {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  canvas.width = bumpCanvas.width = roughCanvas.width = width;
  canvas.height = bumpCanvas.height = roughCanvas.height = height;

  const ctx = canvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, width, height);
  rCtx.fillStyle = '#c8c8c8';
  rCtx.fillRect(0, 0, width, height);

  const rand = pseudoRandom(
    kind === 'terran'
      ? 101
      : kind === 'volcanic'
        ? 202
        : kind === 'cryo_giant'
          ? 303
          : kind === 'desert'
            ? 404
            : kind === 'emerald_nebula'
              ? 505
              : 606
  );

  let emissiveCanvas: HTMLCanvasElement | null = null;
  let eCtx: CanvasRenderingContext2D | null = null;

  if (kind === 'volcanic' || kind === 'emerald_nebula' || kind === 'obsidian') {
    emissiveCanvas = document.createElement('canvas');
    emissiveCanvas.width = width;
    emissiveCanvas.height = height;
    eCtx = emissiveCanvas.getContext('2d')!;
    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, width, height);
  }

  if (kind === 'terran') {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(0.12, '#64748b');
    grad.addColorStop(0.5, '#475569');
    grad.addColorStop(0.88, '#64748b');
    grad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Lunar maria basins
    for (let i = 0; i < 75; i++) {
      const cx = rand() * width;
      const cy = 40 + rand() * (height - 80);
      const rx = 22 + rand() * 75;
      const ry = 14 + rand() * 44;
      const rot = rand() * Math.PI;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(30, 41, 59, 0.38)' : 'rgba(148, 163, 184, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = i % 2 === 0 ? '#686868' : '#969696';
      bCtx.beginPath();
      bCtx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
      bCtx.fill();
    }
    // High-relief craters
    for (let i = 0; i < 150; i++) {
      const cx = rand() * width;
      const cy = 20 + rand() * (height - 40);
      const r = 3 + rand() * 19;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(241, 245, 249, 0.42)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      bCtx.fillStyle = '#404040';
      bCtx.beginPath();
      bCtx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.strokeStyle = '#dcdcdc';
      bCtx.lineWidth = 2;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.stroke();
    }
  } else if (kind === 'volcanic') {
    ctx.fillStyle = '#141110';
    ctx.fillRect(0, 0, width, height);
    bCtx.fillStyle = '#707070';
    bCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 160; i++) {
      const cx = rand() * width;
      const cy = rand() * height;
      const r = 10 + rand() * 38;
      ctx.fillStyle = i % 2 === 0 ? '#292524' : '#3f3a36';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = i % 2 === 0 ? '#a8a8a8' : '#585858';
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.fill();
    }
    for (let i = 0; i < 45; i++) {
      let x = rand() * width;
      let y = 30 + rand() * (height - 60);
      const lw = 2 + rand() * 4;
      ctx.strokeStyle = i % 2 === 0 ? '#f97316' : '#fbbf24';
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x, y);

      bCtx.strokeStyle = '#202020';
      bCtx.lineWidth = lw + 2;
      bCtx.beginPath();
      bCtx.moveTo(x, y);

      if (eCtx) {
        eCtx.strokeStyle = i % 2 === 0 ? '#ea580c' : '#f59e0b';
        eCtx.lineWidth = lw;
        eCtx.beginPath();
        eCtx.moveTo(x, y);
      }
      for (let s = 0; s < 7; s++) {
        x += (rand() - 0.35) * 65;
        y += (rand() - 0.5) * 38;
        ctx.lineTo(x, y);
        bCtx.lineTo(x, y);
        eCtx?.lineTo(x, y);
      }
      ctx.stroke();
      bCtx.stroke();
      eCtx?.stroke();
    }
  } else if (kind === 'cryo_giant') {
    // Realistic Jupiter ochre, cream, amber, and rust cloud belts + Great Red Spot
    const bandColors = ['#fef3c7', '#fde68a', '#d97706', '#b45309', '#f5e1c0', '#9a3412', '#e7c9a0'];
    let y = 0;
    while (y < height) {
      const bandH = 8 + rand() * 22;
      ctx.fillStyle = bandColors[Math.floor(rand() * bandColors.length)];
      ctx.fillRect(0, y, width, bandH + 2);
      const roughBand = 55 + Math.round(rand() * 55);
      rCtx.fillStyle = `rgb(${roughBand},${roughBand},${roughBand})`;
      rCtx.fillRect(0, y, width, bandH + 2);
      y += bandH;
    }
    // Jupiter Great Red Spot
    ctx.fillStyle = 'rgba(180, 62, 28, 0.85)';
    ctx.beginPath();
    ctx.ellipse(width * 0.62, height * 0.58, 62, 28, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.65)';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (kind === 'desert') {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.08, '#9a3412');
    grad.addColorStop(0.35, '#c2410c');
    grad.addColorStop(0.55, '#ea580c');
    grad.addColorStop(0.85, '#9a3412');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 110; i++) {
      const cx = rand() * width;
      const cy = 40 + rand() * (height - 80);
      const rx = 32 + rand() * 110;
      const ry = 8 + rand() * 24;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(251, 146, 60, 0.25)' : 'rgba(67, 20, 7, 0.34)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.1, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = i % 2 === 0 ? '#a8a8a8' : '#585858';
      bCtx.beginPath();
      bCtx.ellipse(cx, cy, rx, ry, 0.1, 0, Math.PI * 2);
      bCtx.fill();
    }
    for (let i = 0; i < 55; i++) {
      const cx = rand() * width;
      const cy = 40 + rand() * (height - 80);
      const r = 6 + rand() * 18;
      ctx.strokeStyle = 'rgba(67, 20, 7, 0.52)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      bCtx.strokeStyle = '#dcdcdc';
      bCtx.lineWidth = 2.4;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.stroke();
    }
  } else if (kind === 'emerald_nebula') {
    // Realistic Planet Earth: deep sapphire oceans + green/ochre continents + subtle warm city lights
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.11, '#0284c7');
    grad.addColorStop(0.5, '#0369a1');
    grad.addColorStop(0.89, '#0284c7');
    grad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    rCtx.fillStyle = '#303030'; // Glossy oceans
    rCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 85; i++) {
      const cx = rand() * width;
      const cy = 40 + rand() * (height - 80);
      const rx = 24 + rand() * 78;
      const ry = 12 + rand() * 38;
      const rot = rand() * Math.PI;
      ctx.fillStyle = i % 3 === 0 ? '#15803d' : i % 3 === 1 ? '#16a34a' : '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
      ctx.fill();

      rCtx.fillStyle = '#d4d4d4'; // Matte continents
      rCtx.beginPath();
      rCtx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
      rCtx.fill();

      bCtx.fillStyle = '#b4b4b4';
      bCtx.beginPath();
      bCtx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
      bCtx.fill();

      if (eCtx && i % 4 === 0) {
        eCtx.fillStyle = 'rgba(253, 224, 71, 0.35)';
        eCtx.beginPath();
        eCtx.arc(cx, cy, 2 + rand() * 4, 0, Math.PI * 2);
        eCtx.fill();
      }
    }
  } else if (kind === 'obsidian') {
    // Realistic Saturn pale gold, butterscotch, and tan banded gas giant
    const saturnBands = ['#fef3c7', '#fde68a', '#e7c675', '#d6ae60', '#c49a52', '#ebd299'];
    let y = 0;
    while (y < height) {
      const bandH = 10 + rand() * 24;
      ctx.fillStyle = saturnBands[Math.floor(rand() * saturnBands.length)];
      ctx.fillRect(0, y, width, bandH + 2);
      rCtx.fillStyle = '#707070';
      rCtx.fillRect(0, y, width, bandH + 2);
      y += bandH;
    }
    if (eCtx) {
      eCtx.fillStyle = 'rgba(254, 240, 138, 0.14)';
      eCtx.fillRect(0, height * 0.42, width, height * 0.16);
    }
  } else if (kind === 'mercury') {
    // Scorched cratered silicate-graphite surface of Mercury
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#9ca3af');
    grad.addColorStop(0.5, '#78716c');
    grad.addColorStop(1, '#a8a29e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 180; i++) {
      const cx = rand() * width;
      const cy = 18 + rand() * (height - 36);
      const r = 3 + rand() * 16;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(68, 64, 60, 0.45)' : 'rgba(168, 162, 158, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(231, 229, 228, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      bCtx.fillStyle = '#3f3f46';
      bCtx.beginPath();
      bCtx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.strokeStyle = '#e4e4e7';
      bCtx.lineWidth = 1.8;
      bCtx.stroke();
    }
  } else if (kind === 'uranus') {
    // Pale cyan-aquamarine methane atmosphere of Uranus
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#cffafe');
    grad.addColorStop(0.35, '#67e8f9');
    grad.addColorStop(0.65, '#22d3ee');
    grad.addColorStop(1, '#a5f3fc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    rCtx.fillStyle = '#404040';
    rCtx.fillRect(0, 0, width, height);
    for (let i = 0; i < 14; i++) {
      const y = (i / 14) * height;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(236, 254, 255, 0.14)' : 'rgba(6, 182, 212, 0.16)';
      ctx.fillRect(0, y, width, 18);
    }
  } else if (kind === 'neptune') {
    // Deep sapphire blue Neptune with bright methane cloud streaks & Dark Spot
    const bands = ['#1e3a8a', '#1d4ed8', '#2563eb', '#1e40af', '#3b82f6'];
    let y = 0;
    while (y < height) {
      const bandH = 12 + rand() * 28;
      ctx.fillStyle = bands[Math.floor(rand() * bands.length)];
      ctx.fillRect(0, y, width, bandH + 2);
      rCtx.fillStyle = '#454545';
      rCtx.fillRect(0, y, width, bandH + 2);
      y += bandH;
    }
    // Great Dark Spot + high white cirrus streaks
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.ellipse(width * 0.42, height * 0.56, 48, 22, 0.05, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
      ctx.fillRect(rand() * width, 40 + rand() * (height - 80), 40 + rand() * 80, 3);
    }
  } else {
    // Fallback / Saturn pale gold, butterscotch, and tan banded gas giant
    const saturnBands = ['#fef3c7', '#fde68a', '#e7c675', '#d6ae60', '#c49a52', '#ebd299'];
    let y = 0;
    while (y < height) {
      const bandH = 10 + rand() * 24;
      ctx.fillStyle = saturnBands[Math.floor(rand() * saturnBands.length)];
      ctx.fillRect(0, y, width, bandH + 2);
      rCtx.fillStyle = '#707070';
      rCtx.fillRect(0, y, width, bandH + 2);
      y += bandH;
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  [map, bumpMap, roughnessMap].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = maxAnisotropy;
  });

  let emissiveMap: THREE.CanvasTexture | undefined;
  if (emissiveCanvas) {
    emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.wrapS = THREE.RepeatWrapping;
    emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
    emissiveMap.anisotropy = maxAnisotropy;
  }

  return { map, bumpMap, roughnessMap, emissiveMap };
}

export function createCloudLayerTexture(tintHex = '#ffffff', seed = 888): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const rand = pseudoRandom(seed);
  const col = new THREE.Color(tintHex);
  const r = Math.round(col.r * 255);
  const g = Math.round(col.g * 255);
  const b = Math.round(col.b * 255);

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < 160; i++) {
    const cx = rand() * width;
    const cy = 24 + rand() * (height - 48);
    const rx = 28 + rand() * 110;
    const ry = 6 + rand() * 18;
    const alpha = 0.08 + rand() * 0.24;
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, (rand() - 0.5) * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createRingTexture(hexColor: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, 32);
  const color = new THREE.Color(hexColor);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);

  for (let x = 0; x < size; x++) {
    const t = x / size;
    const edgeFade = Math.sin(t * Math.PI);
    const band = 0.5 + 0.5 * Math.sin(t * 58) * Math.cos(t * 23);
    const cassiniGap = t > 0.52 && t < 0.57 ? 0.14 : 1;
    const alpha = Math.max(0, Math.min(1, edgeFade * band * cassiniGap * 0.9));
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fillRect(x, 0, 1, 32);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSoftGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.22, 'rgba(255,245,220,0.72)');
  grad.addColorStop(0.58, 'rgba(180,220,255,0.2)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
