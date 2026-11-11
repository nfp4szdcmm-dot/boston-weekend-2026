import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Sheet({ open, onClose, title, children, full = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; full?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-navy-900/45 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div className={`relative w-full max-w-[560px] bg-cream rounded-t-[28px] shadow-float animate-up flex flex-col ${full ? 'h-[94dvh]' : 'max-h-[90dvh]'}`}>
        <div className="flex items-center gap-2 px-5 pt-3 pb-2">
          <div className="absolute left-1/2 -translate-x-1/2 top-2 h-1.5 w-10 rounded-full bg-navy/15" />
          <div className="flex-1 pt-3 font-display text-xl text-navy">{title}</div>
          <button onClick={onClose} aria-label="Close" className="mt-2 h-10 w-10 grid place-items-center rounded-full bg-white shadow-card text-navy">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">{children}</div>
      </div>
    </div>
  );
}

export function Chip({ active, onClick, children, className = '' }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 h-10 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-navy text-white shadow-card' : 'bg-white text-navy border border-navy/10'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'red' | 'amber' | 'blue' | 'navy' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-sand text-ink/80',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
    amber: 'bg-amber-100 text-amber-900',
    blue: 'bg-sky-100 text-sky-900',
    navy: 'bg-navy text-white',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-3xl shadow-card ${className}`}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mt-7 mb-3 px-1">
      <h2 className="font-display text-[22px] text-navy leading-none">{children}</h2>
      {right}
    </div>
  );
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-ink/50 leading-snug mt-1">{children}</p>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink/60 py-6 justify-center" role="status">
      <span className="h-4 w-4 rounded-full border-2 border-navy/20 border-t-navy animate-spin" />
      {label ?? 'Loading…'}
    </div>
  );
}
