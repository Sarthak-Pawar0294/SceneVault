import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';

interface RefreshResult {
  newVideos: number;
  totalVideos: number;
}

interface RefreshPlaylistModalProps {
  open: boolean;
  refreshing: boolean;
  progress: string;
  error?: string | null;
  result?: RefreshResult | null;
  onCancel: () => void;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function RefreshPlaylistModal({
  open,
  refreshing,
  progress,
  error,
  result,
  onCancel,
  onClose,
  onOpenSettings,
}: RefreshPlaylistModalProps) {
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

  const body = useMemo(() => {
    if (error) return { title: 'Refresh failed', subtitle: error };

    if (result) {
      if (result.newVideos > 0) {
        return {
          title: 'Playlist Updated!',
          subtitle: `${result.newVideos} new videos added\nTotal videos in playlist: ${result.totalVideos}`,
        };
      }
      return {
        title: 'Playlist Updated!',
        subtitle: `No new videos found. Your playlist is up to date!\nTotal videos in playlist: ${result.totalVideos}`,
      };
    }

    return {
      title: 'Refreshing Playlist',
      subtitle: progress || 'Working...',
    };
  }, [error, progress, result]);

  if (!open) return null;

  const canClose = !refreshing;

  return (
    <div
      className={[
        'fixed inset-0 z-[1100] flex items-center justify-center p-4',
        'transition-opacity duration-150',
        entered ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="Refresh playlist"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={canClose ? onClose : undefined}
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
          <div className="text-white font-semibold">{body.title}</div>
          <button
            type="button"
            className="p-2 rounded-[12px] text-[var(--text-secondary)] hover:text-white hover:bg-black/20 transition disabled:opacity-50"
            onClick={onClose}
            aria-label="Close"
            disabled={!canClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            {refreshing && <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)] mt-0.5" />}
            <div className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{body.subtitle}</div>
          </div>

          {onOpenSettings && error && String(error).toLowerCase().includes('api key') && (
            <button
              type="button"
              className="px-4 py-2 rounded-[12px] bg-[rgba(255,255,255,0.06)] text-white border border-[rgba(255,255,255,0.10)] hover:bg-black/20 transition"
              onClick={onOpenSettings}
            >
              Go to Settings
            </button>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {refreshing ? (
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
