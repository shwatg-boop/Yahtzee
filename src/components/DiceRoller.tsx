import React, { useState } from 'react';
import { RotateCcw, Dices, Edit3, ArrowDown } from 'lucide-react';
import { DiePip } from './DiePip';
import { sound } from '../lib/sound';
import { haptics } from '../lib/haptics';

interface DiceRollerProps {
  dice: (number | null)[];
  keepers: boolean[];
  rollCount: number;
  onRoll: () => void;
  onToggleKeeper: (index: number) => void;
  onResetDice: () => void;
  onOpenPhysicalInput: () => void;
  isCurrentPlayerTurn: boolean;
  activePlayerName: string;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  dice,
  keepers,
  rollCount,
  onRoll,
  onToggleKeeper,
  onResetDice,
  onOpenPhysicalInput,
  isCurrentPlayerTurn,
  activePlayerName
}) => {
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);

  const rollsLeft = Math.max(0, 3 - rollCount);
  const isDone = rollCount >= 3;
  const hasRolled = rollCount > 0 && dice.every(d => d !== null);

  const handleRollClick = () => {
    if (!isCurrentPlayerTurn) return;

    // If 3 rolls are completed, guide the player to the scorecard without wiping dice!
    if (isDone) {
      const sc = document.getElementById('scorecard');
      if (sc) {
        sc.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setIsRollingAnimation(true);
    sound.playDiceRoll();
    haptics.roll();

    setTimeout(() => {
      onRoll();
      setIsRollingAnimation(false);
    }, 280);
  };

  const handleKeeperClick = (index: number) => {
    if (!isCurrentPlayerTurn) return;
    if (rollCount === 0 || isDone || dice[index] === null) return;
    
    const willBeKept = !keepers[index];
    sound.playDieKeep(willBeKept);
    haptics.toggleDie();
    onToggleKeeper(index);
  };

  let rollBtnLabel = 'Roll Dice';
  if (rollCount === 0) {
    rollBtnLabel = 'Roll Dice';
  } else if (isDone) {
    rollBtnLabel = 'Select Category on Scorecard';
  } else {
    rollBtnLabel = `Roll Again (${rollsLeft} left)`;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Top Bar with Mode Switcher & Active Player Status */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
            {activePlayerName}&apos;s Turn
          </span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20">
            TURN ACTIVE
          </span>
        </div>

        {/* Dual Mode Switcher from Geometric Balance Design */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <div className="py-1.5 px-3 rounded-lg bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
            <Dices className="w-3.5 h-3.5" />
            <span>DIGITAL ROLL</span>
          </div>
          <button
            type="button"
            onClick={onOpenPhysicalInput}
            className="py-1.5 px-3 rounded-lg text-slate-400 font-bold text-xs hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>PHYSICAL INPUT</span>
          </button>
        </div>
      </div>

      {/* 5 Tactile 3D Dice Strip */}
      <div className="relative z-10 flex items-center justify-center gap-2.5 sm:gap-4 my-3 sm:my-5">
        {dice.map((val, idx) => (
          <DiePip
            key={idx}
            index={idx}
            value={val}
            isKept={keepers[idx]}
            isRolling={isRollingAnimation}
            disabled={!isCurrentPlayerTurn || rollCount === 0 || isDone || val === null}
            onClick={() => handleKeeperClick(idx)}
          />
        ))}
      </div>

      {/* Helper text */}
      <div className="relative z-10 text-center mb-4">
        {hasRolled && !isDone && (
          <p className="text-xs text-slate-400 font-medium">
            Tap dice to <span className="text-emerald-400 font-bold uppercase">HOLD</span>, or tap any category on your scorecard below to bank points.
          </p>
        )}
        {isDone && (
          <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            All 3 rolls used · Tap a category on the scorecard to commit your score.
          </p>
        )}
        {rollCount === 0 && (
          <p className="text-xs text-slate-500 font-medium">
            Ready to roll? Press the button below to shake and cast the dice.
          </p>
        )}
      </div>

      {/* Action Bar matching Geometric Balance */}
      <div className="relative z-10 flex items-center gap-3">
        <button
          type="button"
          disabled={!isCurrentPlayerTurn}
          onClick={handleRollClick}
          className={`flex-1 font-black py-3.5 sm:py-4 rounded-xl shadow-2xl transition-all uppercase tracking-widest text-sm sm:text-base flex items-center justify-center gap-2 select-none ${
            !isCurrentPlayerTurn
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : isDone
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:translate-y-0.5 shadow-emerald-500/20'
              : 'bg-slate-100 text-slate-950 hover:bg-white active:translate-y-0.5 hover:shadow-white/10'
          }`}
        >
          {isDone ? <ArrowDown className="w-5 h-5 animate-bounce" /> : <Dices className="w-5 h-5" />}
          <span>{rollBtnLabel}</span>
        </button>

        {/* Rolls Left Display */}
        <div className="bg-slate-950 border border-slate-800 px-3.5 sm:px-4 py-2 rounded-xl text-center min-w-[76px] shrink-0">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rolls Left</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono italic">
            0{rollsLeft}
          </div>
        </div>

        {/* Reset button if needed */}
        {rollCount > 0 && (
          <button
            type="button"
            onClick={() => {
              sound.playDieKeep(false);
              onResetDice();
            }}
            title="Reset turn rolls"
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-95 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
