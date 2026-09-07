import {
  UPPER_CATEGORIES,
  LOWER_CATEGORIES,
  ALL_CATEGORIES,
  REQUIRED_IDS,
  Category,
  PlayerScores,
  MoveQualityData,
  TurnRecord
} from '../types/yahtzee';

export function getDiceCounts(dice: number[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const d of dice) {
    if (d >= 1 && d <= 6) {
      counts[d] = (counts[d] || 0) + 1;
    }
  }
  return counts;
}

export function isKniffel(dice: number[]): boolean {
  if (dice.length !== 5 || dice.some(d => d == null || d < 1)) return false;
  return dice.every(d => d === dice[0]);
}

export function isFullHouse(dice: number[]): boolean {
  if (dice.length !== 5) return false;
  const counts = Object.values(getDiceCounts(dice)).sort((a, b) => b - a);
  return (counts[0] === 3 && counts[1] === 2) || counts[0] === 5; // 5 of a kind can count as full house under joker rules
}

export function hasSmallStraight(dice: number[]): boolean {
  const s = new Set(dice);
  return (
    [1, 2, 3, 4].every(x => s.has(x)) ||
    [2, 3, 4, 5].every(x => s.has(x)) ||
    [3, 4, 5, 6].every(x => s.has(x))
  );
}

export function isLargeStraight(dice: number[]): boolean {
  const s = new Set(dice);
  return (
    [1, 2, 3, 4, 5].every(x => s.has(x)) ||
    [2, 3, 4, 5, 6].every(x => s.has(x))
  );
}

/**
 * Calculates score for a given category with the current dice
 */
export function calculateCategoryScore(
  cat: Category,
  dice: number[],
  existingScores: PlayerScores = {}
): number {
  if (dice.length !== 5 || dice.some(d => d == null || isNaN(d) || d < 1)) {
    return 0;
  }

  const sum = dice.reduce((a, b) => a + b, 0);
  const counts = getDiceCounts(dice);

  if (cat.type === 'upper' && cat.target) {
    return dice.filter(d => d === cat.target).length * cat.target;
  }

  if (cat.type === 'fixed') {
    if (cat.id === 'fh') return isFullHouse(dice) ? 25 : 0;
    if (cat.id === 'ks') return hasSmallStraight(dice) ? 30 : 0;
    if (cat.id === 'gs') return isLargeStraight(dice) ? 40 : 0;
    if (cat.id === 'kn') return isKniffel(dice) ? 50 : 0;
  }

  if (cat.type === 'sum') {
    if (cat.id === '3k') {
      const hasThree = Object.values(counts).some(c => c >= 3);
      return hasThree ? sum : 0;
    }
    if (cat.id === '4k') {
      const hasFour = Object.values(counts).some(c => c >= 4);
      return hasFour ? sum : 0;
    }
    if (cat.id === '2p') {
      const pairs = Object.entries(counts)
        .filter(([_, c]) => c >= 2)
        .map(([face]) => Number(face))
        .sort((a, b) => b - a);

      if (pairs.length >= 2) {
        return (pairs[0] * 2) + (pairs[1] * 2);
      }
      // If 4 or 5 of a kind, it also forms two pairs
      const quadFace = Object.entries(counts).find(([_, c]) => c >= 4);
      if (quadFace) {
        return Number(quadFace[0]) * 4;
      }
      return 0;
    }
    if (cat.id === 'ch') {
      return sum;
    }
  }

  if (cat.type === 'bonus' && cat.id === 'kb') {
    if (isKniffel(dice) && existingScores['kn'] === 50) {
      return (existingScores['kb'] || 0) + 50;
    }
    return 0;
  }

  return 0;
}

/**
 * Computes upper section total
 */
export function getUpperSum(scores: PlayerScores): number {
  return UPPER_CATEGORIES.reduce((acc, cat) => acc + (scores[cat.id] ?? 0), 0);
}

/**
 * Upper bonus (+35 if subtotal >= 63)
 */
export function getUpperBonus(scores: PlayerScores): number {
  return getUpperSum(scores) >= 63 ? 35 : 0;
}

/**
 * Computes lower section total
 */
export function getLowerSum(scores: PlayerScores): number {
  return LOWER_CATEGORIES.reduce((acc, cat) => acc + (scores[cat.id] ?? 0), 0);
}

/**
 * Grand total calculation
 */
export function getGrandTotal(scores: PlayerScores): number {
  return getUpperSum(scores) + getUpperBonus(scores) + getLowerSum(scores);
}

/**
 * Count how many required categories have been filled
 */
export function getFilledCount(scores: PlayerScores): number {
  return REQUIRED_IDS.filter(id => scores[id] !== undefined).length;
}

/**
 * Check if player has completed their scorecard
 */
export function isPlayerFinished(scores: PlayerScores): boolean {
  return getFilledCount(scores) === REQUIRED_IDS.length;
}

