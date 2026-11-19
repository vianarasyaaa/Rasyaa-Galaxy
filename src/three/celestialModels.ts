import * as THREE from 'three';
import { COSMIC_LANDMARKS, type CreativeProject, type Vec3Tuple } from '../data/portfolioData';
import type { PlanetTextureSet } from './proceduralTextures';

function createExtrudedHexBracket(radius: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const hole = new THREE.Path();
  const innerR = radius * 0.68;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * innerR;
    const y = Math.sin(a) * innerR;
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

export function createSolarCoreGroup(
  metalBumpTex: THREE.CanvasTexture,
  starSpriteTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  update: (elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const group = new THREE.Group();
  group.position.set(-520, 95, -180);
  group.scale.setScalar(15);

  const lod = new THREE.LOD();
  const hiGroup = new THREE.Group();
  const midGroup = new THREE.Group();

  // Level 0: Full animated plasma shader + gimbal rings
  const coreGeo = new THREE.SphereGeometry(4.6, 44, 44);
  const coreMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPos;
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z
        );
      }
      void main() {
        float n = noise(vPos * 1.15 + vec3(uTime * 0.35, -uTime * 0.25, uTime * 0.2));
        float n2 = noise(vPos * 2.4 - vec3(uTime * 0.4));
        float plasma = n * 0.65 + n2 * 0.35;
        vec3 deepAmber = vec3(0.95, 0.34, 0.06);
        vec3 hotGold = vec3(1.0, 0.85, 0.42);
        vec3 whiteCore = vec3(1.0, 0.98, 0.90);
        vec3 col = mix(deepAmber, hotGold, smoothstep(0.25, 0.72, plasma));
        col = mix(col, whiteCore, smoothstep(0.72, 0.95, plasma));
        float rim = pow(1.0 - max(0.0, vNormal.z), 2.2);
        col += vec3(1.0, 0.55, 0.12) * rim * 0.75;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  hiGroup.add(coreMesh);

  const coronaMat = new THREE.SpriteMaterial({
    map: starSpriteTex,
    color: 0xffaa44,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const corona = new THREE.Sprite(coronaMat);
  corona.scale.set(22, 22, 1);
  hiGroup.add(corona);

  const goldTrimMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4c266,
    metalness: 0.94,
    roughness: 0.16,
    anisotropy: 0.85,
    bumpMap: metalBumpTex,
    bumpScale: 0.02,
  });

  const darkTitaniumMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.88,
    roughness: 0.36,
    bumpMap: metalBumpTex,
    bumpScale: 0.03,
  });

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.15, 16, 72), goldTrimMat);
  ringA.rotation.x = Math.PI * 0.34;
  hiGroup.add(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(7.7, 0.2, 16, 72), darkTitaniumMat);
  ringB.rotation.y = Math.PI * 0.28;
  ringB.rotation.x = -Math.PI * 0.18;
  hiGroup.add(ringB);

  const finGeo = createExtrudedHexBracket(0.75, 0.18);
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const fin = new THREE.Mesh(finGeo, goldTrimMat);
    fin.position.set(Math.cos(angle) * 7.7, Math.sin(angle) * 7.7, 0);
    fin.rotation.z = angle;
    ringB.add(fin);
  }

  // Level 1 (mid/far LOD): Lightweight star sphere + glowing corona sprite
  const midCore = new THREE.Mesh(
    new THREE.SphereGeometry(4.6, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb74d })
  );
  midGroup.add(midCore);
  const midCorona = new THREE.Sprite(coronaMat);
  midCorona.scale.set(20, 20, 1);
  midGroup.add(midCorona);

  // Level 2 (deep horizon LOD): Pure star flare beacon
  const farBeacon = new THREE.Sprite(coronaMat);
  farBeacon.scale.set(14, 14, 1);

  lod.addLevel(hiGroup, 0);
  lod.addLevel(midGroup, 1800);
  lod.addLevel(farBeacon, 5200);
  group.add(lod);

  return {
    group,
    update: (elapsed: number, dt: number, camera: THREE.Camera) => {
      const distSq = group.position.distanceToSquared(camera.position);
      if (distSq > 11000 * 11000) {
        group.visible = false;
        return;
      }
      group.visible = true;
      lod.update(camera);
      if (distSq < 2200 * 2200) {
        coreMat.uniforms.uTime.value = elapsed;
        coreMesh.rotation.y += dt * 0.12;
        ringA.rotation.z += dt * 0.22;
        ringB.rotation.x -= dt * 0.15;
        ringB.rotation.y += dt * 0.18;
      }
    },
  };
}

