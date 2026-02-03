import { useEffect, useState } from 'react';

interface SignOutModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SignOutModal({ open, onCancel, onConfirm }: SignOutModalProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const t = window.setTimeout(() => setEntered(true), 10);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-[1100] flex items-center justify-center p-4',
        'transition-opacity duration-150',
        entered ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="Sign out confirmation"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
        role="button"
        tabIndex={-1}
      />

      <div
        className={[
          'relative w-full max-w-md rounded-[16px] border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] shadow-[0_20px_60px_rgba(0,0,0,0.55)]',
          'transition-transform duration-150',
          entered ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]',
        ].join(' ')}
      >
        <div className="p-6">
          <div className="text-xl font-semibold text-white">Sign out of SceneVault?</div>
          <div className="mt-2 text-sm text-[var(--text-secondary)]">
            You&apos;ll need to sign in again to access your collection
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-[12px] bg-[rgba(255,255,255,0.06)] text-white border border-[rgba(255,255,255,0.10)] hover:bg-black/20 transition"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-[12px] bg-[rgba(239,68,68,0.18)] text-white border border-[rgba(239,68,68,0.35)] hover:bg-[rgba(239,68,68,0.28)] transition"
              onClick={onConfirm}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
