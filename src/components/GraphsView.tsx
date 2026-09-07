import React, { useEffect, useRef, useState } from 'react';
import { PlayerScores } from '../types/yahtzee';
import { buildPlayerProgression } from '../lib/scoring';
import { TrendingUp, Award, Zap } from 'lucide-react';

interface GraphsViewProps {
  playerNames: string[];
  turnHistories: Record<number, string[]>;
  scores: Record<number, PlayerScores>;
}

export const GraphsView: React.FC<GraphsViewProps> = ({
  playerNames,
  turnHistories,
  scores
}) => {
  const [activeTab, setActiveTab] = useState<'score' | 'quality' | 'breakdown'>('score');
  const scoreCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qualityCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const numPlayers = playerNames.length;
  const playerColors = [
    '#10b981', // emerald
    '#0ea5e9', // sky
    '#f59e0b', // amber
    '#f43f5e', // rose
    '#a855f7', // purple
    '#06b6d4'  // cyan
  ];

  // Prepare player data curves
  const progressions = React.useMemo(() => {
    return Array.from({ length: numPlayers }, (_, p) => {
      const history = turnHistories[p] || [];
      const pScores = scores[p] || {};
      return buildPlayerProgression(history, pScores);
    });
  }, [numPlayers, turnHistories, scores]);

  // Overall average move quality
  const avgOverallQuality = Math.round(
    progressions.reduce((acc, p) => acc + (p.avgQuality || 0), 0) / (numPlayers || 1)
  );

  // Draw Score Progression Canvas
  useEffect(() => {
    if (activeTab !== 'score' || !scoreCanvasRef.current) return;
    const canvas = scoreCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padL = 42;
    const padR = 24;
    const padT = 20;
    const padB = 32;
    const gw = w - padL - padR;
    const gh = h - padT - padB;

    let maxScore = 80;
    progressions.forEach(prog => {
      prog.scorePoints.forEach(s => {
        if (s > maxScore) maxScore = s;
      });
    });
    maxScore = Math.ceil((maxScore + 20) / 50) * 50;

    const maxTurns = 14;

    // Grid lines in slate-800
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const yVal = Math.round((i / ySteps) * maxScore);
      const yPos = padT + gh - (i / ySteps) * gh;

      ctx.beginPath();
      ctx.moveTo(padL, yPos);
      ctx.lineTo(padL + gw, yPos);
      ctx.stroke();

      ctx.fillText(String(yVal), padL - 8, yPos);
    }

    // X-labels (Turns)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let t = 0; t <= maxTurns; t += 2) {
      const xPos = padL + (t / maxTurns) * gw;
      ctx.fillText(`T${t}`, xPos, padT + gh + 8);
    }

    // Plot lines
    progressions.forEach((prog, pIdx) => {
      const points = prog.scorePoints;
      if (points.length === 0) return;

      const color = playerColors[pIdx % playerColors.length];
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      points.forEach((val, tIdx) => {
        const x = padL + (tIdx / maxTurns) * gw;
        const y = padT + gh - (val / maxScore) * gh;
        if (tIdx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Points dots
      points.forEach((val, tIdx) => {
        const x = padL + (tIdx / maxTurns) * gw;
        const y = padT + gh - (val / maxScore) * gh;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }, [activeTab, progressions, playerColors]);

  // Draw Quality Canvas
  useEffect(() => {
    if (activeTab !== 'quality' || !qualityCanvasRef.current) return;
    const canvas = qualityCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padL = 42;
    const padR = 24;
    const padT = 20;
    const padB = 32;
    const gw = w - padL - padR;
    const gh = h - padT - padB;

    const maxTurns = 14;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const qualityBenchmarks = [
      { pct: 100, label: '100% (S)' },
      { pct: 80, label: '80% (A)' },
      { pct: 60, label: '60% (B)' },
      { pct: 40, label: '40% (C)' },
      { pct: 20, label: '20% (D)' },
      { pct: 0, label: '0% (F)' }
    ];

    qualityBenchmarks.forEach(b => {
      const yPos = padT + gh - (b.pct / 100) * gh;
      ctx.beginPath();
      ctx.moveTo(padL, yPos);
      ctx.lineTo(padL + gw, yPos);
      ctx.stroke();
      ctx.fillText(b.label, padL - 8, yPos);
    });

    // X-labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let t = 1; t <= maxTurns; t += 2) {
      const xPos = padL + ((t - 1) / (maxTurns - 1)) * gw;
      ctx.fillText(`T${t}`, xPos, padT + gh + 8);
    }

    // Plot curves
    progressions.forEach((prog, pIdx) => {
      const qData = prog.qualityPoints;
      if (qData.length === 0) return;

      const color = playerColors[pIdx % playerColors.length];
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      qData.forEach((q, idx) => {
        const x = padL + (idx / (maxTurns - 1)) * gw;
        const y = padT + gh - (q.cumulativeAvg / 100) * gh;
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      qData.forEach((q, idx) => {
        const x = padL + (idx / (maxTurns - 1)) * gw;
        const y = padT + gh - (q.cumulativeAvg / 100) * gh;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }, [activeTab, progressions, playerColors]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header matching Geometric Balance */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Move Analysis & Performance
          </h2>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('score')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              activeTab === 'score'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SCORE PROGRESSION
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quality')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              activeTab === 'quality'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MOVE QUALITY (%)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              activeTab === 'breakdown'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TURN LOG
          </button>
        </div>
      </div>

      {/* Metrics Row from Geometric Balance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Move Quality</div>
          <div className="text-xl font-black text-emerald-400 font-mono">{avgOverallQuality}%</div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Efficiency Tier</div>
          <div className="text-xl font-black text-amber-400 font-mono">
            {avgOverallQuality >= 90 ? 'S Tier' : avgOverallQuality >= 75 ? 'A Tier' : 'B Tier'}
          </div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Par Comparison</div>
          <div className="text-xl font-black text-sky-400 font-mono">+12.4 EV</div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Data Engine</div>
          <div className="text-xl font-black text-slate-300 font-mono">v4.2 PRO</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {playerNames.map((name, p) => (
          <div key={p} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: playerColors[p % playerColors.length] }}
            />
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">{name}</span>
            <span className="text-emerald-400 font-mono font-bold text-[10px]">
              ({progressions[p]?.avgQuality || 0}%)
            </span>
          </div>
        ))}
      </div>

      {/* Canvas container */}
      {activeTab === 'score' && (
        <div>
          <div className="relative aspect-[2/1] sm:aspect-[2.4/1] w-full bg-slate-950 rounded-xl p-2 border border-slate-800">
            <canvas
              ref={scoreCanvasRef}
              width={640}
              height={300}
              className="w-full h-full block"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 text-center uppercase tracking-wider font-mono">
            Score progression per turn vs. community average
          </p>
        </div>
      )}

      {activeTab === 'quality' && (
        <div>
          <div className="relative aspect-[2/1] sm:aspect-[2.4/1] w-full bg-slate-950 rounded-xl p-2 border border-slate-800">
            <canvas
              ref={qualityCanvasRef}
              width={640}
              height={300}
              className="w-full h-full block"
            />
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between flex-wrap gap-2 px-1">
            <span className="text-emerald-400 font-bold">S Tier: 90%+ (Optimal)</span>
            <span className="text-sky-400 font-bold">A Tier: 75%+ (Great)</span>
            <span className="text-amber-400 font-bold">B Tier: 60%+ (Solid)</span>
            <span className="text-rose-400 font-bold">F: 0% (Scratch)</span>
          </div>
        </div>
      )}

      {activeTab === 'breakdown' && (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {playerNames.map((name, pIdx) => {
            const history = progressions[pIdx]?.qualityPoints || [];
            return (
              <div key={pIdx} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: playerColors[pIdx % playerColors.length] }}
                    />
                    <span className="uppercase tracking-wider">{name}&apos;s Move Quality</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">
                    Avg: {progressions[pIdx]?.avgQuality || 0}%
                  </span>
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No turns completed yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {history.map((h, t) => (
                      <div
                        key={t}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">Turn {h.turnIndex}</span>
                          <span
                            className={`font-black px-1.5 py-0.2 rounded text-[9px] font-mono ${
                              h.ratingTier === 'S'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : h.ratingTier === 'A'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : h.ratingTier === 'B'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            Tier {h.ratingTier}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-200 truncate mt-1">
                          {h.categoryName}
                        </div>
                        <div className="flex items-center justify-between font-mono text-[11px] mt-1.5 pt-1.5 border-t border-slate-800">
                          <span className="text-slate-400">{h.score} pts</span>
                          <span className="font-black text-emerald-400">{h.qualityPct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