export function createTechPlanetGroup(
  textures: PlanetTextureSet,
  metalBumpTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  update: (elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const group = new THREE.Group();
  group.position.set(-510, 70, -4150);
  group.scale.setScalar(15);

  const lod = new THREE.LOD();
  const hiGroup = new THREE.Group();
  const midGroup = new THREE.Group();

  const planetGeo = new THREE.SphereGeometry(5.6, 52, 44);
  const planetMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.map,
    bumpMap: textures.bumpMap,
    bumpScale: 0.2,
    roughnessMap: textures.roughnessMap,
    roughness: 0.85,
    metalness: 0.12,
  });
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.castShadow = true;
  planetMesh.receiveShadow = true;
  hiGroup.add(planetMesh);

  const atmoGeo = new THREE.SphereGeometry(6.0, 40, 32);
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float intensity = pow(0.68 - dot(vNormal, viewDir), 3.2);
        gl_FragColor = vec4(0.25, 0.72, 1.0, 1.0) * max(0.0, intensity) * 1.15;
      }
    `,
  });
  hiGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

  const innerRingMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.78,
    metalness: 0.22,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
  });
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(7.4, 9.6, 64), innerRingMat);
  innerRing.rotation.x = Math.PI * 0.42;
  innerRing.rotation.y = 0.24;
  innerRing.receiveShadow = true;
  hiGroup.add(innerRing);

  const outerRingMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 0.9,
    side: THREE.DoubleSide,
  });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(9.9, 10.35, 64), outerRingMat);
  outerRing.rotation.x = Math.PI * 0.42;
  outerRing.rotation.y = 0.24;
  hiGroup.add(outerRing);

  const satOrbit = new THREE.Group();
  hiGroup.add(satOrbit);

  const satBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.15,
    bumpMap: metalBumpTex,
    bumpScale: 0.015,
  });
  const solarWingMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f3b68,
    metalness: 0.65,
    roughness: 0.2,
    clearcoat: 1.0,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  for (let i = 0; i < 3; i++) {
    const sat = new THREE.Group();
    const angle = (i / 3) * Math.PI * 2;
    sat.position.set(Math.cos(angle) * 8.4, Math.sin(angle * 2) * 1.2, Math.sin(angle) * 8.4);

    const chassis = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.72, 8), satBodyMat);
    chassis.rotation.z = Math.PI / 2;
    sat.add(chassis);

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 1.5), solarWingMat);
    wingL.position.z = 0.95;
    sat.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 1.5), solarWingMat);
    wingR.position.z = -0.95;
    sat.add(wingR);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), beaconMat);
    beacon.position.x = 0.44;
    sat.add(beacon);

    satOrbit.add(sat);
  }

  // LOD Level 1: Simplified low-poly planet + flat ring
  const midPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(5.6, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, map: textures.map, roughness: 0.85 })
  );
  midGroup.add(midPlanet);
  const midRing = new THREE.Mesh(new THREE.RingGeometry(7.4, 10.2, 28), innerRingMat);
  midRing.rotation.x = Math.PI * 0.42;
  midRing.rotation.y = 0.24;
  midGroup.add(midRing);

  // LOD Level 2: Far silhouette sphere
  const farPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(5.6, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );

  lod.addLevel(hiGroup, 0);
  lod.addLevel(midGroup, 1900);
  lod.addLevel(farPlanet, 4800);
  group.add(lod);

  return {
    group,
    update: (elapsed: number, dt: number, camera: THREE.Camera) => {
      const distSq = group.position.distanceToSquared(camera.position);
      if (distSq > 9500 * 9500) {
        group.visible = false;
        return;
      }
      group.visible = true;
      lod.update(camera);
      if (distSq < 2200 * 2200) {
        planetMesh.rotation.y += dt * 0.09;
        satOrbit.rotation.y += dt * 0.32;
        satOrbit.rotation.z = Math.sin(elapsed * 0.25) * 0.08;
      }
    },
  };
}

export function createProjectStationGroup(
  project: CreativeProject,
  metalBumpTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  hitTarget: THREE.Mesh;
  update: (elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const group = new THREE.Group();
  group.position.set(...project.worldPosition);
  group.scale.setScalar(15);

  const accentColor = new THREE.Color(project.accentHex);

  const obsidianHullMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.78,
    roughness: 0.42,
    bumpMap: metalBumpTex,
    bumpScale: 0.03,
  });

  const brushedAlloyMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    metalness: 0.94,
    roughness: 0.14,
    anisotropy: 0.85,
    clearcoat: 0.65,
  });

  const coreGlowMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.85,
    roughness: 0.18,
    metalness: 0.2,
  });

  const hexFrameGeo = createExtrudedHexBracket(2.7, 0.48);
  const frameA = new THREE.Mesh(hexFrameGeo, obsidianHullMat);
  frameA.castShadow = true;
  frameA.receiveShadow = true;
  group.add(frameA);

  const innerTorus = new THREE.Mesh(
    new THREE.TorusGeometry(1.95, 0.12, 16, 48),
    brushedAlloyMat
  );
  innerTorus.castShadow = true;
  group.add(innerTorus);

  const corePivot = new THREE.Group();
  group.add(corePivot);

  if (project.artifactKind === 'rpg-monolith') {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), coreGlowMat);
    crystal.scale.set(0.72, 1.48, 0.72);
    corePivot.add(crystal);

    const guardRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.08, 12, 36), brushedAlloyMat);
    guardRing.rotation.x = Math.PI / 2;
    corePivot.add(guardRing);
  } else if (project.artifactKind === 'android-core') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.1, 0.24), obsidianHullMat);
    corePivot.add(body);

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.94, 1.8, 0.27), coreGlowMat);
    corePivot.add(screen);

    const bezelTop = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.98, 12), brushedAlloyMat);
    bezelTop.rotation.z = Math.PI / 2;
    bezelTop.position.y = 1.1;
    corePivot.add(bezelTop);
  } else if (project.artifactKind === 'synth-resonator') {
    const lathePts = [
      new THREE.Vector2(0.16, -1.2),
      new THREE.Vector2(0.92, -0.55),
      new THREE.Vector2(0.48, 0.0),
      new THREE.Vector2(1.02, 0.6),
      new THREE.Vector2(0.22, 1.2),
    ];
    const resonator = new THREE.Mesh(new THREE.LatheGeometry(lathePts, 24), brushedAlloyMat);
    corePivot.add(resonator);

    const pulseSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.68, 1), coreGlowMat);
    corePivot.add(pulseSphere);
  } else {
    const sphereCore = new THREE.Mesh(new THREE.SphereGeometry(0.76, 24, 24), coreGlowMat);
    corePivot.add(sphereCore);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.08, 12, 40), brushedAlloyMat);
    ring1.rotation.x = Math.PI / 3;
    corePivot.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.06, 12, 40), obsidianHullMat);
    ring2.rotation.y = Math.PI / 3;
    corePivot.add(ring2);
  }

  const nodeGeo = new THREE.ConeGeometry(0.2, 0.62, 6);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const node = new THREE.Mesh(nodeGeo, brushedAlloyMat);
    node.position.set(Math.cos(a) * 2.85, Math.sin(a) * 2.85, 0);
    node.rotation.z = a - Math.PI / 2;
    group.add(node);
  }

  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hitTarget = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 12), hitProxyMat);
  hitTarget.userData = { projectId: project.id, projectTitle: project.title };
  group.add(hitTarget);

  const baseY = project.worldPosition[1];
  return {
    group,
    hitTarget,
    update: (elapsed: number, dt: number, camera: THREE.Camera) => {
      const distSq = group.position.distanceToSquared(camera.position);
      if (distSq > 6800 * 6800) {
        group.visible = false;
        return;
      }
      group.visible = true;
      group.position.y = baseY + Math.sin(elapsed * 0.9 + project.orbitalProgress * 12) * 2.2;
      frameA.rotation.z += dt * 0.25;
      innerTorus.rotation.x += dt * 0.45;
      innerTorus.rotation.y += dt * 0.28;
      corePivot.rotation.y += dt * 0.65;
    },
  };
}

export function createCarinaNebulaGroup(
  nebulaSmokeA: THREE.CanvasTexture,
  nebulaSmokeB: THREE.CanvasTexture,
  starSpriteTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  update: (elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const group = new THREE.Group();
  group.position.set(-420, 85, -18900);
  group.scale.setScalar(13);

  const mats = [
    new THREE.SpriteMaterial({
      map: nebulaSmokeA,
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    new THREE.SpriteMaterial({
      map: nebulaSmokeB,
      color: 0xe879f9,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    new THREE.SpriteMaterial({
      map: nebulaSmokeA,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  ];

  const cloudSprites: { sprite: THREE.Sprite; baseRot: number; speed: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const sprite = new THREE.Sprite(mats[i % mats.length]);
    const pillar = i % 3;
    const x = (pillar - 1) * 16 + Math.sin(i * 1.4) * 6;
    const y = ((i % 8) - 3.5) * 4.2;
    const z = Math.cos(i * 2.1) * 28;
    sprite.position.set(x, y, z);
    const scale = 26 + (i % 4) * 11;
    sprite.scale.set(scale, scale, 1);
    group.add(sprite);
    cloudSprites.push({ sprite, baseRot: i * 0.4, speed: (i % 2 === 0 ? 1 : -1) * 0.05 });
  }

  // Luminous newborn protostars embedded inside Carina pillars
  const starMat = new THREE.SpriteMaterial({
    map: starSpriteTex,
    color: 0xfef08a,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 8; i++) {
    const star = new THREE.Sprite(starMat);
    star.position.set(
      Math.cos(i * 1.9) * 18,
      Math.sin(i * 2.3) * 10,
      Math.sin(i * 1.2) * 24
    );
    const s = 3.5 + (i % 3) * 1.8;
    star.scale.set(s, s, 1);
    group.add(star);
  }

  return {
    group,
    update: (elapsed: number, _dt: number, camera: THREE.Camera) => {
      const distSq = group.position.distanceToSquared(camera.position);
      if (distSq > 9500 * 9500) {
        group.visible = false;
        return;
      }
      group.visible = true;
      for (const item of cloudSprites) {
        item.sprite.material.rotation = item.baseRot + elapsed * item.speed;
      }
    },
  };
}

export function createCygnusBinaryGroup(
  starSpriteTex: THREE.CanvasTexture,
  _metalBumpTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  update: (elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const group = new THREE.Group();
  group.position.set(-480, 78, -24200);
  group.scale.setScalar(16);

  // 1. Blue Supergiant Companion Star (HDE 226868)
  const supergiantMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPos;
      void main() {
        vec3 p = normalize(vPos);
        float c1 = sin(p.x * 4.2 + p.z * 3.1 + uTime * 0.75);
        float c2 = cos(p.y * 5.3 - p.x * 2.7 - uTime * 0.95);
        float c3 = sin((p.z + p.y) * 6.8 + uTime * 1.25);
        float wave = clamp(0.5 + 0.24 * c1 + 0.16 * c2 + 0.10 * c3, 0.0, 1.0);
        vec3 deepCyan = vec3(0.06, 0.42, 0.94);
        vec3 brightBlue = vec3(0.58, 0.94, 1.0);
        vec3 col = mix(deepCyan, brightBlue, wave);
        float rim = pow(1.0 - max(0.0, vNormal.z), 2.2);
        col += vec3(0.45, 0.88, 1.0) * rim * 1.1;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const supergiant = new THREE.Mesh(new THREE.SphereGeometry(4.8, 40, 40), supergiantMat);
  supergiant.position.set(-8.5, 1.2, 0);
  group.add(supergiant);

  const supergiantGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: starSpriteTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  supergiantGlow.scale.set(22, 22, 1);
  supergiant.add(supergiantGlow);

  // 2. Compact Relativistic Companion / Cygnus X-1 Pulsar Core
  const pulsarGroup = new THREE.Group();
  pulsarGroup.position.set(8.5, -0.5, 2.0);
  group.add(pulsarGroup);

  const compactCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x050816 })
  );
  pulsarGroup.add(compactCore);

  // 3. Swirling Cyan-Violet Accretion Disk around Cygnus X-1
  const cygDiskMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vPos;
      void main() {
        float r = length(vPos.xy);
        float a = atan(vPos.y, vPos.x);
        float normR = clamp((r - 2.0) / 5.8, 0.0, 1.0);
        float spiral = sin(a * 5.0 + r * 2.2 - uTime * 3.4) * 0.5 + 0.5;
        vec3 col = mix(vec3(0.35, 0.95, 1.0), vec3(0.65, 0.32, 0.98), normR);
        float alpha = smoothstep(0.0, 0.12, normR) * (1.0 - smoothstep(0.55, 1.0, normR)) * (0.45 + 0.55 * spiral);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const cygDisk = new THREE.Mesh(new THREE.RingGeometry(2.0, 7.8, 72, 4), cygDiskMat);
  cygDisk.rotation.x = Math.PI * 0.38;
  pulsarGroup.add(cygDisk);

  // 4-5. Volumetric Relativistic Polar Jets with smooth axial + radial fade (zero hard cap)
  const jetMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        // vUv.y = 1.0 at cone apex (near core), 0.0 at flared outer tip
        float axialFade = smoothstep(0.0, 0.78, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
        float softSide = pow(abs(dot(vNormal, normalize(vViewPos))), 1.35);
        float pulse = 0.78 + 0.22 * sin(vUv.y * 24.0 + uTime * 6.0);
        vec3 col = mix(vec3(0.45, 0.35, 0.98), vec3(0.42, 0.95, 1.0), vUv.y);
        gl_FragColor = vec4(col, axialFade * softSide * pulse * 0.72);
      }
    `,
  });
  const jetGeo = new THREE.ConeGeometry(1.5, 22, 28, 1, true);
  const jetNorth = new THREE.Mesh(jetGeo, jetMat);
  jetNorth.position.y = 10.5;
  jetNorth.rotation.x = Math.PI;
  pulsarGroup.add(jetNorth);

  const jetSouth = new THREE.Mesh(jetGeo, jetMat);
  jetSouth.position.y = -10.5;
  pulsarGroup.add(jetSouth);

  // 6. Tidal Plasma Stream curving from Supergiant to Pulsar
  const streamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.5, 0.9, 0.2),
    new THREE.Vector3(-0.5, 1.8, 1.5),
    new THREE.Vector3(3.8, 0.8, 2.2),
    new THREE.Vector3(6.8, -0.3, 2.0),
  ]);
  const streamMesh = new THREE.Mesh(
    new THREE.TubeGeometry(streamCurve, 40, 0.28, 10, false),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(streamMesh);

  // 7. Soft Magnetized Plasma Corona Ring (replaces flat wire torus)
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;
      void main() {
        float edge = pow(abs(dot(vNormal, normalize(vViewPos))), 1.8);
        float flow = 0.65 + 0.35 * sin(vUv.x * 16.0 - uTime * 2.5);
        vec3 col = mix(vec3(0.22, 0.78, 1.0), vec3(0.62, 0.35, 0.96), 0.45);
        gl_FragColor = vec4(col, edge * flow * 0.42);
      }
    `,
  });
  const obsRing = new THREE.Mesh(
    new THREE.TorusGeometry(8.8, 0.28, 18, 72),
    haloMat
  );
  obsRing.rotation.x = Math.PI * 0.25;
  pulsarGroup.add(obsRing);

  return {
    group,
    update: (elapsed: number, dt: number, camera: THREE.Camera) => {
      const distSq = group.position.distanceToSquared(camera.position);
      if (distSq > 9500 * 9500) {
        group.visible = false;
        return;
      }
      group.visible = true;
      supergiantMat.uniforms.uTime.value = elapsed;
      cygDiskMat.uniforms.uTime.value = elapsed;
      jetMat.uniforms.uTime.value = elapsed;
      haloMat.uniforms.uTime.value = elapsed;
      supergiant.rotation.y += dt * 0.14;
      pulsarGroup.rotation.z = Math.sin(elapsed * 0.35) * 0.16;
      cygDisk.rotation.z -= dt * 0.45;
      obsRing.rotation.y += dt * 0.22;
    },
  };
}

export function createBlackHoleGroup(): {
  group: THREE.Group;
  update: (elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const group = new THREE.Group();
  group.position.set(0, 32, -37800);
  group.scale.setScalar(26);

  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(6.8, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  group.add(horizon);

  const photonRimMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float rim = pow(0.64 - dot(vNormal, viewDir), 4.0);
        vec3 col = mix(vec3(1.0, 0.48, 0.1), vec3(1.0, 0.92, 0.72), rim);
        gl_FragColor = vec4(col, max(0.0, rim) * 1.45);
      }
    `,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(7.3, 48, 48), photonRimMat));

  const diskGeo = new THREE.RingGeometry(7.5, 22.5, 96, 8);
  const diskMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vLocalPos;
      void main() {
        float r = length(vLocalPos.xy);
        float angle = atan(vLocalPos.y, vLocalPos.x);
        float normR = clamp((r - 7.5) / (22.5 - 7.5), 0.0, 1.0);

        float spiral = sin(angle * 4.0 + r * 1.15 - uTime * 2.2) * 0.5 + 0.5;
        float fineBands = sin(r * 3.6 - uTime * 1.4 + angle * 2.0) * 0.5 + 0.5;
        float heat = (1.0 - normR) * 0.78 + spiral * 0.25 + fineBands * 0.18;

        vec3 innerWhite = vec3(1.0, 0.94, 0.8);
        vec3 midAmber = vec3(0.98, 0.52, 0.12);
        vec3 outerCrimson = vec3(0.55, 0.14, 0.28);

        vec3 col = mix(outerCrimson, midAmber, smoothstep(0.05, 0.55, 1.0 - normR));
        col = mix(col, innerWhite, smoothstep(0.65, 0.98, heat));

        float edgeFade = smoothstep(0.0, 0.08, normR) * (1.0 - smoothstep(0.58, 1.0, normR));
        float alpha = edgeFade * (0.45 + 0.55 * spiral * fineBands);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const diskMesh = new THREE.Mesh(diskGeo, diskMat);
  diskMesh.rotation.x = Math.PI * 0.41;
  diskMesh.rotation.y = 0.18;
  group.add(diskMesh);

  const lensedHaloMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float edge = pow(abs(dot(vNormal, viewDir)), 1.6);
        float shimmer = 0.8 + 0.2 * sin(vUv.x * 18.0 + uTime * 1.6);
        vec3 col = mix(vec3(0.95, 0.45, 0.12), vec3(1.0, 0.88, 0.65), edge);
        gl_FragColor = vec4(col, edge * shimmer * 0.58);
      }
    `,
  });
  const lensedHalo = new THREE.Mesh(
    new THREE.TorusGeometry(7.9, 0.66, 24, 96),
    lensedHaloMat
  );
  lensedHalo.rotation.y = 0.14;
  group.add(lensedHalo);

  return {
    group,
    update: (elapsed: number, dt: number, camera: THREE.Camera) => {
      const distSq = group.position.distanceToSquared(camera.position);
      if (distSq > 12000 * 12000) {
        group.visible = false;
        return;
      }
      group.visible = true;
      diskMat.uniforms.uTime.value = elapsed;
      lensedHaloMat.uniforms.uTime.value = elapsed;
      diskMesh.rotation.z -= dt * 0.15;
      lensedHalo.rotation.z += dt * 0.06;
    },
  };
}

export function createMegaExoplanetsGroup(sets: {
  gasViolet: PlanetTextureSet;
  gasAmber: PlanetTextureSet;
  volcanic: PlanetTextureSet;
  ice: PlanetTextureSet;
  asteroidBump: THREE.CanvasTexture;
}): {
  group: THREE.Group;
  update: (elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const root = new THREE.Group();

  const specs: Array<{
    pos: Vec3Tuple;
    radius: number;
    tex: PlanetTextureSet;
    atmoRgb: [number, number, number];
    hasRings?: boolean;
    ringColor?: number;
    moons: number;
    spinSpeed: number;
  }> = [
    {
      pos: [440, -35, -1950],
      radius: 90,
      tex: sets.ice,
      atmoRgb: [0.4, 0.85, 1.0],
      moons: 2,
      spinSpeed: 0.045,
    },
    {
      pos: [590, -75, -6300],
      radius: 120,
      tex: sets.gasViolet,
      atmoRgb: [0.65, 0.4, 1.0],
      hasRings: true,
      ringColor: 0xc4b5fd,
      moons: 2,
      spinSpeed: 0.032,
    },
    {
      pos: [-720, 105, -11800],
      radius: 105,
      tex: sets.volcanic,
      atmoRgb: [1.0, 0.45, 0.14],
      moons: 2,
      spinSpeed: 0.04,
    },
    {
      pos: [760, -70, -16600],
      radius: 125,
      tex: sets.gasAmber,
      atmoRgb: [0.98, 0.72, 0.28],
      hasRings: true,
      ringColor: 0xfde68a,
      moons: 3,
      spinSpeed: 0.028,
    },
    {
      pos: [680, -85, -21400],
      radius: 108,
      tex: sets.ice,
      atmoRgb: [0.28, 0.88, 0.96],
      hasRings: true,
      ringColor: 0x7dd3fc,
      moons: 2,
      spinSpeed: 0.036,
    },
    {
      pos: [810, 110, -26900],
      radius: 135,
      tex: sets.gasAmber,
      atmoRgb: [0.95, 0.62, 0.25],
      moons: 3,
      spinSpeed: 0.025,
    },
    {
      pos: [690, -80, -31200],
      radius: 100,
      tex: sets.volcanic,
      atmoRgb: [0.95, 0.36, 0.18],
      moons: 2,
      spinSpeed: 0.038,
    },
    {
      pos: [820, 75, -35400],
      radius: 125,
      tex: sets.gasViolet,
      atmoRgb: [0.58, 0.38, 0.98],
      hasRings: true,
      ringColor: 0xa78bfa,
      moons: 2,
      spinSpeed: 0.03,
    },
  ];

  const animatedPlanets: Array<{
    pGroup: THREE.Group;
    lod: THREE.LOD;
    planetMesh: THREE.Mesh;
    moonOrbit: THREE.Group;
    spinSpeed: number;
  }> = [];

  const sphereHiGeo = new THREE.SphereGeometry(1, 40, 32);
  const sphereMidGeo = new THREE.SphereGeometry(1, 16, 12);
  const sphereLowGeo = new THREE.SphereGeometry(1, 9, 7);
  const moonGeo = new THREE.DodecahedronGeometry(1, 1);
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.82,
    metalness: 0.18,
    bumpMap: sets.asteroidBump,
    bumpScale: 0.25,
  });

  for (const spec of specs) {
    const pGroup = new THREE.Group();
    pGroup.position.set(...spec.pos);

    const lod = new THREE.LOD();
    const hiLevel = new THREE.Group();
    const midLevel = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: spec.tex.map,
      bumpMap: spec.tex.bumpMap,
      bumpScale: 0.35,
      roughnessMap: spec.tex.roughnessMap,
      roughness: 0.82,
      metalness: 0.14,
    });
    const planetMesh = new THREE.Mesh(sphereHiGeo, mat);
    planetMesh.scale.setScalar(spec.radius);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    hiLevel.add(planetMesh);

    const [ar, ag, ab] = spec.atmoRgb;
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec3 viewDir = normalize(vViewPos);
          float intensity = pow(0.68 - dot(vNormal, viewDir), 3.0);
          gl_FragColor = vec4(${ar.toFixed(2)}, ${ag.toFixed(2)}, ${ab.toFixed(2)}, 1.0) * max(0.0, intensity) * 1.1;
        }
      `,
    });
    const atmo = new THREE.Mesh(sphereMidGeo, atmoMat);
    atmo.scale.setScalar(spec.radius * 1.07);
    hiLevel.add(atmo);

    // Mid LOD simplified sphere + optional single ring
    const midSphere = new THREE.Mesh(
      sphereMidGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: spec.tex.map, roughness: 0.85 })
    );
    midSphere.scale.setScalar(spec.radius);
    midLevel.add(midSphere);

    // Low LOD beacon sphere for distant horizon
    const lowSphere = new THREE.Mesh(
      sphereLowGeo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(ar * 0.85, ag * 0.85, ab * 0.85),
      })
    );
    lowSphere.scale.setScalar(spec.radius);

    if (spec.hasRings) {
      const rInnerMat = new THREE.MeshStandardMaterial({
        color: spec.ringColor ?? 0xe2e8f0,
        roughness: 0.72,
        metalness: 0.25,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.58,
      });
      const rInner = new THREE.Mesh(
        new THREE.RingGeometry(spec.radius * 1.28, spec.radius * 1.62, 64),
        rInnerMat
      );
      rInner.rotation.x = Math.PI * 0.41;
      rInner.rotation.y = 0.24;
      hiLevel.add(rInner);

      const rOuter = new THREE.Mesh(
        new THREE.RingGeometry(spec.radius * 1.68, spec.radius * 1.82, 64),
        new THREE.MeshPhysicalMaterial({
          color: spec.ringColor ?? 0xffffff,
          metalness: 0.78,
          roughness: 0.24,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.44,
        })
      );
      rOuter.rotation.x = Math.PI * 0.41;
      rOuter.rotation.y = 0.24;
      hiLevel.add(rOuter);

      const midRing = new THREE.Mesh(
        new THREE.RingGeometry(spec.radius * 1.28, spec.radius * 1.75, 24),
        rInnerMat
      );
      midRing.rotation.x = Math.PI * 0.41;
      midRing.rotation.y = 0.24;
      midLevel.add(midRing);
    }

    const moonOrbit = new THREE.Group();
    for (let m = 0; m < spec.moons; m++) {
      const moon = new THREE.Mesh(moonGeo, moonMat);
      const dist = spec.radius * (1.42 + m * 0.34);
      const angle = (m / spec.moons) * Math.PI * 2 + 0.6;
      moon.position.set(
        Math.cos(angle) * dist,
        ((m % 2 === 0 ? 1 : -1) * spec.radius) * 0.18,
        Math.sin(angle) * dist
      );
      moon.scale.setScalar(spec.radius * (0.11 + m * 0.025));
      moonOrbit.add(moon);
    }
    hiLevel.add(moonOrbit);

    lod.addLevel(hiLevel, 0);
    lod.addLevel(midLevel, 2000);
    lod.addLevel(lowSphere, 5200);
    pGroup.add(lod);

    root.add(pGroup);
    animatedPlanets.push({
      pGroup,
      lod,
      planetMesh,
      moonOrbit,
      spinSpeed: spec.spinSpeed,
    });
  }

  return {
    group: root,
    update: (_elapsed: number, dt: number, camera: THREE.Camera) => {
      for (const item of animatedPlanets) {
        const distSq = item.pGroup.position.distanceToSquared(camera.position);
        if (distSq > 9500 * 9500) {
          item.pGroup.visible = false;
          continue;
        }
        item.pGroup.visible = true;
        item.lod.update(camera);
        if (distSq < 2500 * 2500) {
          item.planetMesh.rotation.y += dt * item.spinSpeed;
          item.moonOrbit.rotation.y += dt * item.spinSpeed * 2.4;
        }
      }
    },
  };
}

