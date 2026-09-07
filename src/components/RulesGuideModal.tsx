import React from 'react';
import { BookOpen, X, Award, Target, Dices, Flame } from 'lucide-react';

interface RulesGuideModalProps {
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase italic tracking-tight">Rules & Strategic Logic</h2>
              <p className="text-xs text-slate-400">Scoring breakdown, bonus thresholds & move quality metrics</p>
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

        <div className="space-y-4 text-xs text-slate-300">
          {/* Objective */}
          <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-1.5">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Objective
            </h3>
            <p className="leading-relaxed text-slate-300">
              Score the highest total points by rolling 5 dice to complete 14 categories.
              In each turn, you get up to <strong>3 rolls</strong>. After any roll, you can hold (keep) dice and reroll the rest.
            </p>
          </div>

          {/* The Upper Section 63 Bonus */}
          <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> The +35 Upper Section Bonus
            </h3>
            <p className="leading-relaxed text-slate-300">
              If the sum of your Ones through Sixes reaches at least <strong>63 points</strong>, you receive an extra <strong>+35 bonus points</strong>!
            </p>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-emerald-400 font-bold uppercase">The Rule of 3s (Par Target):</div>
              <div>3×1 (3) + 3×2 (6) + 3×3 (9) + 3×4 (12) + 3×5 (15) + 3×6 (18) = <strong className="text-emerald-300">63 pts</strong></div>
              <div className="text-[10px] text-slate-400 font-sans mt-1">
                Tip: If you score 4 Fives (20 pts), you are +5 ahead of par and can afford a deficit in Ones or Twos!
              </div>
            </div>
          </div>

          {/* Lower Combinations */}
          <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Dices className="w-3.5 h-3.5" /> Lower Section Standard Combinations
            </h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-sans">Full House:</span>
                <span className="font-bold text-emerald-400">25 pts</span> (3 of a kind + pair)
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-sans">Small Straight:</span>
                <span className="font-bold text-emerald-400">30 pts</span> (4 sequential)
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-sans">Large Straight:</span>
                <span className="font-bold text-emerald-400">40 pts</span> (5 sequential)
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-sans">Yahtzee (5 of a kind):</span>
                <span className="font-bold text-emerald-400">50 pts</span> (+100 for each bonus!)
              </div>
            </div>
          </div>

          {/* Move Quality Metric */}
          <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-1.5">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-emerald-400" /> Move Quality Analytics Metric
            </h3>
            <p className="leading-relaxed text-slate-300">
              Each turn is evaluated against the mathematical expected value (EV) of that category. Scoring at or above EV yields high Tier ratings (S and A, 85%+), while suboptimal sacrifices or zero-scratches reflect lower tactical quality. Track your average quality across the match in the Graphs tab!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold uppercase tracking-wider text-xs transition-colors"
        >
          Got It, Return to Board
        </button>
      </div>
    </div>
  );
};
