import { useEffect, useState, type FormEvent } from 'react';
import { Check, Copy, Send, X } from 'lucide-react';
import { DEVELOPER_PROFILE } from '../data/portfolioData';

interface ContactModalProps {
  open: boolean;
  initialSubject?: string;
  onClose: () => void;
  onSubmitted: (senderName: string, topic: string) => void;
}

export function ContactModal({
  open,
  initialSubject = '',
  onClose,
  onSubmitted,
}: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(initialSubject || 'Kolaborasi Game 3D / APK Android');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialSubject) {
      setTopic(`Diskusi Terkait: ${initialSubject}`);
    }
  }, [initialSubject]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(DEVELOPER_PROFILE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMsg = message.trim();

    if (!cleanName || !cleanEmail || !cleanEmail.includes('@') || cleanMsg.length < 6) {
      setError('Mohon lengkapi nama, email yang valid, dan pesan singkat Anda.');
      return;
    }

    setError(null);
    setSent(true);
    onSubmitted(cleanName, topic.trim() || 'Kolaborasi');
  };

  const handleResetAndClose = () => {
    setSent(false);
    setName('');
    setEmail('');
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#02040d]/80 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-white/15 bg-[#080d1f] p-6 sm:p-8 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">
              {DEVELOPER_PROFILE.name} · {DEVELOPER_PROFILE.role}
            </div>
            <h2
              id="contact-modal-title"
              className="mt-1.5 font-display text-2xl font-bold text-white"
            >
              Hubungi & Kolaborasi
            </h2>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Tutup formulir kontak"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d142b] px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-400">Email Langsung</div>
            <div className="truncate text-sm font-medium text-slate-100">
              {DEVELOPER_PROFILE.email}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>

        {sent ? (
          <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-950/30 p-5 text-center">
            <h3 className="font-display text-lg font-bold text-white">
              Pesan Terkirim ke Rasya Ardiansyah
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Terima kasih, {name}. Rincian diskusi mengenai "{topic}" telah dicatat ke log aktivitas sesi ini.
            </p>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mt-5 min-h-[44px] rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              Kembali ke Galaksi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label htmlFor="contact-name" className="block text-xs font-medium text-slate-300">
                Nama Anda
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misalnya: Budi Santoso"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-[#0d142b] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-medium text-slate-300">
                Alamat Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-[#0d142b] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-topic" className="block text-xs font-medium text-slate-300">
                Topik Proyek
              </label>
              <input
                id="contact-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-[#0d142b] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-medium text-slate-300">
                Pesan Singkat
              </label>
              <textarea
                id="contact-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ceritakan konsep game, aplikasi Android, atau target waktu Anda..."
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0d142b] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-rose-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pesan Kolaborasi</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
