import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

interface CheckAllVideosModalProps {
  open: boolean;
  checking: boolean;
  current: number;
  total: number;
  error?: string | null;
  onCancel: () => void;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function CheckAllVideosModal({
  open,
  checking,
  current,
  total,
  error,
  onCancel,
  onClose,
  onOpenSettings,
}: CheckAllVideosModalProps) {
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
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const pct = useMemo(() => {
    if (!total) return 0;
    return Math.max(0, Math.min(100, (current / total) * 100));
  }, [current, total]);

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
      aria-label="Check all YouTube videos"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={checking ? undefined : onClose}
        role="button"
        tabIndex={-1}
      />

      <div
        className={[
          'relative w-full max-w-none sm:max-w-lg rounded-[16px] border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden',
          'transition-transform duration-150',
          entered ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]',
        ].join(' ')}
      >
        <div className="p-5 border-b border-[var(--bg-tertiary)] flex items-center justify-between">
          <div className="text-white font-semibold">Check All Videos</div>
          <button
            type="button"
            className="p-2 rounded-[12px] text-[var(--text-secondary)] hover:text-white hover:bg-black/20 transition"
            onClick={onClose}
            aria-label="Close"
            disabled={checking}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-[var(--text-secondary)]">
            {total > 0 ? `Checking video ${Math.min(current + (checking ? 1 : 0), total)} of ${total}...` : 'No YouTube videos found.'}
          </div>

          <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {error && (
            <div className="text-sm text-[var(--status-unavailable)] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] rounded-[12px] p-3">
              {error}
              {onOpenSettings && error.toLowerCase().includes('api key') && (
                <div className="mt-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-[12px] bg-[rgba(255,255,255,0.06)] text-white border border-[rgba(255,255,255,0.10)] hover:bg-black/20 transition"
                    onClick={onOpenSettings}
                  >
                    Go to Settings
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {checking ? (
              <button
                type="button"
                className="px-4 py-2 rounded-[12px] bg-[rgba(255,255,255,0.06)] text-white border border-[rgba(255,255,255,0.10)] hover:bg-black/20 transition"
                onClick={onCancel}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                className="px-4 py-2 rounded-[12px] bg-[rgba(255,255,255,0.06)] text-white border border-[rgba(255,255,255,0.10)] hover:bg-black/20 transition"
                onClick={onClose}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
