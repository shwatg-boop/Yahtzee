import React from 'react';
import { BarChart2, Trophy, X, Trash2, Calendar } from 'lucide-react';
import { HistoricalGame } from '../types/yahtzee';

interface StatsModalProps {
  history: HistoricalGame[];
  playerNames: string[];
  onClearHistory: () => void;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  history,
  playerNames,
  onClearHistory,
  onClose
}) => {
  // Aggregate stats per player name
  const statsMap: Record<string, { games: number; wins: number; highest: number; totalScore: number }> = {};

  history.forEach(game => {
    game.players.forEach(p => {
      const name = p.name.trim() || 'Player';
      if (!statsMap[name]) {
        statsMap[name] = { games: 0, wins: 0, highest: 0, totalScore: 0 };
      }
      statsMap[name].games += 1;
      statsMap[name].totalScore += p.score;
      if (p.score > statsMap[name].highest) {
        statsMap[name].highest = p.score;
      }
      if (p.isWinner) {
        statsMap[name].wins += 1;
      }
    });
  });

  const playerStatsList = playerNames.map(name => {
    const s = statsMap[name] || { games: 0, wins: 0, highest: 0, totalScore: 0 };
    const winRate = s.games > 0 ? Math.round((s.wins / s.games) * 100) : 0;
    const avgScore = s.games > 0 ? Math.round(s.totalScore / s.games) : 0;
    return { name, ...s, winRate, avgScore };
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase italic tracking-tight">Performance & Records</h2>
              <p className="text-xs text-slate-400">{history.length} completed matches recorded</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Win Rates Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Player Win Ratios
          </h3>

          <div className="space-y-3">
            {playerStatsList.map((stat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 uppercase tracking-wider">{stat.name}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span>{stat.wins}W - {stat.games - stat.wins}L</span>
                    <span className="font-bold text-emerald-400">{stat.winRate}%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all shadow-sm"
                    style={{ width: `${stat.winRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>High: {stat.highest} pts</span>
                  <span>Avg: {stat.avgScore} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match History */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Recent Match Archives
          </h3>

          {history.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs italic bg-slate-950 border border-slate-800 rounded-2xl">
              No completed matches yet. Finish a match to record telemetry!
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {history.map(game => (
                <div
                  key={game.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                      <Calendar className="w-3 h-3" />
                      {formatDate(game.date)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs uppercase">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      {game.isTie ? 'Tie Game' : `${game.winnerName} (${game.winningScore} pts)`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {game.players.map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold ${
                          p.isWinner
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {p.name}: {p.score}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
