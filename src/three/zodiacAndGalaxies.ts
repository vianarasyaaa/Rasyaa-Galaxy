import * as THREE from 'three';
import {
  GALAXY_CATALOG,
  ZODIAC_CONSTELLATIONS,
  type GalaxyCatalogItem,
} from '../data/portfolioData';

const _rightAxis = new THREE.Vector3();
const _upAxis = new THREE.Vector3();
const _normalAxis = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);

function seededVal(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function createZodiacSkyGroup(starSpriteTex: THREE.CanvasTexture): {
  group: THREE.Group;
  update: (elapsed: number, camera: THREE.Camera) => void;
} {
  const skyDome = new THREE.Group();
  const domeRadius = 7800;

  // Build luminous sky constellation stars + glowing stick lines across all 12 Zodiacs
  const starPositions: number[] = [];
  const starColors: number[] = [];
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const accentColor = new THREE.Color();
  const whiteTint = new THREE.Color(0xffffff);
  const starColor = new THREE.Color();
  const nodePos = new THREE.Vector3();

  ZODIAC_CONSTELLATIONS.forEach((sign, sIdx) => {
    const azRad = THREE.MathUtils.degToRad(sign.azimuthDeg);
    const elRad = THREE.MathUtils.degToRad(sign.elevationDeg);
    const cosEl = Math.cos(elRad);

    // Tangent basis on celestial sky sphere
    _normalAxis
      .set(
        Math.cos(azRad) * cosEl,
        Math.sin(elRad),
        Math.sin(azRad) * cosEl
      )
      .normalize();
    _rightAxis.crossVectors(_worldUp, _normalAxis).normalize();
    _upAxis.crossVectors(_normalAxis, _rightAxis).normalize();

    const angScale = THREE.MathUtils.degToRad(sign.scaleDeg) * domeRadius;
    accentColor.set(sign.accentHex);

    const worldStars: THREE.Vector3[] = [];
    sign.stars.forEach(([sx, sy], starIdx) => {
      nodePos
        .copy(_normalAxis)
        .multiplyScalar(domeRadius)
        .addScaledVector(_rightAxis, sx * angScale)
        .addScaledVector(_upAxis, sy * angScale);
      worldStars.push(nodePos.clone());

      starPositions.push(nodePos.x, nodePos.y, nodePos.z);
      starColor.copy(accentColor).lerp(whiteTint, starIdx === 0 ? 0.8 : 0.48);
      starColors.push(starColor.r, starColor.g, starColor.b);

      // Subtle micro-corona sprite on anchor stars (1 per sign to stay crisp & lightweight)
      if (starIdx === 0 || starIdx === 2) {
        const glint = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: starSpriteTex,
            color: sign.accentHex,
            transparent: true,
            opacity: 0.72,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
          })
        );
        glint.position.copy(nodePos);
        const s = starIdx === 0 ? 220 : 165;
        glint.scale.set(s, s, 1);
        skyDome.add(glint);
      }
    });

    // Constellation vector lines connecting zodiac stars
    sign.edges.forEach(([aIdx, bIdx]) => {
      const a = worldStars[aIdx];
      const b = worldStars[bIdx];
      if (!a || !b) return;
      linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      lineColors.push(
        accentColor.r,
        accentColor.g,
        accentColor.b,
        accentColor.r,
        accentColor.g,
        accentColor.b
      );
    });

    // Ambient decorative celestial arc dust around each zodiac sign
    for (let k = 0; k < 22; k++) {
      const rx = (seededVal(sIdx * 47 + k * 3 + 1) - 0.5) * 2.4;
      const ry = (seededVal(sIdx * 53 + k * 7 + 2) - 0.5) * 1.9;
      nodePos
        .copy(_normalAxis)
        .multiplyScalar(domeRadius * 1.02)
        .addScaledVector(_rightAxis, rx * angScale)
        .addScaledVector(_upAxis, ry * angScale);
      starPositions.push(nodePos.x, nodePos.y, nodePos.z);
      starColor.copy(accentColor).lerp(whiteTint, 0.55);
      starColors.push(starColor.r, starColor.g, starColor.b);
    }
  });

  // High-sky dense atmospheric micro-stars arching around upper vault
  const skyStarCount = 2400;
  for (let i = 0; i < skyStarCount; i++) {
    const theta = i * 2.39996;
    const u = seededVal(i * 1.37 + 91) * 1.65 - 0.45; // bias toward upper & side sky vault
    const rFactor = Math.sqrt(Math.max(0.05, 1 - Math.min(0.95, u * u)));
    const dist = domeRadius * (0.9 + seededVal(i * 3.1 + 7) * 0.25);
    starPositions.push(
      Math.cos(theta) * rFactor * dist,
      u * dist,
      Math.sin(theta) * rFactor * dist
    );
    const tintPick = i % 4;
    if (tintPick === 0) starColor.setHex(0xe0f2fe);
    else if (tintPick === 1) starColor.setHex(0xfef08a);
    else if (tintPick === 2) starColor.setHex(0xc4b5fd);
    else starColor.setHex(0x67e8f9);
    starColors.push(starColor.r, starColor.g, starColor.b);
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 135,
    map: starSpriteTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    fog: false,
  });
  skyDome.add(new THREE.Points(starGeo, starMat));

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(linePositions, 3)
  );
  lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  skyDome.add(new THREE.LineSegments(lineGeo, lineMat));

  return {
    group: skyDome,
    update: (elapsed: number, camera: THREE.Camera) => {
      skyDome.position.copy(camera.position);
      skyDome.rotation.y = elapsed * 0.004;
      lineMat.opacity = 0.68 + Math.sin(elapsed * 0.9) * 0.12;
    },
  };
}

