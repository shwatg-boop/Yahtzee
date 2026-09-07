import React, { useState } from 'react';
import { X, Check, Dices } from 'lucide-react';
import { sound } from '../lib/sound';
import { haptics } from '../lib/haptics';

interface PhysicalDiceInputModalProps {
  initialDice: (number | null)[];
  onApply: (dice: number[]) => void;
  onClose: () => void;
  playerName: string;
}

export const PhysicalDiceInputModal: React.FC<PhysicalDiceInputModalProps> = ({
  initialDice,
  onApply,
  onClose,
  playerName
}) => {
  // 5 dice values (defaults to existing dice or all 1s)
  const [values, setValues] = useState<number[]>(() => {
    return initialDice.map(d => (d !== null && d >= 1 && d <= 6 ? d : 1));
  });

  const [activeDieIndex, setActiveDieIndex] = useState<number>(0);

  const handleSelectValue = (face: number) => {
    sound.playDieKeep(true);
    haptics.toggleDie();

    const next = [...values];
    next[activeDieIndex] = face;
    setValues(next);

    // Auto-advance to next die for rapid input!
    if (activeDieIndex < 4) {
      setActiveDieIndex(activeDieIndex + 1);
    }
  };

  const handleApply = () => {
    sound.playScoreCommit();
    haptics.scoreCommit();
    onApply(values);
    onClose();
  };

  const dicePips: Record<number, string> = {
    1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase italic tracking-tight">Physical Dice Input</h2>
              <p className="text-xs text-slate-400">{playerName}&apos;s Physical Roll</p>
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

        <p className="text-xs text-slate-400 font-medium">
          Roll your physical dice on the table, then tap each slot below to assign its number (1 to 6):
        </p>

        {/* 5 Slots */}
        <div className="grid grid-cols-5 gap-2">
          {values.map((val, idx) => {
            const isSelected = activeDieIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveDieIndex(idx);
                  haptics.toggleDie();
                }}
                className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-950/40'
                    : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Die {idx + 1}</span>
                <span className="text-2xl font-mono leading-none">{dicePips[val]}</span>
                <span className="text-sm font-black font-mono mt-1 text-emerald-400">{val}</span>
              </button>
            );
          })}
        </div>

        {/* 1-6 Keypad */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Select value for <span className="text-emerald-400">Die {activeDieIndex + 1}</span>:
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleSelectValue(num)}
                className={`py-3 rounded-xl border font-mono font-black text-base flex flex-col items-center justify-center transition-all active:scale-95 ${
                  values[activeDieIndex] === num
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-white text-slate-950 border-b-4 border-slate-300 hover:scale-105'
                }`}
              >
                <span className="text-lg leading-none">{dicePips[num]}</span>
                <span className="text-xs mt-0.5">{num}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply Dice Roll</span>
          </button>
        </div>
      </div>
    </div>
  );
};
