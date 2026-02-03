import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Category, Platform } from '../../types';

export type AdvancedSortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export type FilterChipId =
  | 'all'
  | 'F/M'
  | 'F/F'
  | 'M/F'
  | 'M/M'
  | 'available'
  | 'unavailable';

export type DateRangeFilter = '7d' | '30d' | '3m' | 'all';

export interface AdvancedFilters {
  categories: Category[];
  statuses: Array<'available' | 'unavailable'>;
  platforms: Platform[];
  dateRange: DateRangeFilter;
}

export const defaultAdvancedFilters: AdvancedFilters = {
  categories: [],
  statuses: [],
  platforms: [],
  dateRange: 'all',
};

interface Chip {
  id: FilterChipId;
  label: string;
}

const defaultChips: Chip[] = [
  { id: 'all', label: 'All' },
  { id: 'F/M', label: 'F/M' },
  { id: 'F/F', label: 'F/F' },
  { id: 'M/F', label: 'M/F' },
  { id: 'M/M', label: 'M/M' },
  { id: 'available', label: 'Available' },
  { id: 'unavailable', label: 'Unavailable' },
];

interface AdvancedSearchBarProps {
  query: string;
  onQueryChange: (next: string) => void;
  sortBy: AdvancedSortOption;
  onSortByChange: (next: AdvancedSortOption) => void;
  activeChip: FilterChipId;
  onChipChange: (next: FilterChipId) => void;
  filters?: AdvancedFilters;
  onApplyFilters?: (next: AdvancedFilters) => void;
  onClearAllFilters?: () => void;
  chips?: Chip[];
  enablePlatformFilter?: boolean;
}

function chipClass(active: boolean) {
  return [
    'px-3 py-2 rounded-full text-sm border transition',
    active
      ? 'bg-[var(--accent-red-subtle)] text-white border-[rgba(255,0,0,0.25)]'
      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--bg-tertiary)] hover:text-white hover:bg-black/20',
  ].join(' ');
}

export function AdvancedSearchBar({
  query,
  onQueryChange,
  sortBy,
  onSortByChange,
  activeChip,
  onChipChange,
  filters = defaultAdvancedFilters,
  onApplyFilters,
  onClearAllFilters,
  chips = defaultChips,
  enablePlatformFilter = false,
}: AdvancedSearchBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<AdvancedFilters>(filters);

  useEffect(() => {
    if (!filtersOpen) return;
    setDraft(filters);
  }, [filters, filtersOpen]);

  const categoryOptions = useMemo(() => ['F/M', 'F/F', 'M/F', 'M/M'] as Category[], []);
  const platformOptions = useMemo(
    () => ['YouTube', 'JioHotstar', 'Zee5', 'SonyLIV', 'Other'] as Platform[],
    []
  );

  const toggleInList = <T,>(list: T[], value: T) => {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  };

  const sectionLabelClass = 'text-xs uppercase tracking-wide text-[var(--text-secondary)]';
  const optionBtnClass = (active: boolean) =>
    [
      'px-3 py-2 rounded-[12px] border text-sm transition',
      active
        ? 'bg-[var(--accent-red-subtle)] text-white border-[rgba(255,0,0,0.25)]'
        : 'bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)] border-[rgba(255,255,255,0.08)] hover:text-white hover:bg-black/20',
    ].join(' ');

  return (
    <div className="card p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search scenes, titles, channels..."
              className="w-full pl-12 pr-4 py-3 rounded-[14px] bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as AdvancedSortOption)}
            className="px-4 py-3 rounded-[14px] bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>

          <div className="relative">
            <button
              type="button"
              className="px-4 py-3 rounded-[14px] bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] text-white hover:bg-black/20 transition flex items-center gap-2"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {filtersOpen && (
              <>
                <div
                  className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[999]"
                  onClick={() => setFiltersOpen(false)}
                  role="button"
                  tabIndex={-1}
                  aria-label="Close filters"
                />

                <div
                  className="fixed top-0 right-0 h-screen w-[380px] max-w-[100vw] z-[1000] border-l border-[rgba(255,255,255,0.10)] shadow-[-18px_0_50px_rgba(0,0,0,0.65)] overflow-hidden"
                  style={{ backgroundColor: '#1e1e1e' }}
                  role="dialog"
                  aria-label="Filters"
                >
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                      <div className="text-white font-semibold">Filters</div>
                      <button
                        type="button"
                        className="p-2 rounded-[12px] text-[var(--text-secondary)] hover:text-white hover:bg-black/20 transition"
                        onClick={() => setFiltersOpen(false)}
                        aria-label="Close filters"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-4 space-y-5 flex-1 overflow-y-auto">
                      <div>
                        <div className={sectionLabelClass}>Category</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {categoryOptions.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={optionBtnClass(draft.categories.includes(c))}
                              onClick={() => setDraft((prev) => ({ ...prev, categories: toggleInList(prev.categories, c) }))}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className={sectionLabelClass}>Status</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(
                            [
                              { id: 'available' as const, label: 'Available' },
                              { id: 'unavailable' as const, label: 'Unavailable' },
                            ]
                          ).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className={optionBtnClass(draft.statuses.includes(s.id))}
                              onClick={() => setDraft((prev) => ({ ...prev, statuses: toggleInList(prev.statuses, s.id) }))}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {enablePlatformFilter && (
                        <div>
                          <div className={sectionLabelClass}>Platform</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {platformOptions.map((p) => (
                              <button
                                key={p}
                                type="button"
                                className={optionBtnClass(draft.platforms.includes(p))}
                                onClick={() => setDraft((prev) => ({ ...prev, platforms: toggleInList(prev.platforms, p) }))}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className={sectionLabelClass}>Date Range</div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {(
                            [
                              { id: '7d' as const, label: 'Last 7 days' },
                              { id: '30d' as const, label: 'Last 30 days' },
                              { id: '3m' as const, label: 'Last 3 months' },
                              { id: 'all' as const, label: 'All time' },
                            ]
                          ).map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              className={optionBtnClass(draft.dateRange === r.id)}
                              onClick={() => setDraft((prev) => ({ ...prev, dateRange: r.id }))}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full px-4 py-3 rounded-[14px] bg-transparent text-[var(--text-secondary)] border border-[rgba(255,255,255,0.10)] hover:text-white hover:bg-black/20 transition"
                        onClick={() => {
                          setDraft(defaultAdvancedFilters);
                          onClearAllFilters?.();
                        }}
                      >
                        Clear all filters
                      </button>
                    </div>

                    <div className="p-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-end gap-3">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-[12px] bg-[rgba(255,255,255,0.06)] text-white border border-[rgba(255,255,255,0.10)] hover:bg-black/20 transition"
                        onClick={() => {
                          setDraft(filters);
                          setFiltersOpen(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          onApplyFilters?.(draft);
                          setFiltersOpen(false);
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className={chipClass(activeChip === c.id)}
            onClick={() => onChipChange(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
