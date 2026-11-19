import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyExponentialDamping,
  BLACKOUT_FULL_START,
  clampProgress,
  computeAutoCruiseStep,
  computeFovFromVelocity,
  computeGestureDelta,
  earthTerrainHeightAt,
  findNearestLandmark,
  formatJourneyTime,
  getActiveSector,
  getActiveStoryBeat,
  getJourneyRealm,
  getMilestoneNotifications,
  getSectorLocalProgress,
  getSingularityBlackoutOpacity,
  getStoryBeatVisibility,
  sampleEarthDescentPath,
  sampleFlightPath,
  sampleUnifiedJourney,
  TOUCH_SCROLL_DIVISOR,
  WHEEL_SCROLL_DIVISOR,
} from './galaxyNavigation';
import {
  COSMIC_LANDMARKS,
  COSMIC_SECTORS,
  COSMIC_STORY_BEATS,
  EARTH_ORIGIN,
  FLIGHT_PATH_CONTROL_POINTS,
  GALAXY_CATALOG,
  ONE_HOUR_CRUISE_DURATION_SEC,
  ZODIAC_CONSTELLATIONS,
} from '../data/portfolioData';

test('clampProgress keeps values within [0, 1] and handles NaN', () => {
  assert.equal(clampProgress(-0.4), 0);
  assert.equal(clampProgress(1.8), 1);
  assert.equal(clampProgress(0.42), 0.42);
  assert.equal(clampProgress(Number.NaN), 0);
});

test('applyExponentialDamping converges monotonically toward target', () => {
  const step1 = applyExponentialDamping(0, 1, 8, 0.016);
  const step2 = applyExponentialDamping(step1, 1, 8, 0.016);
  assert.ok(step1 > 0 && step1 < 1);
  assert.ok(step2 > step1 && step2 < 1);
  assert.equal(applyExponentialDamping(0.5, 1, 8, 0), 0.5);
});

test('computeAutoCruiseStep spans 1 hour (3600s) at 1x speed', () => {
  const perSecond = computeAutoCruiseStep(1, 1, ONE_HOUR_CRUISE_DURATION_SEC);
  assert.ok(Math.abs(perSecond * 3600 - 1) < 1e-6);
  const faster = computeAutoCruiseStep(1, 10, ONE_HOUR_CRUISE_DURATION_SEC);
  assert.ok(Math.abs(faster * 360 - 1) < 1e-6);
});

test('formatJourneyTime renders MM:SS / 60:00 accurately', () => {
  assert.equal(formatJourneyTime(0, 3600), '00:00 / 60:00');
  assert.equal(formatJourneyTime(0.5, 3600), '30:00 / 60:00');
  assert.equal(formatJourneyTime(1, 3600), '60:00 / 60:00');
});

test('GALAXY_CATALOG defines exactly 34 huge galaxies with scale >= 48', () => {
  assert.equal(GALAXY_CATALOG.length, 34);
  for (const gal of GALAXY_CATALOG) {
    assert.ok(gal.scale >= 48, `${gal.name} scale should be huge (>= 48)`);
  }
});

test('ZODIAC_CONSTELLATIONS defines all 12 zodiac constellations with stars and edges', () => {
  assert.equal(ZODIAC_CONSTELLATIONS.length, 12);
  for (const sign of ZODIAC_CONSTELLATIONS) {
    assert.ok(sign.stars.length >= 4);
    assert.ok(sign.edges.length >= 3);
  }
});

test('getActiveSector detects all 8 cosmic sectors accurately', () => {
  assert.equal(getActiveSector(0.02, COSMIC_SECTORS).id, 'origin');
  assert.equal(getActiveSector(0.13, COSMIC_SECTORS).id, 'profile');
  assert.equal(getActiveSector(0.24, COSMIC_SECTORS).id, 'projects');
  assert.equal(getActiveSector(0.40, COSMIC_SECTORS).id, 'nebula');
  assert.equal(getActiveSector(0.52, COSMIC_SECTORS).id, 'cygnus');
  assert.equal(getActiveSector(0.64, COSMIC_SECTORS).id, 'craft');
  assert.equal(getActiveSector(0.74, COSMIC_SECTORS).id, 'andromeda');
  assert.equal(getActiveSector(0.92, COSMIC_SECTORS).id, 'contact');
});

