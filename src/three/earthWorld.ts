import * as THREE from 'three';
import { EARTH_ORIGIN } from '../data/portfolioData';
import { earthTerrainHeightAt } from '../utils/galaxyNavigation';

function seededRand(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 41.233) * 43758.5453;
  return s - Math.floor(s);
}

function createTerrainDetailTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 950; i++) {
    const x = seededRand(i * 3 + 1) * size;
    const y = seededRand(i * 7 + 2) * size;
    const r = 1 + seededRand(i * 11 + 3) * 4;
    const shade = Math.floor(205 + seededRand(i * 13 + 5) * 48);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(42, 48);
  tex.needsUpdate = true;
  return tex;
}

export function createEarthWorldGroup(
  nebulaSmokeTex: THREE.CanvasTexture,
  starSpriteTex: THREE.CanvasTexture,
  asteroidBumpTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  update: (elapsed: number, camera: THREE.Camera) => void;
  dispose: () => void;
} {
  const root = new THREE.Group();
  root.position.set(...EARTH_ORIGIN);

  // 1. Golden-hour Earth Sky Dome + Radiant Sun Disc (centered on camera when active)
  const skyDomeGeo = new THREE.SphereGeometry(18500, 32, 24);
  const skyDomeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(0.22, 0.24, -0.94).normalize() },
    },
    vertexShader: `
      varying vec3 vLocalDir;
      void main() {
        vLocalDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      varying vec3 vLocalDir;
      void main() {
        vec3 dir = normalize(vLocalDir);
        float h = clamp(dir.y, -0.25, 1.0);
        vec3 zenith = vec3(0.08, 0.34, 0.72);
        vec3 midSky = vec3(0.38, 0.71, 0.94);
        vec3 horizon = vec3(0.95, 0.85, 0.72);
        vec3 seaMist = vec3(0.55, 0.76, 0.88);

        vec3 col = mix(horizon, midSky, smoothstep(0.0, 0.28, max(0.0, h)));
        col = mix(col, zenith, smoothstep(0.28, 0.88, max(0.0, h)));
        if (h < 0.0) {
          col = mix(horizon, seaMist, smoothstep(0.0, -0.22, h));
        }

        float sunDot = max(0.0, dot(dir, uSunDir));
        col += vec3(1.0, 0.78, 0.48) * pow(sunDot, 9.0) * 0.45;
        col += vec3(1.0, 0.96, 0.84) * smoothstep(0.9965, 0.9992, sunDot) * 1.4;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyDomeGeo, skyDomeMat);
  root.add(skyDome);

  // 2. Massive 10x Mountain-to-Valley-to-Beach Vertex-Colored Terrain
  const widthX = 11000;
  const lengthZ = 13000;
  const terrainGeo = new THREE.PlaneGeometry(widthX, lengthZ, 175, 210);
  terrainGeo.rotateX(-Math.PI / 2);
  // Shift plane so localZ spans from +1400 (mountain backdrop) to -11600 (ocean seabed)
  terrainGeo.translate(0, 0, -5100);

  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const cSnow = new THREE.Color(0xf8fafc);
  const cIce = new THREE.Color(0xdbeafe);
  const cCliff = new THREE.Color(0x64748b);
  const cAlpine = new THREE.Color(0x166534);
  const cMeadow = new THREE.Color(0x4d7c0f);
  const cCoastalGrass = new THREE.Color(0x84cc16);
  const cSand = new THREE.Color(0xf3d9a4);
  const cWetSand = new THREE.Color(0xb6955e);
  const cSeabed = new THREE.Color(0x0f766e);
  const tempCol = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = earthTerrainHeightAt(x, z);
    posAttr.setY(i, y);

    // Estimate local slope cleanly for realistic snow vs exposed rock cliff shading
    const hx = earthTerrainHeightAt(x + 28, z);
    const hz = earthTerrainHeightAt(x, z - 28);
    const slope = Math.hypot((hx - y) / 28, (hz - y) / 28);
    const noiseTint = seededRand(Math.round(x * 0.3) * 17 + Math.round(z * 0.3) * 31) * 0.08;

    if (y <= 0.35) {
      tempCol.copy(cWetSand).lerp(cSeabed, Math.min(1, Math.max(0, -y / 14)));
    } else if (z < -8180 && y < 18) {
      const wetT = Math.min(1, Math.max(0, (y - 0.35) / 3.4));
      tempCol.copy(cWetSand).lerp(cSand, wetT);
      if (z > -8420) {
        const grassMix = (-8180 - z) / 240;
        tempCol.copy(cCoastalGrass).lerp(cSand, Math.min(1, Math.max(0, grassMix)));
      }
    } else if (y > 840 && slope < 0.68) {
      tempCol.copy(cIce).lerp(cSnow, Math.min(1, (y - 840) / 220));
    } else if (slope > 0.56 || y > 760) {
      tempCol.copy(cCliff);
      if (y > 820 && slope < 0.85) {
        tempCol.lerp(cSnow, 0.38);
      }
    } else if (y > 260) {
      tempCol.copy(cAlpine).lerp(cCliff, Math.max(0, (y - 540) / 240));
    } else if (y > 24) {
      tempCol.copy(cMeadow).lerp(cAlpine, (y - 24) / 236);
    } else {
      tempCol.copy(cCoastalGrass).lerp(cMeadow, Math.max(0, (y - 10) / 14));
    }

    tempCol.offsetHSL(0, 0, noiseTint - 0.03);
    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const detailTex = createTerrainDetailTexture();
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: detailTex,
    bumpMap: asteroidBumpTex,
    bumpScale: 0.45,
    roughness: 0.88,
    metalness: 0.04,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  root.add(terrainMesh);

  // 3. Shimmering Animated Ocean & Shoreline Surf Shader (y = 0)
  const oceanGeo = new THREE.PlaneGeometry(24000, 16500, 84, 64);
  oceanGeo.rotateX(-Math.PI / 2);
  oceanGeo.translate(0, 0, -16400);

  const oceanMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.22, 0.24, -0.94).normalize() },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying float vWave;
      void main() {
        vec3 pos = position;
        float w1 = sin(pos.x * 0.015 + uTime * 1.4) * cos(pos.z * 0.02 + uTime * 1.1);
        float w2 = sin(pos.x * 0.04 - pos.z * 0.035 + uTime * 2.1) * 0.45;
        float wave = (w1 + w2) * 0.85;
        pos.y += wave;
        vWave = wave;
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = pos;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      varying vec3 vWorldPos;
      varying float vWave;
      void main() {
        // Approximate wave normal
        float nx = cos(vWorldPos.x * 0.015 + uTime * 1.4) * 0.14;
        float nz = sin(vWorldPos.z * 0.02 + uTime * 1.1) * 0.16;
        vec3 N = normalize(vec3(nx, 1.0, nz));

        vec3 shallowTurquoise = vec3(0.08, 0.68, 0.72);
        vec3 deepOcean = vec3(0.03, 0.24, 0.48);

        // Distance past shoreline (-8950)
        float distOffshore = clamp((-vWorldPos.z - 8920.0) / 1400.0, 0.0, 1.0);
        vec3 waterCol = mix(shallowTurquoise, deepOcean, distOffshore);

        // Warm golden sun glint across waves
        vec3 V = normalize(vec3(0.0, 0.25, 1.0));
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(0.0, dot(N, H)), 48.0);
        waterCol += vec3(1.0, 0.88, 0.62) * spec * 0.85;

        // Animated shoreline surf foam near beach edge (-8920..-8740)
        float surfZone = 1.0 - smoothstep(0.0, 165.0, abs(vWorldPos.z + 8890.0));
        float foamBands = sin(vWorldPos.z * 0.09 + uTime * 2.4 + vWorldPos.x * 0.01) * 0.5 + 0.5;
        float foam = surfZone * smoothstep(0.45, 0.92, foamBands + vWave * 0.25);
        waterCol = mix(waterCol, vec3(0.96, 0.99, 1.0), foam * 0.78);

        // Soft horizon blend
        float horizonFade = 1.0 - smoothstep(5500.0, 11500.0, -vWorldPos.z - 9000.0);
        gl_FragColor = vec4(waterCol, clamp(0.86 + foam * 0.12, 0.0, 0.98) * (0.35 + horizonFade * 0.65));
      }
    `,
  });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  root.add(oceanMesh);

  // 4. Composite 3-Part Procedural Pine Trees (Mountain Slopes & Valley)
  const pineCount = 460;
  const pineTrunkGeo = new THREE.CylinderGeometry(1.1, 1.8, 12, 6);
  pineTrunkGeo.translate(0, 6, 0);
  const pineLowerGeo = new THREE.ConeGeometry(8.5, 20, 7);
  pineLowerGeo.translate(0, 18, 0);
  const pineUpperGeo = new THREE.ConeGeometry(6.2, 16, 7);
  pineUpperGeo.translate(0, 29, 0);

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 });
  const pineLeafDarkMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 });
  const pineLeafTopMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.82 });

  const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, barkMat, pineCount);
  const pineLowers = new THREE.InstancedMesh(pineLowerGeo, pineLeafDarkMat, pineCount);
  const pineUppers = new THREE.InstancedMesh(pineUpperGeo, pineLeafTopMat, pineCount);

  const dummy = new THREE.Object3D();
  let placedPines = 0;
  for (let i = 0; i < 1600 && placedPines < pineCount; i++) {
    const r1 = seededRand(i * 11 + 3);
    const r2 = seededRand(i * 17 + 9);
    const r3 = seededRand(i * 23 + 15);
    const localZ = -900 - r1 * 6950;
    const corridorCenter = Math.sin((localZ / -8720) * Math.PI * 3.1) * 240;
    let localX = (r2 - 0.5) * 4200;
    if (Math.abs(localX - corridorCenter) < 105) {
      localX += localX >= corridorCenter ? 115 : -115;
    }
    const y = earthTerrainHeightAt(localX, localZ);
    if (y > 38 && y < 740) {
      const s = 0.85 + r3 * 0.95;
      dummy.position.set(localX, y - 0.8, localZ);
      dummy.rotation.set(0, r1 * Math.PI * 2, 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      pineTrunks.setMatrixAt(placedPines, dummy.matrix);
      pineLowers.setMatrixAt(placedPines, dummy.matrix);
      pineUppers.setMatrixAt(placedPines, dummy.matrix);
      placedPines++;
    }
  }
  pineTrunks.count = placedPines;
  pineLowers.count = placedPines;
  pineUppers.count = placedPines;
  pineTrunks.instanceMatrix.needsUpdate = true;
  pineLowers.instanceMatrix.needsUpdate = true;
  pineUppers.instanceMatrix.needsUpdate = true;
  root.add(pineTrunks, pineLowers, pineUppers);

  // 5. Composite Multi-Part Procedural Coastal Palm Trees along Beachfront
  const palmCount = 140;
  const palmTrunkGeo = new THREE.CylinderGeometry(0.55, 1.2, 18, 6);
  palmTrunkGeo.translate(0, 9, 0);
  // Natural splayed tropical palm canopy made of 2 crossed curved leaf tiers
  const palmFrondGeo = new THREE.CylinderGeometry(0.6, 11.5, 4.2, 5, 1, true);
  palmFrondGeo.translate(0, 17.5, 0);
  const palmCrownGeo = new THREE.CylinderGeometry(0.4, 8.4, 5.2, 5, 1, true);
  palmCrownGeo.rotateY(Math.PI / 5);
  palmCrownGeo.translate(0, 19.2, 0);

  const palmTrunks = new THREE.InstancedMesh(
    palmTrunkGeo,
    new THREE.MeshStandardMaterial({ color: 0x7c583a, roughness: 0.9 }),
    palmCount
  );
  const palmFronds = new THREE.InstancedMesh(
    palmFrondGeo,
    new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.76,
      side: THREE.DoubleSide,
    }),
    palmCount
  );
  const palmCrowns = new THREE.InstancedMesh(
    palmCrownGeo,
    new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.72,
      side: THREE.DoubleSide,
    }),
    palmCount
  );

  let placedPalms = 0;
  for (let i = 0; i < 650 && placedPalms < palmCount; i++) {
    const r1 = seededRand(i * 19 + 101);
    const r2 = seededRand(i * 29 + 202);
    const localZ = -7900 - r1 * 880;
    let localX = (r2 - 0.5) * 3800;
    if (Math.abs(localX) < 75) localX += localX >= 0 ? 85 : -85;
    const y = earthTerrainHeightAt(localX, localZ);
    if (y >= 4.2 && y <= 34) {
      const s = 0.8 + seededRand(i * 31) * 0.7;
      dummy.position.set(localX, y - 0.6, localZ);
      dummy.rotation.set(
        (seededRand(i * 7) - 0.5) * 0.22,
        r2 * Math.PI * 2,
        (seededRand(i * 13) - 0.5) * 0.22
      );
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      palmTrunks.setMatrixAt(placedPalms, dummy.matrix);
      palmFronds.setMatrixAt(placedPalms, dummy.matrix);
      palmCrowns.setMatrixAt(placedPalms, dummy.matrix);
      placedPalms++;
    }
  }
  palmTrunks.count = placedPalms;
  palmFronds.count = placedPalms;
  palmCrowns.count = placedPalms;
  palmTrunks.instanceMatrix.needsUpdate = true;
  palmFronds.instanceMatrix.needsUpdate = true;
  palmCrowns.instanceMatrix.needsUpdate = true;
  root.add(palmTrunks, palmFronds, palmCrowns);

  // 6. Instanced Coastal & Alpine Boulders (grounded flush at terrain height)
  const rockCount = 240;
  const rockGeo = new THREE.DodecahedronGeometry(6.5, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.9,
    metalness: 0.08,
    bumpMap: asteroidBumpTex,
    bumpScale: 0.35,
  });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  for (let i = 0; i < rockCount; i++) {
    const localZ = -180 - seededRand(i * 7 + 55) * 8700;
    const localX = (seededRand(i * 13 + 77) - 0.5) * 3200;
    const y = earthTerrainHeightAt(localX, localZ);
    const sx = 0.7 + seededRand(i * 19) * 2.2;
    const sy = 0.45 + seededRand(i * 23) * 1.1;
    dummy.position.set(localX, y + sy * 1.4, localZ);
    dummy.rotation.set(i * 0.7, i * 1.2, i * 0.4);
    dummy.scale.set(sx, sy, sx * 0.9);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate = true;
  root.add(rocks);

  // 7. Volumetric Cloud Banks drifting beneath mountain summit & across sea horizon
  const cloudMat = new THREE.SpriteMaterial({
    map: nebulaSmokeTex,
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const clouds: Array<{ sprite: THREE.Sprite; baseX: number; speed: number }> = [];
  for (let i = 0; i < 48; i++) {
    const s = new THREE.Sprite(cloudMat);
    const baseX = (seededRand(i * 17 + 1) - 0.5) * 7600;
    const y = 520 + seededRand(i * 19 + 2) * 560;
    const z = -900 - seededRand(i * 23 + 3) * 11500;
    s.position.set(baseX, y, z);
    const scale = 650 + seededRand(i * 29 + 4) * 900;
    s.scale.set(scale * 1.8, scale * 0.68, 1);
    root.add(s);
    clouds.push({ sprite: s, baseX, speed: 6 + (i % 5) * 2.5 });
  }

  // 8. Sunlit Atmospheric Mountain Mist & Sea-Spray Sparkle Particles
  const motesCount = 4200;
  const motePos = new Float32Array(motesCount * 3);
  const moteCol = new Float32Array(motesCount * 3);
  const goldTint = new THREE.Color(0xfef3c7);
  const whiteMote = new THREE.Color(0xffffff);
  const seaTint = new THREE.Color(0xbae6fd);
  const tmpC = new THREE.Color();

  for (let i = 0; i < motesCount; i++) {
    const r1 = seededRand(i * 3 + 11);
    const r2 = seededRand(i * 7 + 22);
    const r3 = seededRand(i * 11 + 33);
    const localZ = -r1 * 9600;
    const localX = (r2 - 0.5) * 1800;
    const ground = earthTerrainHeightAt(localX, localZ);
    const localY = Math.max(2, ground) + 2 + r3 * 160;
    motePos[i * 3] = localX;
    motePos[i * 3 + 1] = localY;
    motePos[i * 3 + 2] = localZ;

    tmpC.copy(localZ < -8100 ? seaTint : i % 2 === 0 ? goldTint : whiteMote);
    moteCol[i * 3] = tmpC.r;
    moteCol[i * 3 + 1] = tmpC.g;
    moteCol[i * 3 + 2] = tmpC.b;
  }

  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));
  const motePoints = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({
      size: 6.5,
      map: starSpriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  root.add(motePoints);

  return {
    group: root,
    update: (elapsed: number, camera: THREE.Camera) => {
      // Keep skyDome centered around camera in Earth-local space
      skyDome.position.set(
        camera.position.x - EARTH_ORIGIN[0],
        camera.position.y - EARTH_ORIGIN[1],
        camera.position.z - EARTH_ORIGIN[2]
      );
      oceanMat.uniforms.uTime.value = elapsed;
      motePoints.rotation.y = Math.sin(elapsed * 0.03) * 0.015;
      for (const item of clouds) {
        item.sprite.position.x =
          item.baseX + Math.sin(elapsed * 0.018 + item.baseX * 0.001) * 140;
      }
    },
    dispose: () => {
      detailTex.dispose();
    },
  };
}
