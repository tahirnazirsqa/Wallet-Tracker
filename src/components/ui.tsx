import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-slate-400 dark:text-slate-500">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped >= 100 ? 'bg-red-500' : clamped >= 80 ? 'bg-amber-500' : 'bg-brand-500';
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function Modal({
  open, onClose, title, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Delete',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 font-semibold text-red-600">{title}</h3>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Toasts({ toasts }: { toasts: { id: number; message: string; kind: 'success' | 'error' }[] }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg ${
            t.kind === 'success' ? 'bg-brand-600' : 'bg-red-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
