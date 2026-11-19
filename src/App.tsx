import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GalaxyCanvas } from './components/GalaxyCanvas';
import { NarrativeHUD } from './components/NarrativeHUD';
import { ProjectModal } from './components/ProjectModal';
import { ContactModal } from './components/ContactModal';
import {
  COSMIC_LANDMARKS,
  COSMIC_SECTORS,
  COSMIC_STORY_BEATS,
  CREATIVE_PROJECTS,
  FLIGHT_PATH_CONTROL_POINTS,
  type CreativeProject,
  type Vec3Tuple,
} from './data/portfolioData';
import {
  clampProgress,
  findNearestLandmark,
  getActiveSector,
  getActiveStoryBeat,
  getJourneyRealm,
  getMilestoneNotifications,
  sampleUnifiedJourney,
  type ActivityNotificationDraft,
} from './utils/galaxyNavigation';

function formatNow(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

const CRUISE_SPEED_OPTIONS = [1, 5, 15, 30] as const;

export default function App() {
  const initialProgress = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const pParam = params.get('progress');
    if (pParam !== null && !Number.isNaN(Number(pParam))) {
      return clampProgress(Number(pParam));
    }
    const sectorParam = params.get('sector');
    if (sectorParam) {
      const found = COSMIC_SECTORS.find((s) => s.id === sectorParam);
      if (found) return found.anchorProgress;
    }
    return 0.015;
  }, []);

  const [targetProgress, setTargetProgress] = useState<number>(initialProgress);
  const [settledProgress, setSettledProgress] = useState<number>(initialProgress);
  const [autoCruise, setAutoCruise] = useState<boolean>(false);
  const [cruiseSpeedIdx, setCruiseSpeedIdx] = useState<number>(0);
  const [freeExplore, setFreeExplore] = useState<boolean>(false);
  const [freeThrust, setFreeThrust] = useState<-1 | 0 | 1>(0);
  const [freePosition, setFreePosition] = useState<Vec3Tuple>(() =>
    sampleUnifiedJourney(initialProgress, FLIGHT_PATH_CONTROL_POINTS).position
  );
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [discoveredProjects, setDiscoveredProjects] = useState<string[]>([]);
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  const [contactSubject, setContactSubject] = useState<string>('');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<ActivityNotificationDraft[]>([
    {
      id: 'init-welcome',
      title: 'Sektor 01 · Matahari Awal',
      message: 'Gulir perlahan untuk menjelajah alam semesta 1 jam, atau aktifkan Mode Bebas.',
      kind: 'sector',
      timestampLabel: formatNow(),
    },
  ]);
  const [activeToast, setActiveToast] = useState<ActivityNotificationDraft | null>(null);

  const prevProgressRef = useRef<number>(initialProgress);
  const unlockedMilestonesRef = useRef<Set<string>>(new Set(['sector:origin']));
  const lastFreeLandmarkRef = useRef<string>('');
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const pushNotifications = useCallback((items: ActivityNotificationDraft[]) => {
    if (items.length === 0) return;
    setNotifications((prev) => [...items, ...prev].slice(0, 28));
    const latest = items[items.length - 1];
    setActiveToast(latest);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setActiveToast(null);
    }, 4200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSettledProgressChange = useCallback(
    (nextProgress: number) => {
      setSettledProgress(nextProgress);
      const prev = prevProgressRef.current;
      prevProgressRef.current = nextProgress;

      const generated = getMilestoneNotifications(
        prev,
        nextProgress,
        unlockedMilestonesRef.current,
        COSMIC_SECTORS
      );
      if (generated.length > 0) {
        pushNotifications(generated);
      }
    },
    [pushNotifications]
  );

  const handleJumpToProgress = useCallback((next: number) => {
    setFreeExplore(false);
    setFreeThrust(0);
    setAutoCruise(false);
    setTargetProgress(clampProgress(next));
  }, []);

  const activeSector = useMemo(
    () => getActiveSector(settledProgress, COSMIC_SECTORS),
    [settledProgress]
  );

  const activeStoryBeat = useMemo(
    () => getActiveStoryBeat(settledProgress, COSMIC_STORY_BEATS),
    [settledProgress]
  );

  const nearestLandmark = useMemo(
    () => findNearestLandmark(freePosition, COSMIC_LANDMARKS),
    [freePosition]
  );

  const handleFreePositionChange = useCallback(
    (pos: Vec3Tuple) => {
      setFreePosition(pos);
      const nearest = findNearestLandmark(pos, COSMIC_LANDMARKS);
      if (
        nearest.distance <= nearest.landmark.radius &&
        lastFreeLandmarkRef.current !== nearest.landmark.id
      ) {
        lastFreeLandmarkRef.current = nearest.landmark.id;
        pushNotifications([
          {
            id: `free-landmark-${nearest.landmark.id}-${Date.now()}`,
            title: 'Objek Kosmik Terdeteksi',
            message: `Memasuki jangkauan ${nearest.landmark.name}.`,
            kind: 'sector',
            timestampLabel: formatNow(),
          },
        ]);
      }
    },
    [pushNotifications]
  );

  const handleStepSector = useCallback(
    (direction: 'next' | 'prev') => {
      setFreeExplore(false);
      setFreeThrust(0);
      setAutoCruise(false);
      const currentIdx = COSMIC_SECTORS.findIndex((s) => s.id === activeSector.id);
      const targetIdx =
        direction === 'next'
          ? Math.min(COSMIC_SECTORS.length - 1, currentIdx + 1)
          : Math.max(0, currentIdx - 1);
      const targetSector = COSMIC_SECTORS[targetIdx];
      setTargetProgress(targetSector.anchorProgress);
    },
    [activeSector.id]
  );

  const handleGestureSwipe = useCallback(
    (direction: 'next' | 'prev') => {
      handleStepSector(direction);
      pushNotifications([
        {
          id: `gesture-${Date.now()}`,
          title: 'Navigasi Gestur Aktif',
          message:
            direction === 'next'
              ? 'Berpindah mulus ke sektor berikutnya.'
              : 'Kembali ke sektor sebelumnya.',
          kind: 'gesture',
          timestampLabel: formatNow(),
        },
      ]);
    },
    [handleStepSector, pushNotifications]
  );

  const handleToggleFreeExplore = useCallback(() => {
    setFreeExplore((prev) => {
      const next = !prev;
      setAutoCruise(false);
      setFreeThrust(0);
      if (next) {
        const currentPos = sampleUnifiedJourney(
          settledProgress,
          FLIGHT_PATH_CONTROL_POINTS
        ).position;
        setFreePosition(currentPos);
        pushNotifications([
          {
            id: `free-mode-${Date.now()}`,
            title: 'Mode Jelajah Bebas Aktif',
            message: 'Putar kamera 360° dan terbang bebas menembus galaksi.',
            kind: 'gesture',
            timestampLabel: formatNow(),
          },
        ]);
      } else {
        pushNotifications([
          {
            id: `guided-mode-${Date.now()}`,
            title: 'Kembali ke Jalur Terpandu',
            message: 'Kamera kembali mengikuti jalur antargalaksi 1 jam.',
            kind: 'gesture',
            timestampLabel: formatNow(),
          },
        ]);
      }
      return next;
    });
  }, [pushNotifications, settledProgress]);

  const handleSelectProject = useCallback(
    (projectId: string) => {
      setAutoCruise(false);
      setSelectedProjectId(projectId);
      const project = CREATIVE_PROJECTS.find((p) => p.id === projectId);
      if (!project) return;

      setDiscoveredProjects((prev) =>
        prev.includes(projectId) ? prev : [...prev, projectId]
      );

      pushNotifications([
        {
          id: `artifact-${projectId}-${Date.now()}`,
          title: 'Artefak Proyek Dipindai',
          message: `${project.title} (${project.category}) dibuka.`,
          kind: 'artifact',
          timestampLabel: formatNow(),
        },
      ]);
    },
    [pushNotifications]
  );

  const handleJumpToProjectOrbit = useCallback((project: CreativeProject) => {
    setSelectedProjectId(null);
    setFreeExplore(false);
    setAutoCruise(false);
    setTargetProgress(project.orbitalProgress);
  }, []);

  const handleContactSubmitted = useCallback(
    (senderName: string, topic: string) => {
      pushNotifications([
        {
          id: `contact-${Date.now()}`,
          title: 'Pesan Kolaborasi Tercatat',
          message: `Dari ${senderName} mengenai ${topic}.`,
          kind: 'milestone',
          timestampLabel: formatNow(),
        },
      ]);
    },
    [pushNotifications]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        setControlsCollapsed((v) => !v);
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        handleToggleFreeExplore();
        return;
      }

      if (freeExplore) return;

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setAutoCruise(false);
        setTargetProgress((p) => clampProgress(p + 0.0038));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setAutoCruise(false);
        setTargetProgress((p) => clampProgress(p - 0.0038));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleStepSector('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleStepSector('prev');
      } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (COSMIC_SECTORS[idx]) {
          handleJumpToProgress(COSMIC_SECTORS[idx].anchorProgress);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [freeExplore, handleJumpToProgress, handleStepSector, handleToggleFreeExplore]);

  const selectedProject = useMemo(
    () => CREATIVE_PROJECTS.find((p) => p.id === selectedProjectId) ?? null,
    [selectedProjectId]
  );

  const cruiseSpeed = CRUISE_SPEED_OPTIONS[cruiseSpeedIdx];
  const currentRealm = useMemo(
    () =>
      freeExplore
        ? freePosition[2] < -60000
          ? 'earth'
          : 'cosmos'
        : getJourneyRealm(settledProgress),
    [freeExplore, freePosition, settledProgress]
  );

  return (
    <main
      data-sector={activeSector.id}
      data-realm={currentRealm}
      data-progress={Math.round(settledProgress * 100)}
      data-mode={freeExplore ? 'free' : 'guided'}
      className="relative h-screen w-screen overflow-hidden bg-[#030612] text-[#f4f7ff]"
    >
      <GalaxyCanvas
        targetProgress={targetProgress}
        autoCruise={autoCruise}
        cruiseSpeed={cruiseSpeed}
        freeExplore={freeExplore}
        freeThrust={freeThrust}
        reducedMotion={reducedMotion}
        onTargetProgressChange={setTargetProgress}
        onSettledProgressChange={handleSettledProgressChange}
        onFreePositionChange={handleFreePositionChange}
        onSelectProject={handleSelectProject}
        onGestureSwipe={handleGestureSwipe}
        onHoverProjectChange={setHoveredProjectId}
      />

      <NarrativeHUD
        progress={settledProgress}
        activeSector={activeSector}
        activeStoryBeat={activeStoryBeat}
        reducedMotion={reducedMotion}
        nearestLandmark={nearestLandmark}
        activeProjectsDiscovered={discoveredProjects}
        hoveredProjectId={hoveredProjectId}
        autoCruise={autoCruise}
        cruiseSpeed={cruiseSpeed}
        freeExplore={freeExplore}
        controlsCollapsed={controlsCollapsed}
        activeToast={selectedProject || contactOpen ? null : activeToast}
        notifications={notifications}
        onJumpToProgress={handleJumpToProgress}
        onStepSector={handleStepSector}
        onToggleAutoCruise={() => setAutoCruise((v) => !v)}
        onCycleCruiseSpeed={() =>
          setCruiseSpeedIdx((i) => (i + 1) % CRUISE_SPEED_OPTIONS.length)
        }
        onToggleFreeExplore={handleToggleFreeExplore}
        onSetFreeThrust={setFreeThrust}
        onToggleCollapse={() => setControlsCollapsed((v) => !v)}
        onSelectProject={handleSelectProject}
        onOpenContact={() => {
          setContactSubject('');
          setContactOpen(true);
        }}
        onDismissToast={() => setActiveToast(null)}
      />

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProjectId(null)}
        onJumpToOrbit={handleJumpToProjectOrbit}
        onOpenContact={(projectTitle) => {
          setSelectedProjectId(null);
          setContactSubject(projectTitle);
          setContactOpen(true);
        }}
      />

      <ContactModal
        open={contactOpen}
        initialSubject={contactSubject}
        onClose={() => setContactOpen(false)}
        onSubmitted={handleContactSubmitted}
      />
    </main>
  );
}
