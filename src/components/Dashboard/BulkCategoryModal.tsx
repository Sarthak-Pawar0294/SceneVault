import { X } from 'lucide-react';
import { Category } from '../../types';

interface BulkCategoryModalProps {
  onSelect: (category: Category) => void;
  onClose: () => void;
}

const categories: Category[] = ['F/M', 'F/F', 'M/F', 'M/M'];

export function BulkCategoryModal({ onSelect, onClose }: BulkCategoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Change Category</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-700 rounded transition text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                onSelect(category);
                onClose();
              }}
              className="px-4 py-3 rounded border border-zinc-700 hover:border-blue-500 hover:bg-blue-500/10 transition text-sm font-medium text-white"
            >
              {category}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition text-sm font-medium text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
