// Haptic vibration feedback for mobile devices (Android & iOS)

class Haptics {
  public enabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('yahtzee_haptics_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('yahtzee_haptics_enabled', String(enabled));
  }

  private triggerVibration(pattern: number | number[]) {
    if (!this.enabled) return;
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore unsupported platforms
    }
  }

  /**
   * Tactile rolling rattle (mimics cup tumbling)
   */
  public roll() {
    this.triggerVibration([20, 30, 25, 40, 20, 50, 35]);
  }

  /**
   * Light click when keeping or releasing a die
   */
  public toggleDie() {
    this.triggerVibration(18);
  }

  /**
   * Confirmation pulse when committing a score to the board
   */
  public scoreCommit() {
    this.triggerVibration([35, 20, 45]);
  }

  /**
   * Strike (scratch 0) tactile dull thud
   */
  public strike() {
    this.triggerVibration(60);
  }

  /**
   * Yahtzee victory celebration vibration pattern
   */
  public yahtzee() {
    this.triggerVibration([40, 40, 60, 40, 80, 50, 150]);
  }

  /**
   * Turn switch alert
   */
  public nextTurn() {
    this.triggerVibration(25);
  }
}

export const haptics = new Haptics();
