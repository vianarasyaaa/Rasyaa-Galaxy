import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  COSMIC_STORY_BEATS,
  CREATIVE_PROJECTS,
  EARTH_ORIGIN,
  FLIGHT_PATH_CONTROL_POINTS,
  ONE_HOUR_CRUISE_DURATION_SEC,
  type Vec3Tuple,
} from '../data/portfolioData';
import {
  applyExponentialDamping,
  BLACKOUT_FULL_START,
  clampProgress,
  computeAutoCruiseStep,
  computeFovFromVelocity,
  computeGestureDelta,
  EARTH_START_PROGRESS,
  earthTerrainHeightAt,
  getSingularityBlackoutOpacity,
  sampleUnifiedJourney,
  TOUCH_SCROLL_DIVISOR,
  WHEEL_SCROLL_DIVISOR,
} from '../utils/galaxyNavigation';
import {
  createAsteroidBumpTexture,
  createBrushedMetalTexture,
  createGasGiantTextures,
  createIceCrystalTextures,
  createNebulaSmokeTexture,
  createPlanetTextures,
  createStarSpriteTexture,
  createVolcanicRockyTextures,
} from '../three/proceduralTextures';
import {
  createAsteroidBeltInstanced,
  createBlackHoleGroup,
  createCarinaNebulaGroup,
  createCygnusBinaryGroup,
  createMegaExoplanetsGroup,
  createProjectStationGroup,
  createSolarCoreGroup,
  createStarfieldAndNebula,
  createTechPlanetGroup,
} from '../three/celestialModels';
import {
  createColossalGalaxiesGroup,
  createZodiacSkyGroup,
} from '../three/zodiacAndGalaxies';
import { createEarthWorldGroup } from '../three/earthWorld';
import { createCosmicStoryNodes } from '../three/cosmicStoryNodes';

interface GalaxyCanvasProps {
  targetProgress: number;
  autoCruise: boolean;
  cruiseSpeed: number;
  freeExplore: boolean;
  freeThrust: -1 | 0 | 1;
  reducedMotion: boolean;
  onTargetProgressChange: (nextProgress: number) => void;
  onSettledProgressChange: (settledProgress: number) => void;
  onFreePositionChange: (pos: Vec3Tuple) => void;
  onSelectProject: (projectId: string) => void;
  onGestureSwipe: (direction: 'next' | 'prev') => void;
  onHoverProjectChange: (projectId: string | null) => void;
}

const _camPosScratch = new THREE.Vector3();
const _lookAtScratch = new THREE.Vector3();
const _currentLookScratch = new THREE.Vector3(0, 4.0, 20);
const _forwardScratch = new THREE.Vector3();
const _rightScratch = new THREE.Vector3();
const _eulerScratch = new THREE.Euler(0, 0, 0, 'YXZ');
const _pointerNdc = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();

