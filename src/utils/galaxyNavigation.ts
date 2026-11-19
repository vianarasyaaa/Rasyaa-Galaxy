import {
  EARTH_ORIGIN,
  type CosmicLandmark,
  type CosmicSector,
  type CosmicStoryBeat,
  type Vec3Tuple,
} from '../data/portfolioData';

export interface ActivityNotificationDraft {
  id: string;
  title: string;
  message: string;
  kind: 'sector' | 'milestone' | 'artifact' | 'gesture';
  timestampLabel: string;
}

export interface GestureInterpretation {
  scrollDelta: number;
  horizontalSwipe: 'next' | 'prev' | null;
}

export type JourneyRealm = 'cosmos' | 'singularity' | 'earth';

export const WHEEL_SCROLL_DIVISOR = 260000;
export const TOUCH_SCROLL_DIVISOR = 85000;

export const COSMOS_END_PROGRESS = 0.818;
export const BLACKOUT_START_PROGRESS = 0.806;
export const BLACKOUT_FULL_START = 0.820;
export const BLACKOUT_FULL_END = 0.838;
export const BLACKOUT_END_PROGRESS = 0.854;
export const EARTH_START_PROGRESS = 0.832;

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clampProgress((x - edge0) / Math.max(1e-6, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function applyExponentialDamping(
  current: number,
  target: number,
  lambda: number,
  dtSeconds: number
): number {
  if (dtSeconds <= 0) return current;
  const factor = 1 - Math.exp(-lambda * dtSeconds);
  return current + (target - current) * factor;
}

export function computeAutoCruiseStep(
  dtSeconds: number,
  speedMultiplier: number,
  totalDurationSec = 3600
): number {
  if (dtSeconds <= 0 || totalDurationSec <= 0 || speedMultiplier <= 0) return 0;
  return (dtSeconds * speedMultiplier) / totalDurationSec;
}

export function formatJourneyTime(
  progress: number,
  totalDurationSec = 3600
): string {
  const p = clampProgress(progress);
  const currentSec = Math.round(p * totalDurationSec);
  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  return `${fmt(currentSec)} / ${fmt(totalDurationSec)}`;
}

export function getJourneyRealm(progress: number): JourneyRealm {
  const p = clampProgress(progress);
  if (p >= BLACKOUT_FULL_START && p <= BLACKOUT_FULL_END) {
    return 'singularity';
  }
  if (p > BLACKOUT_FULL_END) {
    return 'earth';
  }
  return 'cosmos';
}

export function getSingularityBlackoutOpacity(progress: number): number {
  const p = clampProgress(progress);
  if (p <= BLACKOUT_START_PROGRESS || p >= BLACKOUT_END_PROGRESS) return 0;
  if (p < BLACKOUT_FULL_START) {
    return smoothstep(BLACKOUT_START_PROGRESS, BLACKOUT_FULL_START, p);
  }
  if (p <= BLACKOUT_FULL_END) {
    return 1;
  }
  return 1 - smoothstep(BLACKOUT_FULL_END, BLACKOUT_END_PROGRESS, p);
}

// 10x mountain-to-beach Earth elevation function (in Earth-local space around [0, 0, 0])
// Mountain summit ~+1220m at localZ=0, descending continuously across ridges & green valleys
// down to lowland ground (-7200..-8350), golden beach (-8350..-8950), and seabed (< -8950).
export function earthTerrainHeightAt(localX: number, localZ: number): number {
  // Normalized descent along coast axis: 0 at peak (z >= 0) -> 1 at shoreline (z = -8950)
  const rawDescent = Math.max(0, Math.min(1.25, -localZ / 8950));
  const macroDrop = 1 - Math.min(1, rawDescent);

  // Steep majestic mountain curve dropping from 1220 down to 0
  const baseElevation =
    rawDescent <= 1
      ? Math.pow(macroDrop, 1.48) * 1218
      : -Math.min(55, (rawDescent - 1) * 210);

  // Scenic flanking alpine peaks left/right away from the camera valley corridor
  const valleyHalfWidth = 220 + rawDescent * 420;
  const distFromValley = Math.max(0, Math.abs(localX) - valleyHalfWidth * 0.45);
  const mountainWalls =
    macroDrop > 0.04
      ? Math.min(480, Math.pow(distFromValley / 620, 1.35) * 230) *
        (0.35 + macroDrop * 0.85)
      : 0;

  // Natural rolling ridges & hills damped smoothly near shore
  const ridgeFade = Math.max(0, Math.min(1, (-localZ > 8400 ? (-localZ < 9000 ? 0.12 : 0.05) : 0.18 + macroDrop * 0.82)));
  const waves =
    (Math.sin(localX * 0.0024 + localZ * 0.0017) * 52 +
      Math.cos(localX * 0.0052 - localZ * 0.0041) * 26 +
      Math.sin((localX + localZ) * 0.011) * 10) *
    ridgeFade;

  // Carve a graceful central valley path so camera view down to the beach is unobstructed
  const corridorCarve =
    rawDescent < 0.96
      ? Math.exp(-(localX * localX) / (2 * (260 * 260))) * (1 - rawDescent) * 42
      : 0;

  // Flatten coastal shore gently into golden beach sand above y = 0 -> y = 10
  if (localZ <= -8350 && localZ >= -8950) {
    const shoreT = (-localZ - 8350) / 600; // 0 = dry land edge, 1 = water edge
    const shoreBase = (1 - shoreT) * 11.5 + 0.35;
    const coastalDunes =
      Math.sin(localX * 0.004) * 2.2 * (1 - shoreT) +
      Math.min(120, Math.pow(Math.max(0, Math.abs(localX) - 1800) / 800, 1.4) * 40);
    return shoreBase + coastalDunes;
  }

  return baseElevation + mountainWalls + waves - corridorCarve;
}

export function sampleEarthDescentPath(earthLocalT: number): {
  position: Vec3Tuple;
  lookAt: Vec3Tuple;
  tangent: Vec3Tuple;
} {
  const t = clampProgress(earthLocalT);

  const samplePoint = (u: number): Vec3Tuple => {
    // 8,620 units horizontal traversal paired with ~1,210 vertical units drop
    const localZ = -20 - u * 8620;
    const swayFade = 1 - smoothstep(0.76, 0.98, u);
    const localX = Math.sin(u * Math.PI * 3.1) * 240 * swayFade;
    const terrainY = earthTerrainHeightAt(localX, localZ);
    const clearance = 16 - smoothstep(0.65, 1.0, u) * 7.2;
    const localY = Math.max(8.8, terrainY + clearance);
    return [
      EARTH_ORIGIN[0] + localX,
      EARTH_ORIGIN[1] + localY,
      EARTH_ORIGIN[2] + localZ,
    ];
  };

  const position = samplePoint(t);
  let lookAt: Vec3Tuple;
  if (t < 0.92) {
    lookAt = samplePoint(Math.min(1, t + 0.025));
    lookAt[1] = lookAt[1] - 4.5 * (1 - smoothstep(0.82, 1.0, t));
  } else {
    // Beach arrival frames golden sand foreground, breaking white surf, and turquoise sea horizon
    lookAt = [
      position[0] + 150,
      EARTH_ORIGIN[1] + 1.5,
      EARTH_ORIGIN[2] - 9650,
    ];
  }

  const dx = lookAt[0] - position[0];
  const dy = lookAt[1] - position[1];
  const dz = lookAt[2] - position[2];
  const len = Math.hypot(dx, dy, dz) || 1;

  return {
    position,
    lookAt,
    tangent: [dx / len, dy / len, dz / len],
  };
}

export function getActiveSector(
  progress: number,
  sectors: CosmicSector[]
): CosmicSector {
  const p = clampProgress(progress);
  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];
    const [start, end] = sector.range;
    const isLast = i === sectors.length - 1;
    if ((p >= start && p < end) || (isLast && p >= start)) {
      return sector;
    }
  }
  return sectors[0];
}