/**
 * Move Quality Evaluation Metric
 * Returns efficiency percentage (0 to 100+%) and letter grade (S, A, B, C, D, F)
 */
export function evaluateMoveQuality(
  categoryId: string,
  score: number
): { qualityPct: number; ratingTier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' } {
  const cat = ALL_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return { qualityPct: 50, ratingTier: 'C' };

  if (score === 0) {
    // Scratching / striking
    return { qualityPct: 0, ratingTier: 'F' };
  }

  let pct = 0;

  if (cat.type === 'upper' && cat.target) {
    // Target is par = 3 dice (60% of max). 4 dice is 80%, 5 dice is 100%
    const count = score / cat.target;
    if (count >= 5) pct = 100;
    else if (count === 4) pct = 85;
    else if (count === 3) pct = 70; // exact par
    else if (count === 2) pct = 45;
    else if (count === 1) pct = 25;
  } else if (cat.type === 'fixed') {
    if (score === cat.value) {
      pct = 100;
    } else {
      pct = 0;
    }
  } else if (cat.id === '3k' || cat.id === '4k' || cat.id === 'ch') {
    // Par is around 22-24, max 30
    pct = Math.min(100, Math.round((score / cat.maxPossible) * 100));
  } else if (cat.id === '2p') {
    pct = Math.min(100, Math.round((score / 22) * 100));
  } else if (cat.id === 'kb') {
    pct = 100;
  }

  let tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  if (pct >= 90) tier = 'S';
  else if (pct >= 75) tier = 'A';
  else if (pct >= 60) tier = 'B';
  else if (pct >= 40) tier = 'C';
  else if (pct > 0) tier = 'D';
  else tier = 'F';

  return { qualityPct: pct, ratingTier: tier };
}

/**
 * Build turn progression curve and cumulative move quality across turns
 */
export function buildPlayerProgression(
  turnHistory: string[],
  scores: PlayerScores
): {
  scorePoints: number[];
  qualityPoints: MoveQualityData[];
  avgQuality: number;
} {
  const scorePoints: number[] = [0];
  const qualityPoints: MoveQualityData[] = [];
  
  let runningUpper = 0;
  let runningTotal = 0;
  let cumulativeQualitySum = 0;

  turnHistory.forEach((catId, turnIdx) => {
    const val = scores[catId] ?? 0;
    runningTotal += val;

    const cat = ALL_CATEGORIES.find(c => c.id === catId);
    if (cat && cat.type === 'upper') {
      const prevUpper = runningUpper;
      runningUpper += val;
      // If crossed 63 threshold on this turn, add 35 bonus to running total!
      if (prevUpper < 63 && runningUpper >= 63) {
        runningTotal += 35;
      }
    }

    scorePoints.push(runningTotal);

    const { qualityPct, ratingTier } = evaluateMoveQuality(catId, val);
    cumulativeQualitySum += qualityPct;
    const cumulativeAvg = Math.round(cumulativeQualitySum / (turnIdx + 1));

    qualityPoints.push({
      turnIndex: turnIdx + 1,
      categoryId: catId,
      categoryName: cat?.name || catId,
      score: val,
      maxScore: cat?.maxPossible || 30,
      parScore: cat?.parScore || 20,
      qualityPct,
      ratingTier,
      cumulativeAvg
    });
  });

  const avgQuality = qualityPoints.length > 0 
    ? Math.round(cumulativeQualitySum / qualityPoints.length) 
    : 0;

  return { scorePoints, qualityPoints, avgQuality };
}

/**
 * Calculate win probability estimate for each player
 */
export function computeWinProbabilities(
  playerIndices: number[],
  allScores: Record<number, PlayerScores>
): number[] {
  if (playerIndices.length === 0) return [];

  const ratings = playerIndices.map(p => {
    const scores = allScores[p] || {};
    let totalScore = getGrandTotal(scores);
    
    // Remaining unfilled potential
    let remainingMaxPotential = 0;
    REQUIRED_IDS.forEach(id => {
      if (scores[id] === undefined) {
        const cat = ALL_CATEGORIES.find(c => c.id === id);
        remainingMaxPotential += cat ? cat.maxPossible : 25;
      }
    });

    // If upper bonus is still achievable
    if (getUpperSum(scores) < 63) {
      let upperMaxRemaining = 0;
      UPPER_CATEGORIES.forEach(c => {
        if (scores[c.id] === undefined) upperMaxRemaining += c.maxPossible;
      });
      if (getUpperSum(scores) + upperMaxRemaining >= 63) {
        remainingMaxPotential += 35;
      }
    }

    // Weight current guaranteed points heavily, plus fractional realistic potential
    const effectivePotential = totalScore + (remainingMaxPotential * 0.55);
    return Math.pow(Math.max(1, effectivePotential), 2.5);
  });

  const sum = ratings.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return playerIndices.map(() => Math.round(100 / playerIndices.length));
  }

  const rawProbs = ratings.map(r => Math.round((r / sum) * 100));
  return rawProbs;
}
