import { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Layers,
  Pause,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import {
  COSMIC_SECTORS,
  CREATIVE_PROJECTS,
  DEVELOPER_PROFILE,
  ONE_HOUR_CRUISE_DURATION_SEC,
  TOP_NAV_SECTOR_IDS,
  type CosmicLandmark,
  type CosmicSector,
  type CosmicStoryBeat,
} from '../data/portfolioData';
import {
  formatJourneyTime,
  type ActivityNotificationDraft,
} from '../utils/galaxyNavigation';
import { CosmicMotionText } from './CosmicMotionText';

interface NarrativeHUDProps {
  progress: number;
  activeSector: CosmicSector;
  activeStoryBeat: CosmicStoryBeat;
  reducedMotion: boolean;
  nearestLandmark: { landmark: CosmicLandmark; distance: number };
  activeProjectsDiscovered: string[];
  hoveredProjectId: string | null;
  autoCruise: boolean;
  cruiseSpeed: number;
  freeExplore: boolean;
  controlsCollapsed: boolean;
  activeToast: ActivityNotificationDraft | null;
  notifications: ActivityNotificationDraft[];
  onJumpToProgress: (nextProgress: number) => void;
  onStepSector: (direction: 'next' | 'prev') => void;
  onToggleAutoCruise: () => void;
  onCycleCruiseSpeed: () => void;
  onToggleFreeExplore: () => void;
  onSetFreeThrust: (thrust: -1 | 0 | 1) => void;
  onToggleCollapse: () => void;
  onSelectProject: (projectId: string) => void;
  onOpenContact: () => void;
  onDismissToast: () => void;
}

export function NarrativeHUD({
  progress,
  activeSector,
  activeStoryBeat,
  reducedMotion,
  nearestLandmark,
  activeProjectsDiscovered,
  hoveredProjectId,
  autoCruise,
  cruiseSpeed,
  freeExplore,
  controlsCollapsed,
  activeToast,
  notifications,
  onJumpToProgress,
  onStepSector,
  onToggleAutoCruise,
  onCycleCruiseSpeed,
  onToggleFreeExplore,
  onSetFreeThrust,
  onToggleCollapse,
  onSelectProject,
  onOpenContact,
  onDismissToast,
}: NarrativeHUDProps) {
  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);

  const progressPct = Math.round(progress * 100);
  const journeyTimeLabel = formatJourneyTime(progress, ONE_HOUR_CRUISE_DURATION_SEC);
  const hoveredProject = hoveredProjectId
    ? CREATIVE_PROJECTS.find((p) => p.id === hoveredProjectId) || null
    : null;

  const topNavSectors = TOP_NAV_SECTOR_IDS.map((id) =>
    COSMIC_SECTORS.find((s) => s.id === id)!
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between">
      {/* Strict 3-Zone Top Bar: Wordmark — 5 Sector Links — 1 Primary Action */}
      <header className="pointer-events-auto flex h-12 md:h-14 items-center justify-between gap-4 md:gap-8 border-b border-white/10 bg-[#050918]/90 px-4 md:px-8">
        <a
          href="#origin"
          onClick={(e) => {
            e.preventDefault();
            onJumpToProgress(0);
          }}
          className="font-display text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          {DEVELOPER_PROFILE.name}
        </a>

        <nav
          aria-label="Navigasi Sektor Galaksi"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
        >
          {topNavSectors.map((sector) => {
            const isActive = sector.id === activeSector.id;
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => onJumpToProgress(sector.anchorProgress)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'border-amber-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {sector.shortNavLabel}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenContact}
            className="min-h-[36px] md:min-h-[40px] rounded-lg bg-amber-400 px-3.5 md:px-4 py-1.5 text-xs md:text-sm font-semibold text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            Hubungi
          </button>
        </div>
      </header>

      {/* Real-Time Activity Notification Toast */}
      {activeToast && (
        <aside
          aria-live="polite"
          className="pointer-events-auto fixed top-14 md:top-16 right-3 md:right-6 z-30 w-[calc(100vw-24px)] max-w-xs rounded-xl border border-white/15 bg-[#080e24]/95 px-3.5 py-2.5 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-medium text-amber-300">
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{activeToast.title}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-200 leading-snug">
                {activeToast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissToast}
              aria-label="Tutup notifikasi"
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* Hovered 3D Artifact Hint */}
      {hoveredProject && !controlsCollapsed && (
        <div className="pointer-events-none self-center rounded-xl border border-white/15 bg-[#070c1e]/92 px-4 py-2 text-center shadow-lg">
          <div className="text-xs text-amber-300 font-medium">
            Klik untuk Membuka Proyek
          </div>
          <div className="font-display text-sm font-bold text-white">
            {hoveredProject.title}
          </div>
        </div>
      )}

      {/* Bottom Cardless After-Effects Story Typography & Collapsible Control Dock */}
      <div className="flex flex-col gap-3 px-3 sm:px-6 pb-3 sm:pb-5">
        {!controlsCollapsed && (
          <div className="px-1 sm:px-2 pb-1">
            <CosmicMotionText
              beat={activeStoryBeat}
              freeExplore={freeExplore}
              landmarkName={nearestLandmark.landmark.name}
              landmarkDistance={nearestLandmark.distance}
              journeyTimeLabel={journeyTimeLabel}
              progressPct={progressPct}
              reducedMotion={reducedMotion}
            />
          </div>
        )}

        {/* Popover Drawers above Bottom Dock */}
        {projectsDrawerOpen && !controlsCollapsed && (
          <div
            role="region"
            aria-label="Daftar Proyek Kreatif"
            className="pointer-events-auto mx-auto w-full max-w-3xl rounded-2xl border border-white/15 bg-[#080e24]/95 p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="text-sm font-semibold text-white">
                Indeks Proyek Kreatif ({activeProjectsDiscovered.length}/{CREATIVE_PROJECTS.length} Dipindai)
              </div>
              <button
                type="button"
                onClick={() => setProjectsDrawerOpen(false)}
                aria-label="Tutup daftar proyek"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CREATIVE_PROJECTS.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    setProjectsDrawerOpen(false);
                    onJumpToProgress(project.orbitalProgress);
                    onSelectProject(project.id);
                  }}
                  className="min-h-[56px] flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {project.title}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {project.category} · {project.platform}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activityDrawerOpen && !controlsCollapsed && (
          <div
            role="region"
            aria-label="Log Aktivitas Real-Time"
            className="pointer-events-auto mx-auto w-full max-w-2xl rounded-2xl border border-white/15 bg-[#080e24]/95 p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="text-sm font-semibold text-white">
                Log Progres Aktivitas ({notifications.length})
              </div>
              <button
                type="button"
                onClick={() => setActivityDrawerOpen(false)}
                aria-label="Tutup log aktivitas"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="mt-3 max-h-48 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <li className="text-xs text-slate-400 py-2">
                  Gulir atau geser layar untuk mencatat progres eksplorasi galaksi.
                </li>
              ) : (
                notifications.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-300">
                        {item.message}
                      </div>
                    </div>
                    <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">
                      {item.timestampLabel}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {/* Unified Collapsible Bottom Control Dock */}
        <div className="pointer-events-auto mx-auto flex flex-col items-center w-full max-w-[960px]">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!controlsCollapsed}
            aria-label={
              controlsCollapsed ? 'Tampilkan kontrol navigasi' : 'Sembunyikan kontrol navigasi'
            }
            className="mb-1.5 inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 border-white/15 bg-[#060b1c]/92 px-3 py-1 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
          >
            {controlsCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Tampilkan Kontrol (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Mode Sinema (H)</span>
              </>
            )}
          </button>

          {!controlsCollapsed && (
            <div className="w-full rounded-2xl border border-white/15 bg-[#060b1c]/92 px-2 sm:px-4 py-1.5 sm:py-2 shadow-2xl">
              <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                {freeExplore ? (
                  /* Free-Flight Thrust Controls (Android-first thumb friendly) */
                  <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onPointerDown={() => onSetFreeThrust(1)}
                      onPointerUp={() => onSetFreeThrust(0)}
                      onPointerLeave={() => onSetFreeThrust(0)}
                      onPointerCancel={() => onSetFreeThrust(0)}
                      aria-label="Terbang maju"
                      className="min-h-[44px] flex-1 sm:flex-initial px-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 text-xs font-semibold text-white active:bg-amber-400 active:text-slate-950 transition-colors whitespace-nowrap"
                    >
                      <ArrowUp className="w-4 h-4 shrink-0" />
                      <span>Maju</span>
                    </button>
                    <button
                      type="button"
                      onPointerDown={() => onSetFreeThrust(-1)}
                      onPointerUp={() => onSetFreeThrust(0)}
                      onPointerLeave={() => onSetFreeThrust(0)}
                      onPointerCancel={() => onSetFreeThrust(0)}
                      aria-label="Terbang mundur"
                      className="min-h-[44px] flex-1 sm:flex-initial px-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 text-xs font-semibold text-white active:bg-amber-400 active:text-slate-950 transition-colors whitespace-nowrap"
                    >
                      <ArrowDown className="w-4 h-4 shrink-0" />
                      <span>Mundur</span>
                    </button>
                    <span className="hidden md:inline text-xs text-slate-400 truncate pl-2">
                      Seret untuk putar 360° · W/A/S/D atau Gulir untuk terbang
                    </span>
                  </div>
                ) : (
                  /* Guided 10-Minute Orbital Path Controls */
                  <>
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onStepSector('prev')}
                        aria-label="Sektor sebelumnya"
                        className="min-h-[44px] min-w-[40px] sm:min-w-[44px] flex items-center justify-center rounded-xl text-slate-200 hover:bg-white/10 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onStepSector('next')}
                        aria-label="Sektor berikutnya"
                        className="min-h-[44px] min-w-[40px] sm:min-w-[44px] flex items-center justify-center rounded-xl text-slate-200 hover:bg-white/10 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <label htmlFor="galaxy-flight-slider" className="sr-only">
                        Posisi jalur galaksi
                      </label>
                      <input
                        id="galaxy-flight-slider"
                        type="range"
                        min={0}
                        max={100}
                        step={0.2}
                        value={Number((progress * 100).toFixed(1))}
                        onChange={(e) => onJumpToProgress(Number(e.target.value) / 100)}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <span className="hidden lg:inline font-mono-tabular text-xs font-medium text-slate-300 w-24 text-right shrink-0">
                        {journeyTimeLabel}
                      </span>
                    </div>
                  </>
                )}

                {/* Compact Functional Toggles */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onToggleFreeExplore}
                    aria-pressed={freeExplore}
                    aria-label={freeExplore ? 'Kembali ke jalur terpandu' : 'Aktifkan mode jelajah bebas'}
                    className={`min-h-[44px] px-2.5 sm:px-3 inline-flex items-center gap-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      freeExplore
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Compass className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">
                      {freeExplore ? 'Jalur' : 'Bebas'}
                    </span>
                  </button>

                  {!freeExplore && (
                    <>
                      <button
                        type="button"
                        onClick={onToggleAutoCruise}
                        aria-pressed={autoCruise}
                        aria-label={autoCruise ? 'Jeda jelajah otomatis' : 'Mulai jelajah otomatis 1 jam'}
                        className={`min-h-[44px] px-2.5 sm:px-3 inline-flex items-center gap-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          autoCruise
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-white/5 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        {autoCruise ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span className="hidden md:inline">
                          {autoCruise ? 'Jeda' : 'Jelajah'}
                        </span>
                      </button>

                      {autoCruise && (
                        <button
                          type="button"
                          onClick={onCycleCruiseSpeed}
                          aria-label={`Kecepatan jelajah ${cruiseSpeed}x`}
                          className="min-h-[44px] px-2.5 inline-flex items-center justify-center rounded-xl bg-white/10 font-mono-tabular text-xs font-semibold text-amber-300 hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
                        >
                          {cruiseSpeed}x
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActivityDrawerOpen(false);
                      setProjectsDrawerOpen((v) => !v);
                    }}
                    aria-expanded={projectsDrawerOpen}
                    aria-label="Buka daftar proyek"
                    className={`min-h-[44px] px-2.5 sm:px-3 inline-flex items-center gap-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      projectsDrawerOpen
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">Proyek</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProjectsDrawerOpen(false);
                      setActivityDrawerOpen((v) => !v);
                    }}
                    aria-expanded={activityDrawerOpen}
                    aria-label={`Buka log aktivitas (${notifications.length})`}
                    className={`min-h-[44px] px-2.5 sm:px-3 inline-flex items-center gap-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activityDrawerOpen
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="font-mono-tabular">{notifications.length}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