export function getActiveStoryBeat(
  progress: number,
  beats: CosmicStoryBeat[]
): CosmicStoryBeat {
  const p = clampProgress(progress);
  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    const [start, end] = beat.range;
    const isLast = i === beats.length - 1;
    if ((p >= start && p < end) || (isLast && p >= start)) {
      return beat;
    }
  }
  return beats[0];
}

export function getStoryBeatVisibility(
  progress: number,
  beatProgress: number,
  windowRadius = 0.055
): number {
  const dist = Math.abs(clampProgress(progress) - beatProgress);
  if (dist >= windowRadius) return 0;
  return 1 - dist / windowRadius;
}

export function getSectorLocalProgress(
  progress: number,
  sector: CosmicSector
): number {
  const [start, end] = sector.range;
  const span = end - start;
  if (span <= 0) return 0;
  return clampProgress((progress - start) / span);
}

export function findNearestLandmark(
  position: Vec3Tuple,
  landmarks: CosmicLandmark[]
): { landmark: CosmicLandmark; distance: number } {
  let best = landmarks[0];
  let bestDist = Infinity;

  for (const lm of landmarks) {
    const dx = position[0] - lm.position[0];
    const dy = position[1] - lm.position[1];
    const dz = position[2] - lm.position[2];
    const dist = Math.hypot(dx, dy, dz);
    if (dist < bestDist) {
      bestDist = dist;
      best = lm;
    }
  }

  return { landmark: best, distance: bestDist };
}

