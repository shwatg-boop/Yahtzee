import React, { useState } from 'react';
import { Dices, Users, ClipboardList, Play } from 'lucide-react';
import { GameMode, DEFAULT_PLAYER_NAMES } from '../types/yahtzee';

interface SetupModalProps {
  initialMode: GameMode;
  initialPlayerCount: number;
  initialNames: string[];
  onStartGame: (mode: GameMode, playerCount: number, names: string[]) => void;
  onClose?: () => void;
  isOverlay?: boolean;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  initialMode,
  initialPlayerCount,
  initialNames,
  onStartGame,
  onClose,
  isOverlay = false
}) => {
  const [mode, setMode] = useState<GameMode>(initialMode || 'full');
  const [playerCount, setPlayerCount] = useState<number>(initialPlayerCount || 2);
  const [names, setNames] = useState<string[]>(() => {
    const list = [...initialNames];
    while (list.length < 6) {
      list.push(DEFAULT_PLAYER_NAMES[list.length]);
    }
    return list;
  });

  const handleNameChange = (idx: number, val: string) => {
    const next = [...names];
    next[idx] = val;
    setNames(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNames = names.slice(0, playerCount).map((n, i) => n.trim() || DEFAULT_PLAYER_NAMES[i]);
    onStartGame(mode, playerCount, finalNames);
  };

  const playerColorBorders = [
    'border-emerald-500/50 focus:border-emerald-400',
    'border-sky-500/50 focus:border-sky-400',
    'border-amber-500/50 focus:border-amber-400',
    'border-rose-500/50 focus:border-rose-400',
    'border-purple-500/50 focus:border-purple-400',
    'border-cyan-500/50 focus:border-cyan-400',
  ];

  const content = (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 mx-auto bg-emerald-500 rounded-xl flex items-center justify-center rotate-12 shadow-lg shadow-emerald-500/20 mb-2">
          <div className="grid grid-cols-2 gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tight">
          Yahtzee <span className="text-emerald-400">Game Setup</span>
        </h1>
        <p className="text-xs text-slate-400">Choose game mode, player count & custom roster</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Game Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('full')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                mode === 'full'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black uppercase text-xs">
                <Dices className="w-4 h-4 text-emerald-400" />
                <span>Digital Roll</span>
              </div>
              <p className="text-[10px] opacity-80 mt-1">
                With interactive digital dice roller, keeper locks & sound effects.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('companion')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                mode === 'companion'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black uppercase text-xs">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                <span>Companion</span>
              </div>
              <p className="text-[10px] opacity-80 mt-1">
                Scorecard only. Roll your physical dice on the table.
              </p>
            </button>
          </div>
        </div>

        {/* Player Count */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Number of Players
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setPlayerCount(num)}
                className={`py-2.5 rounded-xl font-mono font-black text-sm border transition-all ${
                  playerCount === num
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Player Names */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Player Names
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {Array.from({ length: playerCount }, (_, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    idx === 0
                      ? 'bg-emerald-400'
                      : idx === 1
                      ? 'bg-sky-400'
                      : idx === 2
                      ? 'bg-amber-400'
                      : idx === 3
                      ? 'bg-rose-400'
                      : idx === 4
                      ? 'bg-purple-400'
                      : 'bg-cyan-400'
                  }`}
                />
                <input
                  type="text"
                  maxLength={14}
                  value={names[idx] || ''}
                  onChange={e => handleNameChange(idx, e.target.value)}
                  placeholder={`Player ${idx + 1}`}
                  className={`flex-1 px-3 py-2 rounded-xl bg-slate-950 border text-xs text-slate-100 focus:outline-none ${playerColorBorders[idx % playerColorBorders.length]}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-2">
          {onClose && isOverlay && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Game</span>
          </button>
        </div>
      </form>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-dot-matrix">
      {content}
    </div>
  );
};