function createDeformedRockGeometry(
  baseKind: 'crag' | 'boulder' | 'crystal',
  seedOffset: number,
  detail: 0 | 2
): THREE.BufferGeometry {
  const geo =
    baseKind === 'crystal'
      ? new THREE.OctahedronGeometry(0.95, detail)
      : baseKind === 'crag'
      ? new THREE.IcosahedronGeometry(0.9, detail)
      : new THREE.DodecahedronGeometry(0.92, detail);

  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const n1 =
      Math.sin(x * 3.8 + seedOffset) *
      Math.cos(y * 4.4 - seedOffset * 0.7) *
      Math.sin(z * 3.5 + seedOffset * 1.3);
    const n2 = detail > 0 ? Math.cos(x * 8.1 - y * 6.9 + z * 7.4 + seedOffset) * 0.12 : 0;
    const factor =
      baseKind === 'crystal'
        ? 0.86 + Math.abs(n1) * 0.34 + n2 * 0.5
        : 0.82 + (n1 + 1) * 0.18 + n2;
    const stretchY = baseKind === 'crystal' ? 1.28 : 0.84;
    posAttr.setXYZ(i, x * factor, y * factor * stretchY, z * factor);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createAsteroidBeltInstanced(
  totalCount: number,
  bumpTex: THREE.CanvasTexture
): {
  mesh: THREE.Group;
  update: (elapsed: number, camera: THREE.Camera) => void;
} {
  const group = new THREE.Group();

  // 5 Distinct Astronomical Belt Zones spaced far apart across 36,600 units (never clustered)
  const beltZones = [
    { centerZ: -5600, spanZ: 1800, minSpread: 135, maxSpread: 410 },
    { centerZ: -11600, spanZ: 2100, minSpread: 150, maxSpread: 440 },
    { centerZ: -16800, spanZ: 2000, minSpread: 145, maxSpread: 430 },
    { centerZ: -28600, spanZ: 2400, minSpread: 165, maxSpread: 490 },
    { centerZ: -35200, spanZ: 1900, minSpread: 155, maxSpread: 460 },
  ];

  const kinds: Array<{
    kind: 'crag' | 'boulder' | 'crystal';
    seed: number;
    palette: [number, number, number];
    metalness: number;
    roughness: number;
  }> = [
    {
      kind: 'boulder',
      seed: 1.7,
      palette: [0x475569, 0x6b5142, 0x334155],
      metalness: 0.2,
      roughness: 0.84,
    },
    {
      kind: 'crag',
      seed: 4.3,
      palette: [0x27303f, 0x5c4033, 0x3f4756],
      metalness: 0.34,
      roughness: 0.74,
    },
    {
      kind: 'crystal',
      seed: 8.9,
      palette: [0x2b6cb0, 0x4c51bf, 0x475569],
      metalness: 0.68,
      roughness: 0.32,
    },
  ];

  const hiGeos = kinds.map((cfg) => createDeformedRockGeometry(cfg.kind, cfg.seed, 2));
  const loGeos = kinds.map((cfg) => createDeformedRockGeometry(cfg.kind, cfg.seed, 0));
  const materials = kinds.map(
    (cfg) =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: cfg.roughness,
        metalness: cfg.metalness,
        bumpMap: bumpTex,
        bumpScale: 0.28,
      })
  );
  const loMaterials = kinds.map(
    (cfg) =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: cfg.roughness,
        metalness: cfg.metalness,
      })
  );

  const perBeltKindCount = Math.max(24, Math.floor(totalCount / (beltZones.length * 3)));
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const beltEntries: Array<{
    zoneAnchor: THREE.Vector3;
    container: THREE.Group;
    lod: THREE.LOD;
  }> = [];

  beltZones.forEach((zone, zIdx) => {
    const container = new THREE.Group();
    container.position.set(0, 14, zone.centerZ);

    const lod = new THREE.LOD();
    const hiGroup = new THREE.Group();
    const loGroup = new THREE.Group();

    kinds.forEach((cfg, kIdx) => {
      const hiInst = new THREE.InstancedMesh(
        hiGeos[kIdx],
        materials[kIdx],
        perBeltKindCount
      );
      const loInst = new THREE.InstancedMesh(
        loGeos[kIdx],
        loMaterials[kIdx],
        perBeltKindCount
      );

      for (let i = 0; i < perBeltKindCount; i++) {
        const localZ = ((i / perBeltKindCount) - 0.5) * zone.spanZ;
        const worldZ = zone.centerZ + localZ;
        const angle = (i + zIdx * 37 + kIdx * 71) * 2.39996;
        const isMegalith = i % 9 === 0;
        const spread = isMegalith
          ? zone.minSpread + 70 + ((i * 23) % (zone.maxSpread - zone.minSpread))
          : zone.minSpread + ((i * 19) % (zone.maxSpread - zone.minSpread));

        let x = Math.cos(angle) * spread;
        if (Math.abs(x) < 110) {
          x = (x >= 0 ? 1 : -1) * (110 + (i % 7) * 14);
        }
        let y = Math.sin(angle * 1.25) * (isMegalith ? 130 : 85 + (i % 6) * 18);

        for (const lm of COSMIC_LANDMARKS) {
          const safeR = lm.sectorId === 'projects' ? 140 : Math.min(260, lm.radius * 0.85);
          const dx = x - lm.position[0];
          const dy = y + 14 - lm.position[1];
          const dz = worldZ - lm.position[2];
          if (dx * dx + dy * dy + dz * dz < safeR * safeR) {
            x += (x >= 0 ? 1 : -1) * safeR;
            y += (i % 2 === 0 ? 1 : -1) * 45;
          }
        }

        dummy.position.set(x, y, localZ);
        dummy.rotation.set(
          (i * 0.73 + kIdx) % Math.PI,
          (i * 1.15) % Math.PI,
          (i * 0.42) % Math.PI
        );
        const scale = isMegalith
          ? 16 + ((i * 13) % 14)
          : 2.8 + ((i * 17) % 90) / 14;
        dummy.scale.set(scale, scale * 0.84, scale * 1.12);
        dummy.updateMatrix();

        hiInst.setMatrixAt(i, dummy.matrix);
        loInst.setMatrixAt(i, dummy.matrix);
        color.setHex(cfg.palette[i % cfg.palette.length]);
        hiInst.setColorAt(i, color);
        loInst.setColorAt(i, color);
      }

      hiInst.instanceMatrix.needsUpdate = true;
      loInst.instanceMatrix.needsUpdate = true;
      if (hiInst.instanceColor) hiInst.instanceColor.needsUpdate = true;
      if (loInst.instanceColor) loInst.instanceColor.needsUpdate = true;
      hiInst.computeBoundingSphere();
      loInst.computeBoundingSphere();
      hiGroup.add(hiInst);
      loGroup.add(loInst);
    });

    lod.addLevel(hiGroup, 0);
    lod.addLevel(loGroup, 2400);
    container.add(lod);
    group.add(container);

    beltEntries.push({
      zoneAnchor: new THREE.Vector3(0, 14, zone.centerZ),
      container,
      lod,
    });
  });

  return {
    mesh: group,
    update: (elapsed: number, camera: THREE.Camera) => {
      for (const belt of beltEntries) {
        const dz = Math.abs(camera.position.z - belt.zoneAnchor.z);
        if (dz > 5800) {
          belt.container.visible = false;
          continue;
        }
        belt.container.visible = true;
        belt.lod.update(camera);
        belt.container.rotation.z = Math.sin(elapsed * 0.02) * 0.01;
      }
    },
  };
}