export function computeGestureDelta(
  deltaX: number,
  deltaY: number,
  dtMs: number
): GestureInterpretation {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const safeDt = Math.max(8, dtMs);
  const velocityX = absX / safeDt;

  if (absX > 48 && absX > absY * 1.45 && velocityX > 0.22) {
    return {
      scrollDelta: 0,
      horizontalSwipe: deltaX < 0 ? 'next' : 'prev',
    };
  }

  const scrollDelta = -deltaY / TOUCH_SCROLL_DIVISOR;
  return {
    scrollDelta,
    horizontalSwipe: null,
  };
}

export function computeFovFromVelocity(
  baseFov: number,
  velocity: number,
  maxBoost = 8
): number {
  const speed = Math.abs(velocity);
  const boost = Math.min(maxBoost, speed * 180);
  return baseFov + boost;
}

function formatClockTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function getMilestoneNotifications(
  prevProgress: number,
  nextProgress: number,
  unlockedIds: Set<string>,
  sectors: CosmicSector[],
  now: Date = new Date()
): ActivityNotificationDraft[] {
  const drafts: ActivityNotificationDraft[] = [];
  const pNext = clampProgress(nextProgress);
  const timeStr = formatClockTime(now);

  const prevSector = getActiveSector(prevProgress, sectors);
  const nextSector = getActiveSector(pNext, sectors);

  if (nextSector.id !== prevSector.id) {
    const sectorKey = `sector:${nextSector.id}`;
    if (!unlockedIds.has(sectorKey)) {
      unlockedIds.add(sectorKey);
      drafts.push({
        id: `${sectorKey}-${now.getTime()}`,
        title: `Sektor ${nextSector.indexLabel} · ${nextSector.title}`,
        message: nextSector.headline,
        kind: 'sector',
        timestampLabel: timeStr,
      });
    }
  }

  const thresholds = [
    { pct: 15, key: 'milestone:15', label: '15% Tata Surya Awal Terlewati' },
    { pct: 35, key: 'milestone:35', label: '35% Nebula Dalam & 12 Rasi Zodiak' },
    { pct: 55, key: 'milestone:55', label: '55% Memasuki Sistem Biner Cygnus X-1' },
    { pct: 74, key: 'milestone:74', label: '74% Gugusan 34 Galaksi Raksasa' },
    { pct: 82, key: 'milestone:82', label: '82% Menembus Singularitas Lubang Hitam' },
    { pct: 86, key: 'milestone:86', label: '86% Tiba di Puncak Gunung Bumi' },
    { pct: 98, key: 'milestone:98', label: '98% Mencapai Tepian Pantai & Samudra Bumi' },
  ];

  const currentPct = Math.round(pNext * 100);
  for (const item of thresholds) {
    if (currentPct >= item.pct && !unlockedIds.has(item.key)) {
      unlockedIds.add(item.key);
      drafts.push({
        id: `${item.key}-${now.getTime()}`,
        title: 'Progres Eksplorasi Real-Time',
        message: item.label,
        kind: 'milestone',
        timestampLabel: timeStr,
      });
    }
  }

  return drafts;
}

