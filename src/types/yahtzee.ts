export type SectionType = 'upper' | 'lower';

export type CategoryType = 'upper' | 'sum' | 'fixed' | 'bonus';

export interface Category {
  id: string;
  name: string;
  face?: string;
  hint?: string;
  type: CategoryType;
  target?: number;
  value?: number;
  maxPossible: number;
  parScore: number; // For move quality metric (standard good expected value)
}

export const UPPER_CATEGORIES: Category[] = [
  { id: '1s', name: 'Ones', face: '⚀', target: 1, type: 'upper', maxPossible: 5, parScore: 3 },
  { id: '2s', name: 'Twos', face: '⚁', target: 2, type: 'upper', maxPossible: 10, parScore: 6 },
  { id: '3s', name: 'Threes', face: '⚂', target: 3, type: 'upper', maxPossible: 15, parScore: 9 },
  { id: '4s', name: 'Fours', face: '⚃', target: 4, type: 'upper', maxPossible: 20, parScore: 12 },
  { id: '5s', name: 'Fives', face: '⚄', target: 5, type: 'upper', maxPossible: 25, parScore: 15 },
  { id: '6s', name: 'Sixes', face: '⚅', target: 6, type: 'upper', maxPossible: 30, parScore: 18 },
];

export const LOWER_CATEGORIES: Category[] = [
  { id: '3k', name: '3 of a Kind', hint: 'At least 3 of same number · Sum of all dice', type: 'sum', maxPossible: 30, parScore: 22 },
  { id: '4k', name: '4 of a Kind', hint: 'At least 4 of same number · Sum of all dice', type: 'sum', maxPossible: 30, parScore: 24 },
  { id: '2p', name: 'Two Pairs', hint: '2 different pairs · Sum of pairs', type: 'sum', maxPossible: 22, parScore: 18 },
  { id: 'fh', name: 'Full House', hint: '3 of one + 2 of another · 25 Pts', type: 'fixed', value: 25, maxPossible: 25, parScore: 25 },
  { id: 'ks', name: 'Small Straight', hint: '4 in a row (e.g. 1-2-3-4) · 30 Pts', type: 'fixed', value: 30, maxPossible: 30, parScore: 30 },
  { id: 'gs', name: 'Large Straight', hint: '5 in a row (e.g. 2-3-4-5-6) · 40 Pts', type: 'fixed', value: 40, maxPossible: 40, parScore: 40 },
  { id: 'kn', name: 'Yahtzee', hint: '5 of a kind · 50 Pts', type: 'fixed', value: 50, maxPossible: 50, parScore: 50 },
  { id: 'kb', name: 'Yahtzee Bonus', hint: '+50 pts per extra Yahtzee', type: 'bonus', maxPossible: 150, parScore: 50 },
  { id: 'ch', name: 'Chance', hint: 'Any roll · Sum of all 5 dice', type: 'sum', maxPossible: 30, parScore: 22 },
];

export const ALL_CATEGORIES: Category[] = [...UPPER_CATEGORIES, ...LOWER_CATEGORIES];

export const REQUIRED_IDS = [
  ...UPPER_CATEGORIES.map(c => c.id),
  ...LOWER_CATEGORIES.filter(c => c.id !== 'kb').map(c => c.id),
];

export const TOTAL_REQUIRED_CELLS = REQUIRED_IDS.length; // 14 categories

export const DEFAULT_PLAYER_NAMES = [
  'Player 1',
  'Player 2',
  'Player 3',
  'Player 4',
  'Player 5',
  'Player 6',
];

export interface PlayerInfo {
  id: string;
  name: string;
  colorIdx: number;
  isHost?: boolean;
  avatarUrl?: string;
  isOnline?: boolean;
}

export type GameMode = 'full' | 'companion';

export interface TurnRecord {
  categoryId: string;
  score: number;
  qualityPct: number; // 0 to 100+ %
  ratingTier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  diceSnapshot?: number[];
  rollCount?: number;
}

export interface MoveQualityData {
  turnIndex: number;
  categoryId: string;
  categoryName: string;
  score: number;
  maxScore: number;
  parScore: number;
  qualityPct: number;
  ratingTier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  cumulativeAvg: number;
}

export interface PlayerScores {
  [categoryId: string]: number;
}

export interface LastMoveSnapshot {
  playerIdx: number;
  categoryId: string;
  oldValue: number | undefined;
  oldTurnHistory: string[];
  oldCurrentPlayer: number;
  oldDice: (number | null)[];
  oldKeepers: boolean[];
  oldRollCount: number;
}

export interface GameRoomData {
  id?: string;
  code: string;
  hostId: string;
  hostName: string;
  mode: GameMode;
  status: 'waiting' | 'playing' | 'finished';
  players: PlayerInfo[];
  currentPlayer: number;
  scores: Record<number, PlayerScores>;
  turnHistory: Record<number, string[]>;
  turnRecords?: Record<number, TurnRecord[]>;
  dice: (number | null)[];
  keepers: boolean[];
  rollCount: number;
  hideTotals?: boolean;
  lastMove?: LastMoveSnapshot | null;
  createdAt: number;
  updatedAt: number;
  winnerIdx?: number;
}

export interface HistoricalGame {
  id: string;
  date: string;
  mode: GameMode;
  players: {
    name: string;
    score: number;
    colorIdx: number;
    isWinner: boolean;
    avgQuality: number;
  }[];
  winnerName: string;
  winningScore: number;
  isTie: boolean;
}
