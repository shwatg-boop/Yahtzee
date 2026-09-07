import React from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

interface DiePipProps {
  value: number | null;
  isKept: boolean;
  isRolling: boolean;
  disabled?: boolean;
  onClick?: () => void;
  index: number;
}

export const DiePip: React.FC<DiePipProps> = ({
  value,
  isKept,
  isRolling,
  disabled,
  onClick,
  index
}) => {
  // SVG pip positions on a 3x3 grid (coordinates 0..2)
  const renderPips = (val: number, isHeld: boolean) => {
    const dotPositions: Record<number, [number, number][]> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [2, 0], [0, 2], [2, 2]],
      5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
      6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
    };

    const dots = dotPositions[val] || [];

    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full p-2"
        fill="currentColor"
        aria-hidden="true"
      >
        {dots.map(([col, row], i) => {
          const cx = 24 + col * 26;
          const cy = 24 + row * 26;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={col === 1 && row === 1 && val === 1 && !isHeld ? 12 : 9.5}
              className={
                isHeld
                  ? 'fill-white'
                  : val === 1
                  ? 'fill-emerald-600'
                  : 'fill-slate-900'
              }
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="relative flex-1 aspect-square max-w-[80px]">
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onClick}
        animate={
          isRolling && !isKept
            ? {
                rotate: [0, 18, -18, 15, -12, 0],
                scale: [1, 1.08, 0.94, 1.05, 1],
                y: [0, -10, 2, -4, 0]
              }
            : {}
        }
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        whileTap={!disabled ? { scale: 0.94, y: 2 } : {}}
        className={`w-full h-full rounded-2xl flex flex-col items-center justify-center transition-all select-none relative group ${
          isKept
            ? 'bg-emerald-500 border-b-8 border-emerald-700 text-white shadow-xl shadow-emerald-950/40 transform -rotate-2 ring-2 ring-emerald-400/40'
            : value !== null
            ? 'bg-white border-b-8 border-slate-300 text-slate-900 shadow-xl hover:scale-[1.03]'
            : 'bg-slate-900/60 border-2 border-dashed border-slate-700/80 text-slate-600'
        } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        aria-label={`Die ${index + 1}: ${value ? value : 'Unrolled'}${isKept ? ' (Kept)' : ''}`}
      >
        {value !== null ? (
          renderPips(value, isKept)
        ) : (
          <span className="text-xl font-mono text-slate-600">·</span>
        )}

        {/* Geometric Balance Held Pill */}
        {isKept && (
          <div className="absolute -top-2.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 border border-emerald-300/40">
            <Lock className="w-2.5 h-2.5" />
            <span>HELD</span>
          </div>
        )}
      </motion.button>
    </div>
  );
};
