import React, { useState } from 'react';
import { X, Check, Award, AlertCircle } from 'lucide-react';
import { Category } from '../types/yahtzee';
import { evaluateMoveQuality } from '../lib/scoring';
import { sound } from '../lib/sound';
import { haptics } from '../lib/haptics';

interface ScoreModalProps {
  category: Category;
  playerIdx: number;
  playerName: string;
  currentValue: number | undefined;
  onSave: (value: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  category,
  playerIdx,
  playerName,
  currentValue,
  onSave,
  onClear,
  onClose
}) => {
  const [customVal, setCustomVal] = useState<string>(
    currentValue !== undefined ? String(currentValue) : ''
  );

  const handleChoose = (val: number) => {
    if (val === 0) {
      sound.playStrike();
      haptics.strike();
    } else {
      sound.playScoreCommit();
      haptics.scoreCommit();
    }
    onSave(val);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customVal, 10);
    if (!isNaN(num) && num >= 0) {
      handleChoose(num);
    }
  };

  // Preview move quality for customVal if entered
  const parsedNum = parseInt(customVal, 10);
  const quality = !isNaN(parsedNum) ? evaluateMoveQuality(category.id, parsedNum) : null;

  const renderQuickOptions = () => {
    if (category.type === 'upper' && category.target) {
      return (
        <div className="grid grid-cols-5 gap-2 mb-3">
          {[1, 2, 3, 4, 5].map(multiplier => {
            const val = category.target! * multiplier;
            const isPar = multiplier === 3;
            return (
              <button
                key={multiplier}
                type="button"
                onClick={() => handleChoose(val)}
                className={`py-3 rounded-xl border text-center font-mono font-bold transition-all active:scale-95 ${
                  currentValue === val
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                    : isPar
                    ? 'bg-slate-800 border-emerald-500/60 text-emerald-300 hover:bg-slate-700'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <div className="text-sm font-black">{val}</div>
                <div className="text-[10px] opacity-70 font-sans font-normal uppercase">
                  {multiplier}× {isPar ? '(Par)' : ''}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (category.type === 'fixed' && category.value !== undefined) {
      return (
        <button
          type="button"
          onClick={() => handleChoose(category.value!)}
          className="w-full py-3.5 mb-3 rounded-xl font-black uppercase tracking-wider text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          <Award className="w-5 h-5" />
          <span>Score {category.value} Points</span>
        </button>
      );
    }

    if (category.type === 'sum') {
      let options: number[] = [];
      if (category.id === '3k') options = [15, 18, 21, 24, 27, 30];
      else if (category.id === '4k') options = [16, 20, 24, 28];
      else options = [15, 18, 20, 22, 25, 28, 30];

      return (
        <div className="flex flex-wrap gap-2 mb-3">
          {options.map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handleChoose(val)}
              className="flex-1 min-w-[50px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono font-bold text-xs text-center transition-colors"
            >
              {val}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none">{category.face || '🎲'}</span>
            <div>
              <h2 className="text-base font-black uppercase italic tracking-tight text-slate-100">
                {category.name}
              </h2>
              <p className="text-xs text-slate-400">
                Entering score for <span className="text-emerald-400 font-bold">{playerName}</span>
              </p>
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

        {/* Quick Options */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
            Quick Scores
          </label>
          {renderQuickOptions()}
        </div>

        {/* Custom Score Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
            Custom Score Input
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="50"
              value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              placeholder="e.g. 25"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={customVal === '' || isNaN(parsedNum)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>

          {/* Move Quality Feedback */}
          {quality && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mt-2">
              <span className="text-slate-400">Expected Value Analysis:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold">
                  {quality.qualityPct}%
                </span>
                <span
                  className={`font-black px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
                    quality.ratingTier === 'S'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : quality.ratingTier === 'A'
                      ? 'bg-sky-500/20 text-sky-300'
                      : quality.ratingTier === 'B'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  Tier {quality.ratingTier}
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Scratch Option (Zero points) */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChoose(0)}
            className="flex-1 py-3 px-3 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Scratch Category (0 pts)</span>
          </button>

          {currentValue !== undefined && (
            <button
              type="button"
              onClick={() => {
                onClear();
                onClose();
              }}
              className="py-3 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider border border-slate-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
