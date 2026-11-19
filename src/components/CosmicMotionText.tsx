import type { CosmicStoryBeat } from '../data/portfolioData';

interface CosmicMotionTextProps {
  beat: CosmicStoryBeat;
  freeExplore: boolean;
  landmarkName: string;
  landmarkDistance: number;
  journeyTimeLabel: string;
  progressPct: number;
  reducedMotion: boolean;
}

export function CosmicMotionText({
  beat,
  freeExplore,
  landmarkName,
  landmarkDistance,
  journeyTimeLabel,
  progressPct,
  reducedMotion,
}: CosmicMotionTextProps) {
  const accent = freeExplore ? '#22d3ee' : beat.accentHex;
  const activeKey = freeExplore ? `free-${landmarkName}` : beat.id;
  const displayTitle = freeExplore
    ? `Terbang Bebas di Sekitar ${landmarkName}`
    : beat.text;
  const words = displayTitle.split(' ');

  return (
    <section
      aria-label="Narasi Kosmik Motion"
      className="pointer-events-none select-none max-w-xl sm:max-w-2xl"
    >
      <div
        key={activeKey}
        className="relative py-2 px-1"
      >
        {/* Animated After Effects Vector Kinetic Rule (zero card box) */}
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            style={{
              background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0))`,
            }}
            className={`h-[2px] w-12 sm:w-16 shrink-0 ${
              reducedMotion ? '' : 'ae-rule-grow'
            }`}
          />
          <span
            className={`font-mono-tabular text-[11px] sm:text-xs font-semibold uppercase tracking-widest cosmic-text-halo ${
              reducedMotion ? '' : 'ae-tag-track'
            }`}
            style={{ color: accent }}
          >
            {freeExplore
              ? `BEBAS · JARAK ${Math.round(landmarkDistance)} SA`
              : `${beat.indexLabel} / 25 · ${beat.tag}`}
          </span>
          {!freeExplore && (
            <span className="font-mono-tabular text-[11px] text-slate-200/95 cosmic-text-halo">
              {journeyTimeLabel} · {progressPct}%
            </span>
          )}
        </div>

        {/* After Effects Kinetic Typography (integrated directly with stars & nebula) */}
        {reducedMotion ? (
          <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-bold leading-snug text-white cosmic-text-halo">
            {displayTitle}
          </h1>
        ) : !freeExplore && beat.motionStyle === 'sweep-left' ? (
          <div className="relative overflow-hidden py-0.5">
            <h1 className="ae-sweep-left font-display text-xl sm:text-3xl md:text-4xl font-bold leading-snug text-white text-balance cosmic-text-halo">
              {displayTitle}
            </h1>
            <div
              aria-hidden="true"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent}cc, transparent)`,
              }}
              className="ae-light-flare pointer-events-none absolute inset-y-0 w-24"
            />
          </div>
        ) : !freeExplore && beat.motionStyle === 'glitch-decode' ? (
          <h1 className="ae-glitch-decode font-display text-xl sm:text-3xl md:text-4xl font-bold leading-snug text-white text-balance cosmic-glitch-halo">
            {displayTitle}
          </h1>
        ) : !freeExplore && beat.motionStyle === 'horizon-expand' ? (
          <h1 className="ae-horizon-expand font-display text-2xl sm:text-4xl md:text-5xl font-bold leading-snug text-white text-balance cosmic-text-halo">
            {displayTitle}
          </h1>
        ) : (
          <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-bold leading-snug text-white text-balance flex flex-wrap gap-x-2 sm:gap-x-2.5 gap-y-0.5 cosmic-text-halo">
            {words.map((word, idx) => (
              <span
                key={`${word}-${idx}`}
                className="inline-block overflow-hidden pb-1 -mb-1"
              >
                <span
                  className="ae-word-rise inline-block"
                  style={{
                    animationDelay: `${Math.min(idx * 35, 360)}ms`,
                  }}
                >
                  {word}
                </span>
              </span>
            ))}
          </h1>
        )}

        {freeExplore && (
          <p className="mt-1.5 text-xs sm:text-sm text-slate-200/90 max-w-md cosmic-text-halo">
            Seret layar untuk putar 360° atau gunakan Maju/Mundur dan W/A/S/D menembus galaksi.
          </p>
        )}
      </div>
    </section>
  );
}