const _spaceBgColor = new THREE.Color(0x030612);
const _earthBgColor = new THREE.Color(0x93c5fd);

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function GalaxyCanvas({
  targetProgress,
  autoCruise,
  cruiseSpeed,
  freeExplore,
  freeThrust,
  reducedMotion,
  onTargetProgressChange,
  onSettledProgressChange,
  onFreePositionChange,
  onSelectProject,
  onGestureSwipe,
  onHoverProjectChange,
}: GalaxyCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const blackoutOverlayRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const targetProgressRef = useRef(targetProgress);
  const autoCruiseRef = useRef(autoCruise);
  const cruiseSpeedRef = useRef(cruiseSpeed);
  const freeExploreRef = useRef(freeExplore);
  const freeThrustRef = useRef(freeThrust);
  const reducedMotionRef = useRef(reducedMotion);
  const callbacksRef = useRef({
    onTargetProgressChange,
    onSettledProgressChange,
    onFreePositionChange,
    onSelectProject,
    onGestureSwipe,
    onHoverProjectChange,
  });

  useEffect(() => {
    targetProgressRef.current = targetProgress;
  }, [targetProgress]);

  useEffect(() => {
    autoCruiseRef.current = autoCruise;
  }, [autoCruise]);

  useEffect(() => {
    cruiseSpeedRef.current = cruiseSpeed;
  }, [cruiseSpeed]);

  useEffect(() => {
    freeExploreRef.current = freeExplore;
  }, [freeExplore]);

  useEffect(() => {
    freeThrustRef.current = freeThrust;
  }, [freeThrust]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    callbacksRef.current = {
      onTargetProgressChange,
      onSettledProgressChange,
      onFreePositionChange,
      onSelectProject,
      onGestureSwipe,
      onHoverProjectChange,
    };
  }, [
    onTargetProgressChange,
    onSettledProgressChange,
    onFreePositionChange,
    onSelectProject,
    onGestureSwipe,
    onHoverProjectChange,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const spaceFog = new THREE.FogExp2(0x030612, 0.000024);
    const earthFog = new THREE.FogExp2(0xcbe6ff, 0.000085);
    scene.background = _spaceBgColor;
    scene.fog = spaceFog;

    // Far plane 28,000 allows 34 colossal galaxies + Earth ocean horizon to tower visibly
    const camera = new THREE.PerspectiveCamera(56, width / height, 0.5, 28000);

    // Mandatory Studio PBR Environment Map on all devices
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x070a14, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffdca8, 2.35);
    keyLight.position.set(180, 260, 220);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 1400;
    keyLight.shadow.camera.left = -280;
    keyLight.shadow.camera.right = 280;
    keyLight.shadow.camera.top = 280;
    keyLight.shadow.camera.bottom = -280;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.25);
    rimLight.position.set(-220, -80, -1400);
    scene.add(rimLight);

    const earthSunLight = new THREE.DirectionalLight(0xfff1d6, 2.4);
    earthSunLight.position.set(
      EARTH_ORIGIN[0] + 1800,
      3600,
      EARTH_ORIGIN[2] - 11500
    );
    earthSunLight.target.position.set(
      EARTH_ORIGIN[0],
      350,
      EARTH_ORIGIN[2] - 4800
    );
    scene.add(earthSunLight);
    scene.add(earthSunLight.target);

    // Procedural Textures (Zero 404s)
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const starSpriteTex = createStarSpriteTexture();
    const nebulaSmokeA = createNebulaSmokeTexture(
      17,
      'rgba(56, 189, 248, 0.34)',
      'rgba(99, 102, 241, 0.22)'
    );
    const nebulaSmokeB = createNebulaSmokeTexture(
      43,
      'rgba(192, 132, 252, 0.32)',
      'rgba(245, 158, 11, 0.18)'
    );
    const planetTextures = createPlanetTextures(maxAnisotropy, 101);
    const gasVioletTex = createGasGiantTextures(maxAnisotropy, 303, [
      '#1e1b4b',
      '#7c3aed',
      '#f472b6',
      '#38bdf8',
    ]);
    const gasAmberTex = createGasGiantTextures(maxAnisotropy, 409, [
      '#451a03',
      '#d97706',
      '#fef08a',
      '#92400e',
    ]);
    const volcanicTex = createVolcanicRockyTextures(maxAnisotropy, 505);
    const iceTex = createIceCrystalTextures(maxAnisotropy, 707);
    const asteroidBumpTex = createAsteroidBumpTexture(maxAnisotropy);
    const metalBumpTex = createBrushedMetalTexture(maxAnisotropy);

    // Realm 1: Cosmos Container (Zero Flight Path Guide Lines!)
    const cosmosRoot = new THREE.Group();
    scene.add(cosmosRoot);

    const solarPoint = new THREE.PointLight(0xffa94d, 5.5, 1900, 0.28);
    solarPoint.position.set(-520, 95, -180);
    cosmosRoot.add(solarPoint);

    const cygnusPoint = new THREE.PointLight(0x38bdf8, 5.5, 2200, 0.28);
    cygnusPoint.position.set(-480, 78, -24200);
    cosmosRoot.add(cygnusPoint);

    const blackHolePoint = new THREE.PointLight(0xfb923c, 7.0, 3200, 0.24);
    blackHolePoint.position.set(0, 32, -37400);
    cosmosRoot.add(blackHolePoint);

    const solarCore = createSolarCoreGroup(metalBumpTex, starSpriteTex);
    cosmosRoot.add(solarCore.group);

    const techPlanet = createTechPlanetGroup(planetTextures, metalBumpTex);
    cosmosRoot.add(techPlanet.group);

    const megaExoplanets = createMegaExoplanetsGroup({
      gasViolet: gasVioletTex,
      gasAmber: gasAmberTex,
      volcanic: volcanicTex,
      ice: iceTex,
      asteroidBump: asteroidBumpTex,
    });
    cosmosRoot.add(megaExoplanets.group);

    const projectStations = CREATIVE_PROJECTS.map((project) => {
      const station = createProjectStationGroup(project, metalBumpTex);
      cosmosRoot.add(station.group);
      return station;
    });

    const interactables: THREE.Object3D[] = projectStations.map(
      (s) => s.hitTarget
    );

    const carinaNebula = createCarinaNebulaGroup(
      nebulaSmokeA,
      nebulaSmokeB,
      starSpriteTex
    );
    cosmosRoot.add(carinaNebula.group);

    const cygnusBinary = createCygnusBinaryGroup(starSpriteTex, metalBumpTex);
    cosmosRoot.add(cygnusBinary.group);

    const colossalGalaxies = createColossalGalaxiesGroup(
      starSpriteTex,
      nebulaSmokeA
    );
    cosmosRoot.add(colossalGalaxies.group);

    const zodiacSky = createZodiacSkyGroup(starSpriteTex);
    cosmosRoot.add(zodiacSky.group);

    const asteroidBelt = createAsteroidBeltInstanced(
      1260,
      asteroidBumpTex
    );
    cosmosRoot.add(asteroidBelt.mesh);

    const cosmos = createStarfieldAndNebula(
      starSpriteTex,
      nebulaSmokeA,
      nebulaSmokeB
    );
    cosmosRoot.add(cosmos.group);

    const blackHole = createBlackHoleGroup();
    cosmosRoot.add(blackHole.group);

    // Realm 2: Earth Mountain Summit -> 10x Descent -> Land & Beach
    const earthWorld = createEarthWorldGroup(
      nebulaSmokeA,
      starSpriteTex,
      asteroidBumpTex
    );
    scene.add(earthWorld.group);

    // Cardless Floating 3D Story Beats across Cosmos & Earth sky
    const storyNodes = createCosmicStoryNodes(
      COSMIC_STORY_BEATS,
      FLIGHT_PATH_CONTROL_POINTS,
      nebulaSmokeA,
      isSoftwareGl
    );
    scene.add(storyNodes.group);

    // Initialize camera at starting progress
    let smoothedProgress = clampProgress(targetProgressRef.current);
    const initialSample = sampleUnifiedJourney(
      smoothedProgress,
      FLIGHT_PATH_CONTROL_POINTS
    );
    camera.position.set(...initialSample.position);
    _currentLookScratch.set(...initialSample.lookAt);
    camera.lookAt(_currentLookScratch);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Free-flight camera state
    let wasFreeExplore = false;
    let freeYaw = 0;
    let freePitch = 0;
    let targetFreeYaw = 0;
    let targetFreePitch = 0;
    const freePos = new THREE.Vector3(...initialSample.position);
    const freeKeys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
    };

    let pointerOffsetX = 0;
    let pointerOffsetY = 0;
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let lastHoveredId: string | null = null;
    let lastRaycastTime = 0;
    let isPointerDragging = false;
    let lastDragX = 0;
    let lastDragY = 0;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchLastX = 0;
    let touchLastY = 0;
    let touchStartTime = 0;
    let touchMoved = false;
    let touchVelocityY = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (freeExploreRef.current) {
        camera.getWorldDirection(_forwardScratch);
        const inEarth = freePos.z < -60000;
        const step = -e.deltaY * (inEarth ? 0.35 : 0.75);
        freePos.addScaledVector(_forwardScratch, step);
        return;
      }
      const step = e.deltaY / WHEEL_SCROLL_DIVISOR;
      const next = clampProgress(targetProgressRef.current + step);
      targetProgressRef.current = next;
      callbacksRef.current.onTargetProgressChange(next);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      isPointerDragging = true;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      if (freeExploreRef.current) {
        canvas.style.cursor = 'grabbing';
      }
    };

    const handlePointerUp = () => {
      isPointerDragging = false;
      if (!lastHoveredId) {
        canvas.style.cursor = 'grab';
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchLastX = t.clientX;
      touchLastY = t.clientY;
      touchStartTime = performance.now();
      touchMoved = false;
      touchVelocityY = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchLastX;
      const dy = t.clientY - touchLastY;
      touchLastX = t.clientX;
      touchLastY = t.clientY;

      if (Math.abs(t.clientY - touchStartY) > 8 || Math.abs(t.clientX - touchStartX) > 8) {
        touchMoved = true;
      }

      if (freeExploreRef.current) {
        targetFreeYaw -= dx * 0.0045;
        targetFreePitch = THREE.MathUtils.clamp(
          targetFreePitch - dy * 0.004,
          -1.25,
          1.25
        );
        return;
      }

      const scrollStep = -dy / TOUCH_SCROLL_DIVISOR;
      touchVelocityY = scrollStep;
      const next = clampProgress(targetProgressRef.current + scrollStep);
      targetProgressRef.current = next;
      callbacksRef.current.onTargetProgressChange(next);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const dtMs = performance.now() - touchStartTime;
      const totalDx = t.clientX - touchStartX;
      const totalDy = t.clientY - touchStartY;

      if (!freeExploreRef.current) {
        const gesture = computeGestureDelta(totalDx, totalDy, dtMs);
        if (gesture.horizontalSwipe) {
          callbacksRef.current.onGestureSwipe(gesture.horizontalSwipe);
          return;
        }
        if (touchMoved && Math.abs(touchVelocityY) > 0.00025) {
          const momentum = clampProgress(
            targetProgressRef.current + touchVelocityY * 2.2
          );
          targetProgressRef.current = momentum;
          callbacksRef.current.onTargetProgressChange(momentum);
          return;
        }
      }

      if (!touchMoved && cosmosRoot.visible) {
        const rect = canvas.getBoundingClientRect();
        _pointerNdc.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
        _pointerNdc.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
        _raycaster.setFromCamera(_pointerNdc, camera);
        const hits = _raycaster.intersectObjects(interactables, false);
        if (hits.length > 0 && hits[0].object.userData?.projectId) {
          callbacksRef.current.onSelectProject(
            String(hits[0].object.userData.projectId)
          );
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (freeExploreRef.current && isPointerDragging) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        targetFreeYaw -= dx * 0.004;
        targetFreePitch = THREE.MathUtils.clamp(
          targetFreePitch - dy * 0.0035,
          -1.25,
          1.25
        );
      }

      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetOffsetX = nx * 1.15;
      targetOffsetY = ny * 0.65;

      const now = performance.now();
      if (now - lastRaycastTime < 65) return;
      lastRaycastTime = now;

      if (!cosmosRoot.visible) {
        if (lastHoveredId !== null) {
          lastHoveredId = null;
          canvas.style.cursor = 'grab';
          callbacksRef.current.onHoverProjectChange(null);
        }
        return;
      }

      _pointerNdc.set(nx, ny);
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(interactables, false);
      const hoveredId =
        hits.length > 0 && hits[0].object.userData?.projectId
          ? String(hits[0].object.userData.projectId)
          : null;

      if (hoveredId !== lastHoveredId) {
        lastHoveredId = hoveredId;
        canvas.style.cursor = hoveredId ? 'pointer' : 'grab';
        callbacksRef.current.onHoverProjectChange(hoveredId);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!cosmosRoot.visible) return;
      const rect = canvas.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(interactables, false);
      if (hits.length > 0 && hits[0].object.userData?.projectId) {
        callbacksRef.current.onSelectProject(
          String(hits[0].object.userData.projectId)
        );
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!freeExploreRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') freeKeys.forward = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') freeKeys.backward = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') freeKeys.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') freeKeys.right = true;
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') freeKeys.up = true;
      if (e.key === 'q' || e.key === 'Q') freeKeys.down = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') freeKeys.forward = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') freeKeys.backward = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') freeKeys.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') freeKeys.right = false;
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') freeKeys.up = false;
      if (e.key === 'q' || e.key === 'Q') freeKeys.down = false;
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
      );
      renderer.render(scene, camera);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;
    let lastUiSyncTime = 0;
    let lastAtmosphereEarth: boolean | null = null;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function applyAtmosphereAndVisibility(inEarthRealm: boolean, blackoutAlpha: number) {
      if (blackoutOverlayRef.current) {
        blackoutOverlayRef.current.style.opacity = String(blackoutAlpha);
      }

      cosmosRoot.visible = !inEarthRealm;
      earthWorld.group.visible = inEarthRealm;

      if (lastAtmosphereEarth !== inEarthRealm) {
        lastAtmosphereEarth = inEarthRealm;
        if (inEarthRealm) {
          scene.background = _earthBgColor;
          scene.fog = earthFog;
          hemiLight.color.setHex(0xdbeafe);
          hemiLight.groundColor.setHex(0x65a30d);
          hemiLight.intensity = 1.25;
          keyLight.intensity = 0.65;
          earthSunLight.intensity = 2.45;
          renderer.toneMappingExposure = 1.05;
        } else {
          scene.background = _spaceBgColor;
          scene.fog = spaceFog;
          hemiLight.color.setHex(0x38bdf8);
          hemiLight.groundColor.setHex(0x070a14);
          hemiLight.intensity = 0.9;
          keyLight.intensity = 2.35;
          earthSunLight.intensity = 0;
          renderer.toneMappingExposure = 1.15;
        }
      }
    }

    function updateWorld(tElapsed: number, scaledDt: number) {
      camera.updateMatrixWorld();
      const inEarthRealm = freeExploreRef.current
        ? camera.position.z < -60000
        : smoothedProgress >= EARTH_START_PROGRESS;

      const blackoutAlpha = freeExploreRef.current
        ? 0
        : getSingularityBlackoutOpacity(smoothedProgress);

      applyAtmosphereAndVisibility(inEarthRealm, blackoutAlpha);

      if (inEarthRealm) {
        earthWorld.update(tElapsed, camera);
      } else {
        solarCore.update(tElapsed, scaledDt, camera);
        techPlanet.update(tElapsed, scaledDt, camera);
        megaExoplanets.update(tElapsed, scaledDt, camera);
        for (const station of projectStations) {
          station.update(tElapsed, scaledDt, camera);
        }
        carinaNebula.update(tElapsed, scaledDt, camera);
        cygnusBinary.update(tElapsed, scaledDt, camera);
        colossalGalaxies.update(tElapsed, scaledDt, camera);
        zodiacSky.update(tElapsed, camera);
        asteroidBelt.update(tElapsed, camera);
        cosmos.update(tElapsed, scaledDt, camera);
        blackHole.update(tElapsed, scaledDt, camera);
      }

      storyNodes.update(
        tElapsed,
        camera.position,
        smoothedProgress,
        freeExploreRef.current
      );
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.08, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const motionScale = reducedMotionRef.current ? 0.15 : 1;
      elapsed += dt * motionScale;

      if (freeExploreRef.current) {
        if (!wasFreeExplore) {
          wasFreeExplore = true;
          freePos.copy(camera.position);
          _eulerScratch.setFromQuaternion(camera.quaternion, 'YXZ');
          freeYaw = _eulerScratch.y;
          freePitch = _eulerScratch.x;
          targetFreeYaw = freeYaw;
          targetFreePitch = freePitch;
        }

        freeYaw = applyExponentialDamping(freeYaw, targetFreeYaw, 10, dt);
        freePitch = applyExponentialDamping(freePitch, targetFreePitch, 10, dt);
        _eulerScratch.set(freePitch, freeYaw, 0, 'YXZ');
        camera.quaternion.setFromEuler(_eulerScratch);

        camera.getWorldDirection(_forwardScratch);
        _rightScratch.crossVectors(_forwardScratch, camera.up).normalize();

        const inEarth = freePos.z < -60000;
        const flySpeed = (inEarth ? 210 : 480) * dt;
        const thrustDir =
          (freeKeys.forward ? 1 : 0) -
          (freeKeys.backward ? 1 : 0) +
          freeThrustRef.current;
        if (thrustDir !== 0) {
          freePos.addScaledVector(_forwardScratch, thrustDir * flySpeed);
        }
        const strafeDir = (freeKeys.right ? 1 : 0) - (freeKeys.left ? 1 : 0);
        if (strafeDir !== 0) {
          freePos.addScaledVector(_rightScratch, strafeDir * flySpeed);
        }
        const elevDir = (freeKeys.up ? 1 : 0) - (freeKeys.down ? 1 : 0);
        if (elevDir !== 0) {
          freePos.y += elevDir * flySpeed * 0.7;
        }

        // Prevent sinking beneath mountains, valleys, beach, or ocean water on Earth
        if (inEarth) {
          const groundY = earthTerrainHeightAt(
            freePos.x - EARTH_ORIGIN[0],
            freePos.z - EARTH_ORIGIN[2]
          );
          const minCamY = Math.max(4.5, groundY + 4.5);
          if (freePos.y < minCamY) {
            freePos.y = minCamY;
          }
        }

        camera.position.lerp(freePos, 1 - Math.exp(-10 * dt));

        if (now - lastUiSyncTime > 150) {
          lastUiSyncTime = now;
          callbacksRef.current.onFreePositionChange([
            camera.position.x,
            camera.position.y,
            camera.position.z,
          ]);
        }
      } else {
        wasFreeExplore = false;

        if (autoCruiseRef.current) {
          const step = computeAutoCruiseStep(
            dt,
            cruiseSpeedRef.current,
            ONE_HOUR_CRUISE_DURATION_SEC
          );
          const nextAuto = clampProgress(targetProgressRef.current + step);
          targetProgressRef.current = nextAuto >= 0.999 ? 0 : nextAuto;
          if (now - lastUiSyncTime > 120) {
            callbacksRef.current.onTargetProgressChange(targetProgressRef.current);
          }
        }

        const prevSmoothed = smoothedProgress;
        const gap = Math.abs(targetProgressRef.current - smoothedProgress);

        // If crossing directly between Cosmos and Earth via sector jump/slider, cross swiftly
        const crossingRealmJump =
          gap > 0.14 ||
          (prevSmoothed < EARTH_START_PROGRESS && targetProgressRef.current >= BLACKOUT_FULL_START) ||
          (prevSmoothed >= EARTH_START_PROGRESS && targetProgressRef.current < EARTH_START_PROGRESS);

        if (crossingRealmJump && gap > 0.12) {
          smoothedProgress = targetProgressRef.current;
        } else {
          const progressLambda = reducedMotionRef.current ? 16 : gap > 0.06 ? 8.2 : 4.2;
          smoothedProgress = applyExponentialDamping(
            smoothedProgress,
            targetProgressRef.current,
            progressLambda,
            dt
          );
        }
        const velocity = (smoothedProgress - prevSmoothed) / dt;

        if (now - lastUiSyncTime > 110) {
          lastUiSyncTime = now;
          callbacksRef.current.onSettledProgressChange(smoothedProgress);
        }

        pointerOffsetX = applyExponentialDamping(pointerOffsetX, targetOffsetX, 5.5, dt);
        pointerOffsetY = applyExponentialDamping(pointerOffsetY, targetOffsetY, 5.5, dt);

        const sample = sampleUnifiedJourney(
          smoothedProgress,
          FLIGHT_PATH_CONTROL_POINTS
        );
        _camPosScratch.set(
          sample.position[0] + pointerOffsetX * 0.75,
          sample.position[1] + pointerOffsetY * 0.5,
          sample.position[2]
        );
        _lookAtScratch.set(
          sample.lookAt[0] + pointerOffsetX * 0.35,
          sample.lookAt[1] + pointerOffsetY * 0.25,
          sample.lookAt[2]
        );

        // Snap camera if teleporting across cosmos <-> Earth singularity boundary
        if (Math.abs(camera.position.z - _camPosScratch.z) > 12000) {
          camera.position.copy(_camPosScratch);
          _currentLookScratch.copy(_lookAtScratch);
        } else {
          const camLambda = reducedMotionRef.current ? 18 : 6.5;
          const camAlpha = 1 - Math.exp(-camLambda * dt);
          camera.position.lerp(_camPosScratch, camAlpha);
          _currentLookScratch.lerp(_lookAtScratch, camAlpha);
        }
        camera.lookAt(_currentLookScratch);

        const desiredFov = reducedMotionRef.current
          ? 56
          : computeFovFromVelocity(56, velocity, 8);
        if (Math.abs(camera.fov - desiredFov) > 0.04) {
          camera.fov = applyExponentialDamping(camera.fov, desiredFov, 7, dt);
          camera.updateProjectionMatrix();
        }
      }

      updateWorld(elapsed, dt * motionScale);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    updateWorld(0, 0);
    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      earthWorld.dispose();
      storyNodes.dispose();
      starSpriteTex.dispose();
      nebulaSmokeA.dispose();
      nebulaSmokeB.dispose();
      planetTextures.map.dispose();
      planetTextures.bumpMap.dispose();
      planetTextures.roughnessMap.dispose();
      gasVioletTex.map.dispose();
      gasVioletTex.bumpMap.dispose();
      gasVioletTex.roughnessMap.dispose();
      gasAmberTex.map.dispose();
      gasAmberTex.bumpMap.dispose();
      gasAmberTex.roughnessMap.dispose();
      volcanicTex.map.dispose();
      volcanicTex.bumpMap.dispose();
      volcanicTex.roughnessMap.dispose();
      iceTex.map.dispose();
      iceTex.bumpMap.dispose();
      iceTex.roughnessMap.dispose();
      asteroidBumpTex.dispose();
      metalBumpTex.dispose();
      envTex.dispose();

      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        data-testid="galaxy-canvas-container"
        className="fixed inset-0 w-full h-full z-0"
      />
      {/* Pure Pitch-Black #000000 Singularity Transition Veil */}
      <div
        ref={blackoutOverlayRef}
        data-testid="singularity-blackout"
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-10 bg-black"
      />
      {contextLost && (
        <div
          role="status"
          className="fixed inset-0 z-15 flex items-center justify-center bg-[#030612] p-6 text-center"
        >
          <div className="max-w-md rounded-2xl border border-white/15 bg-[#090f24] p-6">
            <h2 className="font-display text-xl font-bold text-white">
              Tampilan 3D Dijeda
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Konteks grafis WebGL sedang dipulihkan. Anda tetap dapat menelusuri profil dan proyek Rasya Ardiansyah melalui kontrol navigasi di bawah.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