function catmullRomValue(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export function evaluateCatmullRom(
  points: Vec3Tuple[],
  t: number
): Vec3Tuple {
  if (points.length === 0) return [0, 0, 0];
  if (points.length === 1) return points[0];

  const clamped = clampProgress(t);
  const segmentCount = points.length - 1;
  const scaled = clamped * segmentCount;
  const idx = Math.min(segmentCount - 1, Math.floor(scaled));
  const localT = scaled - idx;

  const p0 = points[Math.max(0, idx - 1)];
  const p1 = points[idx];
  const p2 = points[Math.min(points.length - 1, idx + 1)];
  const p3 = points[Math.min(points.length - 1, idx + 2)];

  return [
    catmullRomValue(p0[0], p1[0], p2[0], p3[0], localT),
    catmullRomValue(p0[1], p1[1], p2[1], p3[1], localT),
    catmullRomValue(p0[2], p1[2], p2[2], p3[2], localT),
  ];
}

export function sampleFlightPath(
  t: number,
  controlPoints: Vec3Tuple[]
): { position: Vec3Tuple; lookAt: Vec3Tuple; tangent: Vec3Tuple } {
  const clamped = clampProgress(t);
  const position = evaluateCatmullRom(controlPoints, clamped);
  const aheadT = clampProgress(clamped + 0.015);
  const lookAt =
    aheadT > clamped
      ? evaluateCatmullRom(controlPoints, aheadT)
      : ([position[0], position[1], position[2] - 120] as Vec3Tuple);

  const dx = lookAt[0] - position[0];
  const dy = lookAt[1] - position[1];
  const dz = lookAt[2] - position[2];
  const len = Math.hypot(dx, dy, dz) || 1;

  return {
    position,
    lookAt,
    tangent: [dx / len, dy / len, dz / len],
  };
}

export function sampleUnifiedJourney(
  progress: number,
  cosmosControlPoints: Vec3Tuple[]
): {
  realm: JourneyRealm;
  blackoutOpacity: number;
  position: Vec3Tuple;
  lookAt: Vec3Tuple;
  tangent: Vec3Tuple;
  earthLocalT: number;
} {
  const p = clampProgress(progress);
  const realm = getJourneyRealm(p);
  const blackoutOpacity = getSingularityBlackoutOpacity(p);

  if (p < EARTH_START_PROGRESS) {
    const cosmosT = clampProgress(p / COSMOS_END_PROGRESS);
    const cosmosSample = sampleFlightPath(cosmosT, cosmosControlPoints);
    return {
      realm,
      blackoutOpacity,
      position: cosmosSample.position,
      lookAt: cosmosSample.lookAt,
      tangent: cosmosSample.tangent,
      earthLocalT: 0,
    };
  }

  const earthLocalT = clampProgress((p - EARTH_START_PROGRESS) / (1 - EARTH_START_PROGRESS));
  const earthSample = sampleEarthDescentPath(earthLocalT);
  return {
    realm,
    blackoutOpacity,
    position: earthSample.position,
    lookAt: earthSample.lookAt,
    tangent: earthSample.tangent,
    earthLocalT,
  };
}
