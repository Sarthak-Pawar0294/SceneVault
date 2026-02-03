import { ReactNode, useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

interface PlatformHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  tertiaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  additionalActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    disabled?: boolean;
  }>;
  menuActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    disabled?: boolean;
  }>;
}

export function PlatformHeader({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  additionalActions,
  menuActions,
}: PlatformHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const root = menuRef.current;
      if (!root) return;
      if (root.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen]);

  return (
    <div className="relative overflow-hidden rounded-[16px] border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-red-subtle)] to-transparent opacity-60" />
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] flex items-center justify-center">
              <span className="text-[var(--accent-red)]">{icon}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
              {description && <div className="text-sm text-[var(--text-secondary)] mt-2">{description}</div>}
            </div>
          </div>

          {(primaryAction || secondaryAction || tertiaryAction || (additionalActions && additionalActions.length > 0) || (menuActions && menuActions.length > 0)) && (
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 w-full md:w-auto">
              {primaryAction && (
                <button
                  type="button"
                  className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.icon}
                  <span>{primaryAction.label}</span>
                </button>
              )}

              {secondaryAction && (
                <button
                  type="button"
                  className="w-full md:w-auto px-4 py-2 rounded-[12px] bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] hover:bg-black/20 transition flex items-center justify-center gap-2"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.icon}
                  <span>{secondaryAction.label}</span>
                </button>
              )}

              {(additionalActions || []).map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="w-full md:w-auto px-4 py-2 rounded-[12px] bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] hover:bg-black/20 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:bg-[var(--bg-tertiary)]"
                  onClick={action.onClick}
                  disabled={!!action.disabled}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}

              {(menuActions && menuActions.length > 0) && (
                <div className="relative w-full md:w-auto" ref={menuRef}>
                  <button
                    type="button"
                    className="w-full md:w-auto px-3 py-2 rounded-[12px] bg-transparent text-[var(--text-secondary)] border border-[var(--bg-tertiary)] hover:text-white hover:bg-black/20 transition flex items-center justify-center gap-2"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Open menu"
                    title="More"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-full md:w-56 rounded-[12px] overflow-hidden bg-[var(--bg-secondary)] shadow-[0_18px_40px_rgba(0,0,0,0.55)] border border-[var(--bg-tertiary)] z-50">
                      {menuActions.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)]"
                          onClick={() => {
                            if (item.disabled) return;
                            item.onClick();
                            setMenuOpen(false);
                          }}
                          disabled={!!item.disabled}
                        >
                          <span className="text-[var(--text-secondary)]">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tertiaryAction && (
                <button
                  type="button"
                  className="w-full md:w-auto px-3 py-2 rounded-[12px] bg-transparent text-[var(--text-secondary)] border border-[var(--bg-tertiary)] hover:text-white hover:bg-black/20 transition flex items-center justify-center gap-2"
                  onClick={tertiaryAction.onClick}
                  aria-label={tertiaryAction.label}
                  title={tertiaryAction.label}
                >
                  {tertiaryAction.icon}
                  <span className="hidden md:inline">{tertiaryAction.label}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
