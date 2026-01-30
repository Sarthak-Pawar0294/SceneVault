import React, { useRef, useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Scene } from '../../types';
import { parseJSONExport } from '../../utils/exportUtils';

type ImportMode = 'merge' | 'replace';

interface ImportModalProps {
  existingCount: number;
  onImport: (scenes: Scene[], mode: ImportMode) => void;
  onClose: () => void;
}

export function ImportModal({ existingCount, onImport, onClose }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedScenes, setImportedScenes] = useState<Scene[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const scenes = parseJSONExport(content);

      if (scenes.length === 0) {
        setError('No valid scenes found in the file');
        return;
      }

      setImportedScenes(scenes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setImportedScenes(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!importedScenes) return;
    onImport(importedScenes, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Import Scenes</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-700 rounded transition text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!importedScenes ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Select a previously exported JSON file to restore your scenes.
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded border-2 border-dashed border-zinc-600 hover:border-blue-500 transition text-sm font-medium text-zinc-300 hover:text-white disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Loading...' : 'Choose JSON File'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="flex items-start space-x-2 p-3 rounded bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <div className="bg-zinc-800/50 rounded p-3">
              <p className="text-xs text-zinc-400">
                <strong>Tip:</strong> You can export your scenes from the Export menu, then re-import them later to restore or transfer your collection.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start space-x-2 p-3 rounded bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-green-300">File loaded successfully</p>
                <p className="text-xs text-green-300/70">{importedScenes.length} scenes found</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Import Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 rounded border border-zinc-700 hover:border-blue-500 cursor-pointer transition" style={{ borderColor: mode === 'merge' ? '#3b82f6' : undefined, backgroundColor: mode === 'merge' ? 'rgba(59, 130, 246, 0.1)' : undefined }}>
                  <input
                    type="radio"
                    name="mode"
                    value="merge"
                    checked={mode === 'merge'}
                    onChange={(e) => setMode(e.target.value as ImportMode)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Merge with Existing</div>
                    <div className="text-xs text-zinc-400">
                      Keep your {existingCount} current scene{existingCount !== 1 ? 's' : ''}, add {importedScenes.length} new{' '}
                      scene{importedScenes.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 rounded border border-zinc-700 hover:border-blue-500 cursor-pointer transition" style={{ borderColor: mode === 'replace' ? '#3b82f6' : undefined, backgroundColor: mode === 'replace' ? 'rgba(59, 130, 246, 0.1)' : undefined }}>
                  <input
                    type="radio"
                    name="mode"
                    value="replace"
                    checked={mode === 'replace'}
                    onChange={(e) => setMode(e.target.value as ImportMode)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Replace All</div>
                    <div className="text-xs text-zinc-400">
                      Remove all {existingCount} current scene{existingCount !== 1 ? 's' : ''}, import only these{' '}
                      {importedScenes.length} scene{importedScenes.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded p-3">
              <p className="text-xs text-zinc-300">
                <strong>Preview:</strong> First 3 scenes from import
              </p>
              <div className="mt-2 space-y-1">
                {importedScenes.slice(0, 3).map((scene, idx) => (
                  <p key={idx} className="text-xs text-zinc-400">
                    • {scene.title || 'Untitled'}
                  </p>
                ))}
                {importedScenes.length > 3 && (
                  <p className="text-xs text-zinc-400">
                    • ... and {importedScenes.length - 3} more
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
              <button
                onClick={() => {
                  setImportedScenes(null);
                  setError(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition text-sm font-medium text-white"
              >
                Choose Different File
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition text-sm font-medium text-white"
              >
                Import {importedScenes.length} Scene{importedScenes.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
