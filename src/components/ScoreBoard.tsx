import React from 'react';
import { 
  UPPER_CATEGORIES, 
  LOWER_CATEGORIES, 
  Category, 
  PlayerScores, 
  TOTAL_REQUIRED_CELLS 
} from '../types/yahtzee';
import { 
  getUpperSum, 
  getUpperBonus, 
  getGrandTotal, 
  getFilledCount, 
  calculateCategoryScore,
  computeWinProbabilities 
} from '../lib/scoring';
import { Lock, EyeOff, Trophy, Pencil } from 'lucide-react';

interface ScoreBoardProps {
  playerNames: string[];
  currentPlayer: number;
  scores: Record<number, PlayerScores>;
  dice: (number | null)[];
  rollCount: number;
  hideTotals: boolean;
  onCellClick: (playerIdx: number, cat: Category) => void;
  onEditName?: (playerIdx: number) => void;
  isGameOver: boolean;
  onShowTotals: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  playerNames,
  currentPlayer,
  scores,
  dice,
  rollCount,
  hideTotals,
  onCellClick,
  onEditName,
  isGameOver,
  onShowTotals
}) => {
  const numPlayers = playerNames.length;
  const playerIndices = Array.from({ length: numPlayers }, (_, i) => i);
  const diceReady = rollCount > 0 && dice.every(d => d !== null);

  const winProbs = computeWinProbabilities(playerIndices, scores);

  // Determine current leader
  let leaderIdx = -1;
  let leaderScore = -1;
  let isTie = false;

  playerIndices.forEach(p => {
    const t = getGrandTotal(scores[p] || {});
    if (t > leaderScore) {
      leaderScore = t;
      leaderIdx = p;
      isTie = false;
    } else if (t === leaderScore && leaderScore > 0) {
      isTie = true;
    }
  });

  // Geometric balance color themes for players
  const playerColors = [
    { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', activeRing: 'ring-emerald-400/50' },
    { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/40', activeRing: 'ring-sky-400/50' },
    { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', activeRing: 'ring-amber-400/50' },
    { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/40', activeRing: 'ring-rose-400/50' },
    { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/40', activeRing: 'ring-purple-400/50' },
    { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', activeRing: 'ring-cyan-400/50' }
  ];

  const renderHeaders = () => (
    <div className="flex gap-1.5 sm:gap-2 mb-2 pl-24 sm:pl-32">
      {playerIndices.map(p => {
        const isCurrentTurn = !isGameOver && p === currentPlayer;
        const color = playerColors[p % playerColors.length];
        const prob = winProbs[p] ?? 0;

        return (
          <div
            key={p}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              isCurrentTurn
                ? `bg-slate-800 border-2 ${color.border} ${color.text} shadow-md ring-1 ${color.activeRing}`
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {!isGameOver && (
              <span className="text-[10px] font-mono font-bold leading-tight text-emerald-400">
                {prob}% WIN
              </span>
            )}
            <div className="w-full flex items-center justify-center gap-1 overflow-hidden">
              <span className="text-xs font-bold uppercase tracking-wider truncate text-center">
                {playerNames[p]}
              </span>
              {onEditName && (
                <button
                  type="button"
                  onClick={() => onEditName(p)}
                  className="opacity-40 hover:opacity-100 p-0.5"
                  title="Rename player"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCell = (cat: Category, p: number) => {
    const pScores = scores[p] || {};
    const val = pScores[cat.id];
    const isCurrentTurn = !isGameOver && p === currentPlayer;
    const isFilled = val !== undefined;
    const color = playerColors[p % playerColors.length];

    // Yahtzee bonus lock condition
    const isLocked = cat.id === 'kb' && pScores['kn'] !== 50;

    let displayContent: React.ReactNode = '—';
    let cellStyle = 'bg-slate-800/40 text-slate-600 border-slate-800 hover:border-slate-700';

    if (isLocked) {
      cellStyle = 'bg-slate-950/60 text-slate-700 border-slate-900 cursor-not-allowed';
      displayContent = <Lock className="w-3.5 h-3.5 opacity-30" />;
    } else if (isFilled) {
      if (val === 0) {
        cellStyle = `${color.bg} ${color.border} text-slate-500 line-through opacity-70`;
        displayContent = '0';
      } else {
        cellStyle = `${color.bg} ${color.border} ${color.text} font-black shadow-xs`;
        displayContent = val;
      }
    } else if (isCurrentTurn && diceReady) {
      // Live preview
      const potential = calculateCategoryScore(cat, dice as number[], pScores);
      if (potential === 0) {
        cellStyle = 'border border-dashed border-slate-700 text-slate-500 hover:bg-slate-800/40';
        displayContent = <span className="line-through opacity-60">0</span>;
      } else {
        cellStyle = 'bg-emerald-500/15 border-2 border-emerald-500/80 text-white font-black italic animate-pulse shadow-md shadow-emerald-950/50';
        displayContent = `[${potential}]`;
      }
    } else if (isCurrentTurn) {
      cellStyle = 'border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-emerald-500/50';
    }

    return (
      <button
        key={p}
        type="button"
        disabled={isLocked || (!isCurrentTurn && !isFilled)}
        onClick={() => onCellClick(p, cat)}
        className={`flex-1 min-w-0 h-10 sm:h-11 rounded-lg border text-center font-mono text-sm sm:text-base flex items-center justify-center transition-all active:scale-95 ${cellStyle}`}
      >
        {displayContent}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Upper Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Upper Section (Target 63 for +35 Bonus)
          </h2>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold">
            SECTION 1/2
          </span>
        </div>

        {renderHeaders()}

        <div className="space-y-1.5">
          {UPPER_CATEGORIES.map(cat => (
            <div key={cat.id} className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-24 sm:w-32 flex items-center gap-2 shrink-0 overflow-hidden">
                <span className="text-base leading-none shrink-0">{cat.face}</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-300 truncate">
                  {cat.name}
                </span>
              </div>
              {playerIndices.map(p => renderCell(cat, p))}
            </div>
          ))}
        </div>

        {/* Upper Subtotals & Bonus */}
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
          {/* Subtotal */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-24 sm:w-32 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-400">
              Subtotal
            </div>
            {playerIndices.map(p => {
              const sum = getUpperSum(scores[p] || {});
              return (
                <div key={p} className="flex-1 text-center font-mono text-xs font-bold text-slate-300">
                  {sum}
                  <span className="text-slate-500 text-[10px]">/63</span>
                </div>
              );
            })}
          </div>

          {/* Bonus */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-24 sm:w-32 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-400">
              Bonus (+35)
            </div>
            {playerIndices.map(p => {
              const bonus = getUpperBonus(scores[p] || {});
              return (
                <div
                  key={p}
                  className={`flex-1 text-center font-mono text-xs font-bold ${
                    bonus > 0 ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                >
                  {bonus > 0 ? '+35' : '—'}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lower Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Lower Section
          </h2>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold">
            SECTION 2/2
          </span>
        </div>

        {renderHeaders()}

        <div className="space-y-1.5">
          {LOWER_CATEGORIES.map(cat => {
            const isYahtzee = cat.id === 'kn';
            return (
              <div key={cat.id} className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-24 sm:w-32 flex flex-col justify-center shrink-0 min-w-0">
                  <span className={`text-xs sm:text-sm font-semibold truncate ${
                    isYahtzee ? 'text-amber-400 font-bold uppercase italic' : 'text-slate-300'
                  }`}>
                    {cat.name}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate hidden sm:block">
                    {cat.hint}
                  </span>
                </div>
                {playerIndices.map(p => renderCell(cat, p))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Grand Totals Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        {hideTotals && !isGameOver ? (
          <div className="text-center py-4 flex flex-col items-center justify-center gap-2">
            <EyeOff className="w-6 h-6 text-amber-400 mb-0.5" />
            <div className="text-sm font-bold uppercase tracking-wider text-slate-200">Totals Hidden</div>
            <div className="text-xs text-slate-500">Pure suspense · Revealed at match conclusion</div>
            <button
              type="button"
              onClick={onShowTotals}
              className="mt-1 px-4 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold uppercase tracking-wider"
            >
              Reveal Totals
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Total Score
              </span>
              {isGameOver && !isTie && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>{playerNames[leaderIdx]} Wins!</span>
                </span>
              )}
            </div>

            {renderHeaders()}

            {/* Score totals matching Geometric Balance big font */}
            <div className="flex gap-1.5 sm:gap-2 pl-24 sm:pl-32">
              {playerIndices.map(p => {
                const total = getGrandTotal(scores[p] || {});
                const filled = getFilledCount(scores[p] || {});
                const isLeader = leaderIdx === p && leaderScore > 0;
                const color = playerColors[p % playerColors.length];

                return (
                  <div
                    key={p}
                    className={`flex-1 text-center py-3 px-1 rounded-xl bg-slate-950 border ${
                      isLeader ? 'border-emerald-500/80 ring-1 ring-emerald-400/40' : 'border-slate-800'
                    }`}
                  >
                    <div
                      className={`text-2xl sm:text-4xl font-black font-mono tracking-tighter ${
                        isLeader ? 'text-emerald-400' : color.text
                      }`}
                    >
                      {total}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider font-bold">
                      {filled}/{TOTAL_REQUIRED_CELLS} Completed
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
