import React from 'react';
import { X, Download, Info } from 'lucide-react';
import { Scene } from '../../types';

type ExportFormat = 'json' | 'csv' | 'html';
type ExportScope = 'all' | 'filtered' | 'selected';

interface ExportModalProps {
  scenes: Scene[];
  filteredScenes: Scene[];
  selectedCount: number;
  selectedIds?: Set<string>;
  onExport: (scenes: Scene[], format: ExportFormat) => void;
  onClose: () => void;
}

export function ExportModal({
  scenes,
  filteredScenes,
  selectedCount,
  selectedIds,
  onExport,
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = React.useState<ExportFormat>('json');
  const [scope, setScope] = React.useState<ExportScope>('all');

  const getScopeCount = () => {
    switch (scope) {
      case 'all':
        return scenes.length;
      case 'filtered':
        return filteredScenes.length;
      case 'selected':
        return selectedCount;
      default:
        return 0;
    }
  };

  const getScenesByScope = (): Scene[] => {
    switch (scope) {
      case 'all':
        return scenes;
      case 'filtered':
        return filteredScenes;
      case 'selected':
        return selectedIds ? scenes.filter((s) => selectedIds.has(s.id)) : [];
      default:
        return [];
    }
  };

  const handleExport = () => {
    const scenesToExport = getScenesByScope();
    onExport(scenesToExport, format);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Export Scenes</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-700 rounded transition text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded border border-zinc-700 hover:border-blue-500 cursor-pointer transition" style={{ borderColor: format === 'json' ? '#3b82f6' : undefined, backgroundColor: format === 'json' ? 'rgba(59, 130, 246, 0.1)' : undefined }}>
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">JSON</div>
                  <div className="text-xs text-zinc-400">Complete backup - all metadata included</div>
                </div>
              </label>

              <label className="flex items-center p-3 rounded border border-zinc-700 hover:border-blue-500 cursor-pointer transition" style={{ borderColor: format === 'csv' ? '#3b82f6' : undefined, backgroundColor: format === 'csv' ? 'rgba(59, 130, 246, 0.1)' : undefined }}>
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">CSV</div>
                  <div className="text-xs text-zinc-400">Spreadsheet format - open in Excel</div>
                </div>
              </label>

              <label className="flex items-center p-3 rounded border border-zinc-700 hover:border-blue-500 cursor-pointer transition" style={{ borderColor: format === 'html' ? '#3b82f6' : undefined, backgroundColor: format === 'html' ? 'rgba(59, 130, 246, 0.1)' : undefined }}>
                <input
                  type="radio"
                  name="format"
                  value="html"
                  checked={format === 'html'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">HTML</div>
                  <div className="text-xs text-zinc-400">Shareable webpage with thumbnails</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Export Scope
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded border border-zinc-700 hover:border-blue-500 cursor-pointer transition" style={{ borderColor: scope === 'all' ? '#3b82f6' : undefined, backgroundColor: scope === 'all' ? 'rgba(59, 130, 246, 0.1)' : undefined }}>
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">All Scenes</div>
                  <div className="text-xs text-zinc-400">{scenes.length} scenes</div>
                </div>
              </label>

              <label className="flex items-center p-3 rounded border border-zinc-700 hover:border-blue-500 cursor-pointer transition" style={{ borderColor: scope === 'filtered' ? '#3b82f6' : undefined, backgroundColor: scope === 'filtered' ? 'rgba(59, 130, 246, 0.1)' : undefined }}>
                <input
                  type="radio"
                  name="scope"
                  value="filtered"
                  checked={scope === 'filtered'}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Filtered View</div>
                  <div className="text-xs text-zinc-400">{filteredScenes.length} visible scenes</div>
                </div>
              </label>

              {selectedCount > 0 && (
                <label className="flex items-center p-3 rounded border border-zinc-700 hover:border-blue-500 cursor-pointer transition" style={{ borderColor: scope === 'selected' ? '#3b82f6' : undefined, backgroundColor: scope === 'selected' ? 'rgba(59, 130, 246, 0.1)' : undefined }}>
                  <input
                    type="radio"
                    name="scope"
                    value="selected"
                    checked={scope === 'selected'}
                    onChange={(e) => setScope(e.target.value as ExportScope)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Selected Scenes</div>
                    <div className="text-xs text-zinc-400">{selectedCount} selected scenes</div>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded p-3 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300">
              {format === 'json' && 'JSON includes all metadata and can be imported back to restore your data.'}
              {format === 'csv' && 'CSV is compatible with Excel and Google Sheets. Some formatting may be lost.'}
              {format === 'html' && 'HTML creates a beautiful shareable page. Thumbnails are linked from their source.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition text-sm font-medium text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition text-sm font-medium text-white"
            >
              <Download className="w-4 h-4" />
              <span>Export {getScopeCount()} Scene{getScopeCount() !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
