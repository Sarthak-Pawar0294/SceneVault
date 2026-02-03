import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Film, LogOut, Download, Upload, Settings } from 'lucide-react';
import { SignOutModal } from './SignOutModal';

interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
  onSettings?: () => void;
}

export function Header({ onExport, onImport, onSettings }: HeaderProps) {
  const { signOut, user } = useAuth();
  const [showSignOut, setShowSignOut] = useState(false);

  return (
    <>
      <SignOutModal
        open={showSignOut}
        onCancel={() => setShowSignOut(false)}
        onConfirm={() => {
          setShowSignOut(false);
          void signOut();
        }}
      />

      <header className="bg-[#27272a] border-b border-zinc-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Film className="w-6 h-6 text-red-500" />
              <div>
                <h1 className="text-xl font-bold text-white">SceneVault</h1>
                <p className="text-xs text-zinc-400">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {onSettings && (
                <button
                  onClick={onSettings}
                  className="btn-tertiary flex items-center space-x-2"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              )}
              <button
                onClick={onImport}
                className="btn-tertiary flex items-center space-x-2"
                title="Import scenes"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={onExport}
                className="btn-tertiary flex items-center space-x-2"
                title="Export scenes"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => setShowSignOut(true)}
                className="btn-tertiary flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