test('COSMIC_STORY_BEATS resolves all 25 story beats sequentially from Viana Rasya to finale', () => {
  assert.equal(COSMIC_STORY_BEATS.length, 25);
  assert.equal(getActiveStoryBeat(0.0, COSMIC_STORY_BEATS).text, 'Viana Rasya');
  assert.equal(
    getActiveStoryBeat(0.05, COSMIC_STORY_BEATS).text,
    'aku developer Viengine dan berhasil membuat game AAA pertama di android'
  );
  assert.equal(
    getActiveStoryBeat(0.34, COSMIC_STORY_BEATS).text,
    'namanya Viana'
  );
  assert.equal(
    getActiveStoryBeat(1.0, COSMIC_STORY_BEATS).text,
    'hehehe masih epic untuk sekarang, sibuk sama bini.'
  );
  assert.equal(getStoryBeatVisibility(0.5, 0.5), 1);
  assert.equal(getStoryBeatVisibility(0.9, 0.2), 0);
});

test('getSectorLocalProgress maps sector bounds to [0, 1]', () => {
  const cygnusSector = COSMIC_SECTORS.find((s) => s.id === 'cygnus')!;
  assert.equal(getSectorLocalProgress(0.47, cygnusSector), 0);
  assert.ok(Math.abs(getSectorLocalProgress(0.53, cygnusSector) - 0.5) < 1e-6);
  assert.equal(getSectorLocalProgress(0.59, cygnusSector), 1);
});

test('findNearestLandmark identifies Cygnus X-1, Gargantua, and Earth Beach', () => {
  const nearCygnus = findNearestLandmark([-475, 78, -24195], COSMIC_LANDMARKS);
  assert.equal(nearCygnus.landmark.id, 'cygnus-x1');
  assert.ok(nearCygnus.distance < 20);

  const nearBeach = findNearestLandmark([0, 6, -98890], COSMIC_LANDMARKS);
  assert.equal(nearBeach.landmark.id, 'earth-beach');
});

test('Singularity blackout peaks at 1.0 when entering black hole before Earth arrival', () => {
  assert.equal(getJourneyRealm(0.4), 'cosmos');
  assert.equal(getSingularityBlackoutOpacity(0.4), 0);

  assert.equal(getJourneyRealm(0.83), 'singularity');
  assert.equal(getSingularityBlackoutOpacity(BLACKOUT_FULL_START + 0.005), 1);

  assert.equal(getJourneyRealm(0.92), 'earth');
  assert.equal(getSingularityBlackoutOpacity(0.92), 0);
});

test('Earth mountain-to-beach 10x descent starts >1200m high and lands cleanly on coastal beach above terrain', () => {
  const peakHeight = earthTerrainHeightAt(0, 0);
  const shoreHeight = earthTerrainHeightAt(0, -8700);
  const seabedDepth = earthTerrainHeightAt(0, -9600);
  assert.ok(peakHeight > 1150, 'Mountain peak must exceed 1150m (10x scale)');
  assert.ok(shoreHeight > 1 && shoreHeight < 12, 'Beach shore must sit gently above sea level');
  assert.ok(seabedDepth < 0, 'Ocean seabed must slope beneath y = 0');

  const topSample = sampleEarthDescentPath(0);
  const midSample = sampleEarthDescentPath(0.5);
  const beachSample = sampleEarthDescentPath(1);

  assert.ok(topSample.position[1] - beachSample.position[1] > 1100);
  assert.ok(midSample.position[1] < topSample.position[1]);
  assert.ok(beachSample.position[1] < midSample.position[1]);
  assert.ok(beachSample.position[1] > 4 && beachSample.position[1] < 20);

  // Camera stays safely above ground across the entire descent
  for (let i = 0; i <= 20; i++) {
    const s = sampleEarthDescentPath(i / 20);
    const localX = s.position[0] - EARTH_ORIGIN[0];
    const localZ = s.position[2] - EARTH_ORIGIN[2];
    const ground = earthTerrainHeightAt(localX, localZ);
    assert.ok(s.position[1] > ground + 3.0);
  }
});

