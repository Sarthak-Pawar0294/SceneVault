import { Stats } from '../../types';
import { Zap, TrendingUp, AlertCircle, Tv, Film } from 'lucide-react';

interface StatsPanelProps {
  stats: Stats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card-glow p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-white text-base font-bold">Total Scenes</p>
              <p className="text-4xl font-bold text-white mt-3">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/20 flex-shrink-0">
              <Zap className="w-6 h-6 text-[var(--accent-red)]" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-white text-base font-bold">Available</p>
              <p className="text-4xl font-bold text-[var(--status-available)] mt-3">{stats.available}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-[var(--status-available)]" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-white text-base font-bold">Unavailable</p>
              <p className="text-4xl font-bold text-[var(--status-unavailable)] mt-3">{stats.unavailable}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/20 flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-[var(--status-unavailable)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-5">
            <Tv className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="font-semibold text-white">By Platform</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(stats.byPlatform).map(([platform, count]) => {
              const total = stats.total || 1;
              const percentage = (count / total) * 100;
              return (
                <div
                  key={platform}
                  className="group p-4 rounded-lg hover:bg-[var(--bg-tertiary)] transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-white transition">
                      {platform}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${percentage}%`, background: 'var(--accent-red)' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-5">
            <Film className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="font-semibold text-white">By Category</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div
                key={category}
                className="group p-4 rounded-lg hover:bg-[var(--bg-tertiary)] transition cursor-pointer flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-white transition">
                  {category}
                </span>
                <span className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition" style={{ background: 'var(--accent-red-subtle)', color: 'var(--accent-red)' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
