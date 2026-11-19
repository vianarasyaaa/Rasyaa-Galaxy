import * as THREE from 'three';
import type { CosmicStoryBeat, Vec3Tuple } from '../data/portfolioData';
import {
  clampProgress,
  getStoryBeatVisibility,
  sampleUnifiedJourney,
} from '../utils/galaxyNavigation';

interface StoryNodeEntry {
  beat: CosmicStoryBeat;
  group: THREE.Group;
  textMesh: THREE.Mesh;
  vaporSprite: THREE.Sprite;
  material: THREE.ShaderMaterial;
  texture: THREE.CanvasTexture;
  basePosition: THREE.Vector3;
  phase: number;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function createStoryTextTexture(
  beat: CosmicStoryBeat,
  isSoftwareGl: boolean
): THREE.CanvasTexture {
  const width = isSoftwareGl ? 512 : 1024;
  const height = isSoftwareGl ? 192 : 384;
  const scale = width / 1024;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Pure transparent canvas (no rectangle tint edges over bright stars or suns)
  ctx.clearRect(0, 0, 1024, 384);

  // Neat After Effects kinetic tag + glowing vector hairline
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.save();
  ctx.font = '600 21px "JetBrains Mono", monospace';
  ctx.fillStyle = beat.accentHex;
  ctx.shadowColor = 'rgba(3, 6, 18, 0.98)';
  ctx.shadowBlur = 12;
  ctx.fillText(`${beat.indexLabel} · ${beat.tag}`, 512, 68);
  ctx.restore();

  const lineGrad = ctx.createLinearGradient(300, 96, 724, 96);
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  lineGrad.addColorStop(0.5, beat.accentHex);
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(300, 95, 424, 2);

  // Crisp luminous typography integrated directly into deep space
  const isShort = beat.text.length <= 24;
  const fontSize = isShort ? 62 : beat.text.length <= 58 ? 44 : 36;
  ctx.font = `700 ${fontSize}px "Syne", "Plus Jakarta Sans", system-ui, sans-serif`;

  const lines = wrapLines(ctx, beat.text, 860);
  const lineHeight = fontSize * 1.26;
  const totalHeight = lines.length * lineHeight;
  const startY = 228 - totalHeight / 2 + lineHeight / 2;

  ctx.save();
  ctx.shadowColor = beat.accentHex;
  ctx.shadowBlur = 22;
  ctx.fillStyle = 'rgba(248, 250, 252, 0.96)';
  lines.forEach((line, idx) => {
    ctx.fillText(line, 512, startY + idx * lineHeight);
  });
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(2, 4, 14, 1)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, idx) => {
    ctx.fillText(line, 512, startY + idx * lineHeight);
  });
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createCosmicStoryNodes(
  beats: CosmicStoryBeat[],
  controlPoints: Vec3Tuple[],
  nebulaSmokeTex: THREE.CanvasTexture,
  isSoftwareGl: boolean
): {
  group: THREE.Group;
  update: (
    elapsed: number,
    cameraPos: THREE.Vector3,
    currentProgress: number,
    freeExplore: boolean
  ) => void;
  dispose: () => void;
} {
  const root = new THREE.Group();
  const planeGeo = new THREE.PlaneGeometry(36, 13.5);
  const entries: StoryNodeEntry[] = [];

  beats.forEach((beat, idx) => {
    const targetT = clampProgress(beat.progress + 0.0025);
    const sample = sampleUnifiedJourney(targetT, controlPoints);
    const nodeGroup = new THREE.Group();

    const basePosition = new THREE.Vector3(
      sample.position[0] + beat.sideOffset[0] * 0.55,
      sample.position[1] + beat.sideOffset[1] + (sample.realm === 'earth' ? 14 : 4),
      sample.position[2] - 135
    );
    nodeGroup.position.copy(basePosition);

    const texture = createStoryTextTexture(beat, isSoftwareGl);
    const accentColor = new THREE.Color(beat.accentHex);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uTime: { value: 0 },
        uFocus: { value: idx === 0 ? 1.0 : 0.0 },
        uAccent: { value: accentColor },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        uniform float uFocus;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float settle = (1.0 - uFocus);
          pos.y += sin(uv.x * 4.0 + uTime * 1.4) * 0.35 * settle;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uFocus;
        uniform vec3 uAccent;
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(uMap, vUv);
          if (tex.a < 0.01) discard;

          float edge = clamp(uFocus * 1.55, 0.0, 1.65);
          float wipe = smoothstep(vUv.x - 0.18, vUv.x + 0.04, edge);
          float flare = exp(-pow((edge - vUv.x) * 8.5, 2.0)) * step(0.05, uFocus);

          vec3 col = tex.rgb + uAccent * flare * 0.55;
          float alpha = tex.a * wipe * clamp(uFocus * 1.1, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const textMesh = new THREE.Mesh(planeGeo, material);
    nodeGroup.add(textMesh);

    const vaporSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaSmokeTex,
        color: accentColor,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    vaporSprite.position.set(0, 0, -4);
    vaporSprite.scale.set(44, 22, 1);
    nodeGroup.add(vaporSprite);

    root.add(nodeGroup);
    entries.push({
      beat,
      group: nodeGroup,
      textMesh,
      vaporSprite,
      material,
      texture,
      basePosition,
      phase: idx * 0.9,
    });
  });

  return {
    group: root,
    update: (
      elapsed: number,
      cameraPos: THREE.Vector3,
      currentProgress: number,
      freeExplore: boolean
    ) => {
      for (const entry of entries) {
        const dist = entry.group.position.distanceTo(cameraPos);
        if (dist > 460) {
          entry.group.visible = false;
          continue;
        }
        const distFade = clampProgress(1 - Math.max(0, dist - 220) / 180);
        const baseFocus = freeExplore
          ? clampProgress(1 - Math.max(0, dist - 55) / 260)
          : getStoryBeatVisibility(currentProgress, entry.beat.progress, 0.048);
        const focus = baseFocus * distFade;

        entry.material.uniforms.uTime.value = elapsed;
        entry.material.uniforms.uFocus.value = focus;
        entry.vaporSprite.material.opacity = focus * 0.16;
        entry.vaporSprite.material.rotation = entry.phase + elapsed * 0.08;

        entry.group.position.y =
          entry.basePosition.y + Math.sin(elapsed * 0.65 + entry.phase) * 0.7;

        if (focus > 0.03) {
          entry.group.visible = true;
          entry.group.lookAt(cameraPos);
        } else {
          entry.group.visible = false;
        }
      }
    },
    dispose: () => {
      planeGeo.dispose();
      for (const entry of entries) {
        entry.material.dispose();
        entry.texture.dispose();
        entry.vaporSprite.material.dispose();
      }
    },
  };
}