function buildGalaxyPointsGeometry(
  spec: GalaxyCatalogItem,
  starCount: number,
  seedBase: number
): THREE.BufferGeometry {
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  const coreCol = new THREE.Color(spec.coreHex);
  const midCol = new THREE.Color(spec.midHex);
  const outerCol = new THREE.Color(spec.outerHex);
  const tempCol = new THREE.Color();

  for (let i = 0; i < starCount; i++) {
    const t = i / starCount;
    let x = 0;
    let y = 0;
    let z = 0;

    if (spec.morphology === 'ring') {
      const isCore = i < starCount * 0.24;
      const r = isCore
        ? Math.pow(seededVal(seedBase + i * 3), 0.7) * 11
        : 27 + (seededVal(seedBase + i * 5 + 1) - 0.5) * 13;
      const ang = (i * 2.39996 + seededVal(seedBase + i * 7)) * 1.4;
      x = Math.cos(ang) * r;
      z = Math.sin(ang) * r;
      y = (seededVal(seedBase + i * 11) - 0.5) * (isCore ? 4.2 : 1.6);
    } else if (spec.morphology === 'elliptical') {
      const r = Math.pow(t, 0.85) * 40;
      const theta = i * 2.39996;
      const phi = Math.acos(1 - 2 * seededVal(seedBase + i * 9));
      x = r * Math.sin(phi) * Math.cos(theta) * 1.25;
      y = r * Math.cos(phi) * 0.58;
      z = r * Math.sin(phi) * Math.sin(theta) * 0.92;
    } else if (spec.morphology === 'barred') {
      const inBar = i < starCount * 0.34;
      if (inBar) {
        const barU = (seededVal(seedBase + i * 3) - 0.5) * 2;
        x = barU * 18;
        z = (seededVal(seedBase + i * 7) - 0.5) * 5.2;
        y = (seededVal(seedBase + i * 11) - 0.5) * 3.0;
      } else {
        const arm = i % 2;
        const u = (i - starCount * 0.34) / (starCount * 0.66);
        const r = 14 + Math.pow(u, 0.78) * 32;
        const baseAng = arm * Math.PI + (r - 14) * spec.twist;
        const spread = (seededVal(seedBase + i * 5) - 0.5) * (2.2 + r * 0.16);
        x = Math.cos(baseAng) * r + Math.cos(i) * spread;
        z = Math.sin(baseAng) * r + Math.sin(i) * spread;
        y = (seededVal(seedBase + i * 13) - 0.5) * 2.2 * (1 - u * 0.6);
      }
    } else {
      // Grand-design spiral galaxy
      const r = 1.6 + Math.pow(t, 0.72) * 46;
      const arm = i % spec.arms;
      const spin = r * spec.twist + (arm * Math.PI * 2) / spec.arms;
      const scatter = seededVal(seedBase + i * 5) * (1.8 + r * 0.17);
      const yScatter = (seededVal(seedBase + i * 13) - 0.5) * (3.2 * (1 - t * 0.62));
      x = Math.cos(spin) * r + Math.cos(i * 1.7) * scatter;
      y = yScatter;
      z = Math.sin(spin) * r + Math.sin(i * 1.7) * scatter;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    if (t < 0.28) {
      tempCol.copy(coreCol).lerp(midCol, t / 0.28);
    } else {
      tempCol.copy(midCol).lerp(outerCol, (t - 0.28) / 0.72);
    }
    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function createColossalGalaxiesGroup(
  starSpriteTex: THREE.CanvasTexture,
  nebulaSmokeTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  update: (_elapsed: number, dt: number, camera: THREE.Camera) => void;
} {
  const root = new THREE.Group();

  const entries: Array<{
    container: THREE.Group;
    lod: THREE.LOD;
    spinGroup: THREE.Group;
    spinSpeed: number;
  }> = [];

  GALAXY_CATALOG.forEach((spec, idx) => {
    const container = new THREE.Group();
    container.position.set(...spec.position);
    container.scale.setScalar(spec.scale);
    container.rotation.set(spec.tilt[0], spec.tilt[1], spec.tilt[2]);

    const lod = new THREE.LOD();
    const hiGroup = new THREE.Group();
    const midGroup = new THREE.Group();
    const farGroup = new THREE.Group();

    const hiGeo = buildGalaxyPointsGeometry(spec, 2100, (idx + 1) * 977);
    const midGeo = buildGalaxyPointsGeometry(spec, 680, (idx + 1) * 977 + 17);

    const hiMat = new THREE.PointsMaterial({
      size: 4.2,
      map: starSpriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: false,
    });
    const midMat = new THREE.PointsMaterial({
      size: 5.0,
      map: starSpriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: false,
    });

    const hiPoints = new THREE.Points(hiGeo, hiMat);
    hiGroup.add(hiPoints);

    const midPoints = new THREE.Points(midGeo, midMat);
    midGroup.add(midPoints);

    const coreBulge = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: starSpriteTex,
        color: spec.coreHex,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    coreBulge.scale.set(9.5, 9.5, 1);

    const outerHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaSmokeTex,
        color: spec.outerHex,
        transparent: true,
        opacity: 0.075,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    outerHalo.scale.set(42, 42, 1);

    hiGroup.add(coreBulge.clone());
    hiGroup.add(outerHalo.clone());

    midGroup.add(coreBulge.clone());
    midGroup.add(outerHalo.clone());

    farGroup.add(coreBulge);
    farGroup.add(outerHalo);

    lod.addLevel(hiGroup, 0);
    lod.addLevel(midGroup, 9500);
    lod.addLevel(farGroup, 17500);
    container.add(lod);

    root.add(container);
    entries.push({
      container,
      lod,
      spinGroup: hiGroup,
      spinSpeed: spec.spinSpeed,
    });
  });

  return {
    group: root,
    update: (_elapsed: number, dt: number, camera: THREE.Camera) => {
      for (const item of entries) {
        const distSq = item.container.position.distanceToSquared(camera.position);
        if (distSq > 26000 * 26000) {
          item.container.visible = false;
          continue;
        }
        item.container.visible = true;
        item.lod.update(camera);
        if (distSq < 12000 * 12000) {
          item.spinGroup.rotation.y += dt * item.spinSpeed;
        }
      }
    },
  };
}