export function createStarfieldAndNebula(
  starSpriteTex: THREE.CanvasTexture,
  nebulaSmokeA: THREE.CanvasTexture,
  nebulaSmokeB: THREE.CanvasTexture
): {
  group: THREE.Group;
  update: (elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const group = new THREE.Group();

  // 1. Dense Deep-Space Starfield spanning z = +1600 to z = -42,500
  const starCount = 24000;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const palette = [
    new THREE.Color(0xe0f2fe),
    new THREE.Color(0xfffbeb),
    new THREE.Color(0xfdba74),
    new THREE.Color(0xc4b5fd),
    new THREE.Color(0x67e8f9),
    new THREE.Color(0xf9a8d4),
  ];

  for (let i = 0; i < starCount; i++) {
    const angle = i * 2.39996;
    const radius = 160 + ((i * 223) % 6200);
    const z = 1600 - (i / starCount) * 44100;
    starPositions[i * 3] = Math.cos(angle) * radius;
    starPositions[i * 3 + 1] = Math.sin(angle) * radius * 0.85 + 280;
    starPositions[i * 3 + 2] = z;

    const c = palette[i % palette.length];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 16,
    map: starSpriteTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    fog: false,
  });
  const starPoints = new THREE.Points(starGeo, starMat);
  group.add(starPoints);

  // 1b. Luminous Fine Cosmic Dust & Shimmering Micro-Sparkles around Flight Corridor
  const dustCount = 14000;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustColors = new Float32Array(dustCount * 3);
  const dustPalette = [
    new THREE.Color(0x38bdf8),
    new THREE.Color(0xe879f9),
    new THREE.Color(0xfbbf24),
    new THREE.Color(0xa78bfa),
    new THREE.Color(0x34d399),
  ];

  for (let i = 0; i < dustCount; i++) {
    const angle = i * 1.6180339;
    const radius = 38 + ((i * 97) % 1350);
    const z = 1000 - (i / dustCount) * 41500;
    dustPositions[i * 3] = Math.cos(angle) * radius;
    dustPositions[i * 3 + 1] = Math.sin(angle * 1.3) * radius * 0.65 + 24;
    dustPositions[i * 3 + 2] = z;

    const c = dustPalette[i % dustPalette.length];
    dustColors[i * 3] = c.r;
    dustColors[i * 3 + 1] = c.g;
    dustColors[i * 3 + 2] = c.b;
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

  const dustMat = new THREE.PointsMaterial({
    size: 7.5,
    map: starSpriteTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  group.add(dustPoints);

  // 2. Pleiades Seven Sisters Bright Sapphire Cluster (12x scale, positioned at z = -29,100)
  const pleiadesGroup = new THREE.Group();
  pleiadesGroup.position.set(-560, 120, -29100);
  pleiadesGroup.scale.setScalar(12);
  const sisterOffsets: Vec3Tuple[] = [
    [0, 0, 0],
    [-4.5, 2.2, -3],
    [4.2, -1.8, 2.5],
    [-2.5, -3.4, 4.0],
    [5.8, 2.8, -4.5],
    [-6.0, 0.5, 5.5],
    [2.0, 4.5, 3.0],
  ];
  const sisterMat = new THREE.SpriteMaterial({
    map: starSpriteTex,
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const [sx, sy, sz] of sisterOffsets) {
    const s = new THREE.Sprite(sisterMat);
    s.position.set(sx, sy, sz);
    s.scale.set(6.5, 6.5, 1);
    pleiadesGroup.add(s);
  }
  group.add(pleiadesGroup);

  // 3. Spaced Distant Deep-Space Nebula Regions (with LOD distance culling)
  const cloudMats: THREE.SpriteMaterial[] = [
    new THREE.SpriteMaterial({
      map: nebulaSmokeA,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    new THREE.SpriteMaterial({
      map: nebulaSmokeB,
      color: 0xa855f7,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    new THREE.SpriteMaterial({
      map: nebulaSmokeA,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  ];

  const nebulaClouds: {
    sprite: THREE.Sprite;
    baseRot: number;
    speed: number;
    z: number;
  }[] = [];
  const cloudCount = 150;
  for (let i = 0; i < cloudCount; i++) {
    const mat = cloudMats[i % cloudMats.length];
    const sprite = new THREE.Sprite(mat);
    const z = 400 - (i / cloudCount) * 38400;
    const angle = i * 1.95;
    const rad = 540 + (i % 7) * 280;
    sprite.position.set(Math.cos(angle) * rad, Math.sin(angle) * (rad * 0.55) + 60, z);
    const scale = 580 + (i % 4) * 240;
    sprite.scale.set(scale, scale, 1);
    group.add(sprite);
    nebulaClouds.push({
      sprite,
      baseRot: i * 0.5,
      speed: (i % 2 === 0 ? 1 : -1) * 0.02,
      z,
    });
  }

  return {
    group,
    update: (elapsed: number, dt: number, camera: THREE.Camera) => {
      dustPoints.rotation.z += dt * 0.008;
      pleiadesGroup.visible =
        Math.abs(camera.position.z - pleiadesGroup.position.z) < 9500;
      for (const s of nebulaClouds) {
        const dz = Math.abs(camera.position.z - s.z);
        s.sprite.visible = dz < 11000;
        if (s.sprite.visible) {
          s.sprite.material.rotation = s.baseRot + elapsed * s.speed;
        }
      }
    },
  };
}
