import { useEffect } from 'react';
import { ArrowUpRight, Compass, X } from 'lucide-react';
import type { CreativeProject } from '../data/portfolioData';

interface ProjectModalProps {
  project: CreativeProject | null;
  onClose: () => void;
  onJumpToOrbit: (project: CreativeProject) => void;
  onOpenContact: (projectTitle: string) => void;
}

export function ProjectModal({
  project,
  onClose,
  onJumpToOrbit,
  onOpenContact,
}: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#02040d]/80 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-white/15 bg-[#080d1f] p-5 sm:p-8 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span>{project.category}</span>
              <span aria-hidden="true">·</span>
              <span>{project.platform}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{project.year}</span>
            </div>
            <h2
              id="project-modal-title"
              className="mt-1.5 font-display text-xl sm:text-3xl font-bold tracking-tight text-white text-balance"
            >
              {project.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={`Tutup detail ${project.title}`}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs sm:text-base leading-relaxed text-slate-300">
          {project.description}
        </p>

        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-3 border-y border-white/10 py-3 sm:py-4">
          {project.metrics.map((metric) => (
            <div key={metric.label}>
              <div className="text-[11px] sm:text-xs text-slate-400">{metric.label}</div>
              <div className="mt-0.5 font-mono-tabular text-base sm:text-xl font-semibold text-white">
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-6">
          <h3 className="text-xs sm:text-sm font-semibold text-white">
            Sorotan Arsitektur & Implementasi
          </h3>
          <ul className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2.5 text-xs sm:text-sm text-slate-300">
            {project.architectureNotes.map((note) => (
              <li key={note} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: project.accentHex }}
                />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 sm:mt-6 border-t border-white/10 pt-3 sm:pt-4">
          <div className="text-[11px] sm:text-xs text-slate-400">Teknologi Inti</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm font-medium text-slate-200">
            {project.techStack.map((tech, idx) => (
              <span key={tech} className="inline-flex items-center gap-2">
                {idx > 0 && (
                  <span aria-hidden="true" className="text-slate-500">
                    /
                  </span>
                )}
                <span>{tech}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 sm:mt-7 flex flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onJumpToOrbit(project)}
            className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Ke Orbit</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenContact(project.title)}
            className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Diskusikan</span>
            <ArrowUpRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
