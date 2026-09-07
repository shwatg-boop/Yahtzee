// Web Audio API Sound Synthesizer for Yahtzee

class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Lazy init on first user gesture
    const saved = localStorage.getItem('yahtzee_sound_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('yahtzee_sound_enabled', String(enabled));
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Sound of 5 wooden/plastic dice rattling in a cup and tumbling on table
   */
  public playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Phase 1: Cup Shake / Rattle (fast irregular clicks)
    const numClicks = 9;
    for (let i = 0; i < numClicks; i++) {
      const delay = (i / numClicks) * 0.28 + (Math.random() * 0.02);
      const clickTime = now + delay;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Wood impact fundamental frequencies around 400-1200Hz
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 + Math.random() * 600, clickTime);
      osc.frequency.exponentialRampToValueAtTime(120, clickTime + 0.035);

      gain.gain.setValueAtTime(0.22 + Math.random() * 0.15, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(clickTime);
      osc.stop(clickTime + 0.04);
    }

    // Phase 2: Dice tumbling to a stop (final settled clatters)
    for (let j = 0; j < 5; j++) {
      const settleDelay = 0.28 + (j * 0.05) + (Math.random() * 0.03);
      const settleTime = now + settleDelay;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700 + (j * 110) + Math.random() * 80, settleTime);
      osc.frequency.exponentialRampToValueAtTime(200, settleTime + 0.05);

      gain.gain.setValueAtTime(0.25 - (j * 0.03), settleTime);
      gain.gain.exponentialRampToValueAtTime(0.001, settleTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(settleTime);
      osc.stop(settleTime + 0.07);
    }
  }

  /**
   * Sound of toggling/holding a die (crisp wood snap)
   */
  public playDieKeep(isKept: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = isKept ? 580 : 380;
    const endFreq = isKept ? 880 : 260;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Satisfying score recording chime
   */
  public playScoreCommit() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.4);
    });
  }

  /**
   * Strike (scratching 0 points) tone
   */
  public playStrike() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Grand YAHTZEE victory celebration fanfare!
   */
  public playYahtzee() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Ascending arpeggio fanfare: C5, E5, G5, C6 with sustain
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.12 },
      { freq: 659.25, time: 0.12, dur: 0.12 },
      { freq: 783.99, time: 0.24, dur: 0.14 },
      { freq: 1046.50, time: 0.38, dur: 0.7 }
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.25, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur + 0.05);
    });
  }
}

export const sound = new SoundFX();