test('sampleUnifiedJourney connects Cosmos -> Blackout -> Earth cleanly', () => {
  const cosmosStart = sampleUnifiedJourney(0, FLIGHT_PATH_CONTROL_POINTS);
  assert.equal(cosmosStart.realm, 'cosmos');
  assert.ok(cosmosStart.position[2] > -50000);

  const earthBeach = sampleUnifiedJourney(1, FLIGHT_PATH_CONTROL_POINTS);
  assert.equal(earthBeach.realm, 'earth');
  assert.equal(earthBeach.blackoutOpacity, 0);
  assert.ok(earthBeach.position[2] < -98000);
});

test('computeGestureDelta distinguishes horizontal swipe from slow vertical scroll', () => {
  const swipeNext = computeGestureDelta(-90, 10, 120);
  assert.equal(swipeNext.horizontalSwipe, 'next');
  assert.equal(swipeNext.scrollDelta, 0);

  const swipePrev = computeGestureDelta(95, -8, 140);
  assert.equal(swipePrev.horizontalSwipe, 'prev');
  assert.equal(swipePrev.scrollDelta, 0);

  const verticalScroll = computeGestureDelta(6, -180, 160);
  assert.equal(verticalScroll.horizontalSwipe, null);
  assert.ok(verticalScroll.scrollDelta > 0);
  assert.ok(verticalScroll.scrollDelta < 0.005);
  assert.ok(WHEEL_SCROLL_DIVISOR >= 200000);
  assert.ok(TOUCH_SCROLL_DIVISOR >= 70000);
});

test('computeFovFromVelocity boosts FOV smoothly and caps at maxBoost', () => {
  assert.equal(computeFovFromVelocity(56, 0), 56);
  assert.ok(computeFovFromVelocity(56, 0.05) > 56);
  assert.equal(computeFovFromVelocity(56, 5, 10), 66);
});

test('getMilestoneNotifications triggers sector and percentage milestones once', () => {
  const unlocked = new Set<string>();
  const batch1 = getMilestoneNotifications(
    0.05,
    0.55,
    unlocked,
    COSMIC_SECTORS,
    new Date('2026-11-17T10:00:00Z')
  );
  assert.ok(batch1.some((n) => n.kind === 'sector' && n.title.includes('Cygnus')));
  assert.ok(batch1.some((n) => n.kind === 'milestone'));

  const batch2 = getMilestoneNotifications(
    0.55,
    0.56,
    unlocked,
    COSMIC_SECTORS,
    new Date('2026-11-17T10:00:05Z')
  );
  assert.equal(batch2.length, 0);
});

test('sampleFlightPath spans > 35,000 units along Z with unit tangent', () => {
  const start = sampleFlightPath(0, FLIGHT_PATH_CONTROL_POINTS);
  const mid = sampleFlightPath(0.5, FLIGHT_PATH_CONTROL_POINTS);
  const end = sampleFlightPath(1, FLIGHT_PATH_CONTROL_POINTS);

  assert.ok(start.position[2] - end.position[2] > 35000);
  assert.ok(mid.position[2] < start.position[2]);
  assert.ok(end.position[2] < mid.position[2]);

  const tangentLength = Math.hypot(
    mid.tangent[0],
    mid.tangent[1],
    mid.tangent[2]
  );
  assert.ok(Math.abs(tangentLength - 1) < 1e-6);
});
