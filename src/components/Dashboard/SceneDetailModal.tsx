import { useState } from 'react';
import { Scene, Category, Status } from '../../types';
import { X, ExternalLink, Edit, Trash2, CheckCircle, XCircle, Loader2, Save, Play, Youtube } from 'lucide-react';

interface SceneDetailModalProps {
  scene: Scene;
  onClose: () => void;
  onEdit: (scene: Scene) => void;
  onDelete: (id: string) => void;
  onCheckStatus?: (sceneId: string) => Promise<void>;
  onUpdate?: (scene: Scene, data: Partial<Scene>) => Promise<void>;
}

const categories: Category[] = ['F/M', 'F/F', 'M/F', 'M/M'];
const statuses: Status[] = ['available', 'unavailable'];

export function SceneDetailModal({
  scene,
  onClose,
  onDelete,
  onCheckStatus,
  onUpdate,
}: SceneDetailModalProps) {
  const normalizedStatus: Status = scene.status === 'available' ? 'available' : 'unavailable';
  const [isEditing, setIsEditing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    category: scene.category,
    timestamp: scene.timestamp || '',
    notes: scene.notes || '',
    status: normalizedStatus,
  });

  const statusIcons = {
    available: <CheckCircle className="w-5 h-5 text-green-500" />,
    unavailable: <XCircle className="w-5 h-5 text-red-500" />,
  };

  const statusColors = {
    available: 'bg-green-500/10 text-green-400 border border-green-500/20',
    unavailable: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  const handleCheckStatus = async () => {
    if (!onCheckStatus || scene.platform !== 'YouTube') return;
    setIsChecking(true);
    try {
      await onCheckStatus(scene.id);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(scene, {
        category: editData.category,
        timestamp: editData.timestamp,
        notes: editData.notes,
        status: editData.status,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleThumbnailClick = () => {
    if (scene.url) {
      window.open(scene.url, '_blank');
    }
  };

  const formattedDate = scene.created_at
    ? new Date(scene.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#27272a] border-b border-zinc-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex-1 pr-4 line-clamp-2">{scene.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded transition flex-shrink-0"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {scene.thumbnail && (
            <div className="space-y-4">
              <div
                className="relative w-full bg-zinc-800 rounded-lg overflow-hidden cursor-pointer group"
                onClick={handleThumbnailClick}
              >
                <img
                  src={scene.thumbnail}
                  alt={scene.title}
                  className="w-full h-auto object-cover max-h-96 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="bg-red-600 rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </div>

              {scene.platform === 'YouTube' && scene.url && (
                <a
                  href={scene.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition transform active:scale-95"
                >
                  <Youtube className="w-5 h-5" />
                  <span>Watch on YouTube</span>
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Platform</p>
              <p className="text-lg text-white font-semibold">{scene.platform}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Status</p>
              <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg ${statusColors[normalizedStatus]}`}>
                {isChecking ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  statusIcons[normalizedStatus]
                )}
                <span className="font-medium capitalize">{normalizedStatus}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Category</p>
              <p className="text-lg text-white font-semibold">{scene.category}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Date Added</p>
              <p className="text-lg text-white font-semibold">{formattedDate}</p>
            </div>

            {scene.timestamp && (
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Timestamp</p>
                <p className="text-lg text-white font-semibold">{scene.timestamp}</p>
              </div>
            )}

            {scene.channel_name && (
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Channel</p>
                <p className="text-lg text-white font-semibold">{scene.channel_name}</p>
              </div>
            )}
          </div>

          {scene.notes && !isEditing && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Personal Notes</p>
              <p className="text-white whitespace-pre-wrap">{scene.notes}</p>
            </div>
          )}

          {isEditing && (
            <div className="space-y-4 bg-zinc-800/30 rounded-lg p-4 border border-zinc-700">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={editData.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value as Category })}
                  className="input"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Timestamp</label>
                <input
                  type="text"
                  value={editData.timestamp}
                  onChange={(e) => setEditData({ ...editData, timestamp: e.target.value })}
                  className="input"
                  placeholder="e.g., 5:30 or 5:30-6:45"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as Status })}
                  className="input"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Personal Notes</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                  className="input resize-none"
                  placeholder="Add any notes about this scene..."
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-zinc-700">
            <div className="flex gap-2 flex-wrap">
              {scene.platform !== 'YouTube' && scene.url && (
                <a
                  href={scene.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Link</span>
                </a>
              )}

              {scene.platform === 'YouTube' && scene.video_id && onCheckStatus && (
                <button
                  onClick={handleCheckStatus}
                  disabled={isChecking}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Check Status</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(scene.id);
                    onClose();
                  }}
                  className="flex-1 btn-danger flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      category: scene.category,
                      timestamp: scene.timestamp || '',
                      notes: scene.notes || '',
                      status: normalizedStatus,
                    });
                  }}
                  className="flex-1 btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
