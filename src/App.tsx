/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  Users, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Undo2, 
  BarChart2, 
  BookOpen, 
  Trophy, 
  ArrowRight,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';

import { 
  GameMode, 
  Category, 
  PlayerScores, 
  DEFAULT_PLAYER_NAMES, 
  LastMoveSnapshot, 
  HistoricalGame, 
  GameRoomData, 
  REQUIRED_IDS, 
  TOTAL_REQUIRED_CELLS 
} from './types/yahtzee';

import { 
  auth, 
  createMultiplayerRoom, 
  joinMultiplayerRoom, 
  subscribeToRoom, 
  updateRoom, 
  saveCloudGameHistory 
} from './lib/firebase';

import { sound } from './lib/sound';
import { haptics } from './lib/haptics';
import { 
  getGrandTotal, 
  getFilledCount, 
  calculateCategoryScore, 
  buildPlayerProgression 
} from './lib/scoring';

import { DiceRoller } from './components/DiceRoller';
import { ScoreBoard } from './components/ScoreBoard';
import { GraphsView } from './components/GraphsView';
import { ScoreModal } from './components/ScoreModal';
import { PhysicalDiceInputModal } from './components/PhysicalDiceInputModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { SetupModal } from './components/SetupModal';
import { StatsModal } from './components/StatsModal';
import { RulesGuideModal } from './components/RulesGuideModal';

const STORAGE_KEY = 'yahtzee_pro_state_v1';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('yahtzee_theme') as 'dark' | 'light') || 'dark';
  });

  // Sound & Haptics toggles
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(haptics.enabled);

  // Setup / Game state
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>('full');
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [playerNames, setPlayerNames] = useState<string[]>([...DEFAULT_PLAYER_NAMES.slice(0, 2)]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);

  // Scorecard state
  const [scores, setScores] = useState<Record<number, PlayerScores>>({ 0: {}, 1: {} });
  const [turnHistories, setTurnHistories] = useState<Record<number, string[]>>({ 0: [], 1: [] });
  const [hideTotals, setHideTotals] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<LastMoveSnapshot | null>(null);

  // Dice state
  const [dice, setDice] = useState<(number | null)[]>([null, null, null, null, null]);
  const [keepers, setKeepers] = useState<boolean[]>([false, false, false, false, false]);
  const [rollCount, setRollCount] = useState<number>(0);

  // Match History
  const [history, setHistory] = useState<HistoricalGame[]>([]);

  // Modals state
  const [editingCell, setEditingCell] = useState<{ playerIdx: number; category: Category } | null>(null);
  const [showPhysicalInput, setShowPhysicalInput] = useState<boolean>(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [editingNameIdx, setEditingNameIdx] = useState<number | null>(null);

  // Firebase Auth & Room state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRoom, setActiveRoom] = useState<GameRoomData | null>(null);

  // Theme synchronization with document element
  useEffect(() => {
    localStorage.setItem('yahtzee_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-zinc-950 text-zinc-100 min-h-screen';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-zinc-50 text-zinc-900 min-h-screen';
    }
  }, [theme]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Check URL for room code on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setShowMultiplayerModal(true);
    }
  }, []);

  // Load local state on initial boot
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.hasStarted !== undefined) setHasStarted(parsed.hasStarted);
        if (parsed.gameMode) setGameMode(parsed.gameMode);
        if (parsed.numPlayers) setNumPlayers(parsed.numPlayers);
        if (parsed.playerNames) setPlayerNames(parsed.playerNames);
        if (parsed.currentPlayer !== undefined) setCurrentPlayer(parsed.currentPlayer);
        if (parsed.scores) setScores(parsed.scores);
        if (parsed.turnHistories) setTurnHistories(parsed.turnHistories);
        if (parsed.hideTotals !== undefined) setHideTotals(parsed.hideTotals);
        if (parsed.dice) setDice(parsed.dice);
        if (parsed.keepers) setKeepers(parsed.keepers);
        if (parsed.rollCount !== undefined) setRollCount(parsed.rollCount);
        if (parsed.lastMove !== undefined) setLastMove(parsed.lastMove);
        if (parsed.history) setHistory(parsed.history);
      }
    } catch (e) {
      console.warn('Could not load local storage:', e);
    }
  }, []);

  // Auto-save local state
  useEffect(() => {
    if (activeRoom) return; // In multiplayer, Firestore handles persistence
    try {
      const stateToSave = {
        hasStarted,
        gameMode,
        numPlayers,
        playerNames,
        currentPlayer,
        scores,
        turnHistories,
        hideTotals,
        dice,
        keepers,
        rollCount,
        lastMove,
        history
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save to local storage:', e);
    }
  }, [
    hasStarted,
    gameMode,
    numPlayers,
    playerNames,
    currentPlayer,
    scores,
    turnHistories,
    hideTotals,
    dice,
    keepers,
    rollCount,
    lastMove,
    history,
    activeRoom
  ]);

  // Subscribe to room updates if in multiplayer room
  useEffect(() => {
    if (!activeRoom?.code) return;

    const unsub = subscribeToRoom(activeRoom.code, updatedRoom => {
      if (!updatedRoom) {
        setActiveRoom(null);
        return;
      }

      setActiveRoom(updatedRoom);
      setGameMode(updatedRoom.mode);
      setNumPlayers(updatedRoom.players.length);
      setPlayerNames(updatedRoom.players.map(p => p.name));
      setCurrentPlayer(updatedRoom.currentPlayer);
      setScores(updatedRoom.scores);
      setTurnHistories(updatedRoom.turnHistory);
      setDice(updatedRoom.dice);
      setKeepers(updatedRoom.keepers);
      setRollCount(updatedRoom.rollCount);
      if (updatedRoom.lastMove !== undefined) {
        setLastMove(updatedRoom.lastMove);
      }
      if (updatedRoom.status === 'playing') {
        setHasStarted(true);
      }
    });

    return () => unsub();
  }, [activeRoom?.code]);

  // Check if current user is allowed to play this turn in multiplayer
  const isMyTurn = useCallback(() => {
    if (!activeRoom) return true; // Local pass-and-play is always playable
    if (!currentUser) return false;
    const playerForTurn = activeRoom.players[activeRoom.currentPlayer];
    return playerForTurn && playerForTurn.id === currentUser.uid;
  }, [activeRoom, currentUser]);

  // Game over check
  const playerIndices = Array.from({ length: numPlayers }, (_, i) => i);
  const isGameOver = playerIndices.every(
    p => getFilledCount(scores[p] || {}) === TOTAL_REQUIRED_CELLS
  );

  // Trigger celebration on game over
  useEffect(() => {
    if (isGameOver && hasStarted) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      sound.playYahtzee();
      haptics.yahtzee();
    }
  }, [isGameOver, hasStarted]);

  // Theme toggle
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  // Haptics toggle
  const toggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    haptics.setEnabled(next);
  };

  // Handle Roll Dice
  const handleRollDice = () => {
    if (!isMyTurn() || rollCount >= 3) return;

    const nextDice = [...dice];
    for (let i = 0; i < 5; i++) {
      if (rollCount === 0 || !keepers[i]) {
        nextDice[i] = Math.floor(Math.random() * 6) + 1;
      }
    }

    const nextRollCount = rollCount + 1;

    if (activeRoom) {
      updateRoom(activeRoom.code, {
        dice: nextDice,
        rollCount: nextRollCount,
        lastMove: null
      });
    } else {
      setDice(nextDice);
      setRollCount(nextRollCount);
      setLastMove(null);
    }
  };

  // Handle Keeper Toggle
  const handleToggleKeeper = (index: number) => {
    if (!isMyTurn() || rollCount === 0 || rollCount >= 3) return;

    const nextKeepers = [...keepers];
    nextKeepers[index] = !nextKeepers[index];

    if (activeRoom) {
      updateRoom(activeRoom.code, { keepers: nextKeepers });
    } else {
      setKeepers(nextKeepers);
    }
  };

  // Handle Reset Dice (during turn)
  const handleResetDice = () => {
    if (!isMyTurn()) return;

    const resetD = [null, null, null, null, null];
    const resetK = [false, false, false, false, false];

    if (activeRoom) {
      updateRoom(activeRoom.code, {
        dice: resetD,
        keepers: resetK,
        rollCount: 0
      });
    } else {
      setDice(resetD);
      setKeepers(resetK);
      setRollCount(0);
    }
  };

  // Apply Physical Dice Input
  const handleApplyPhysicalDice = (newDice: number[]) => {
    if (!isMyTurn()) return;

    const resetK = [false, false, false, false, false];
    const newRollCount = 3; // Treat physical input as a completed final roll

    if (activeRoom) {
      updateRoom(activeRoom.code, {
        dice: newDice,
        keepers: resetK,
        rollCount: newRollCount
      });
    } else {
      setDice(newDice);
      setKeepers(resetK);
      setRollCount(newRollCount);
    }
  };

  // Handle Score commit to category
  const handleCommitScore = (playerIdx: number, catId: string, val: number) => {
    // Snapshot last move for Undo support
    const snapshot: LastMoveSnapshot = {
      playerIdx,
      categoryId: catId,
      oldValue: scores[playerIdx]?.[catId],
      oldTurnHistory: [...(turnHistories[playerIdx] || [])],
      oldCurrentPlayer: currentPlayer,
      oldDice: [...dice],
      oldKeepers: [...keepers],
      oldRollCount: rollCount
    };

    const nextScores = {
      ...scores,
      [playerIdx]: {
        ...(scores[playerIdx] || {}),
        [catId]: val
      }
    };

    const currentHistory = turnHistories[playerIdx] || [];
    const nextHistory = currentHistory.includes(catId)
      ? currentHistory
      : [...currentHistory, catId];

    const nextTurnHistories = {
      ...turnHistories,
      [playerIdx]: nextHistory
    };

    const nextPlayer = (currentPlayer + 1) % numPlayers;
    const resetD = [null, null, null, null, null];
    const resetK = [false, false, false, false, false];

    // Check for Yahtzee confetti!
    if (catId === 'kn' && val === 50) {
      confetti({ particleCount: 75, spread: 60 });
      sound.playYahtzee();
      haptics.yahtzee();
    }

    if (activeRoom) {
      updateRoom(activeRoom.code, {
        scores: nextScores,
        turnHistory: nextTurnHistories,
        currentPlayer: nextPlayer,
        dice: resetD,
        keepers: resetK,
        rollCount: 0,
        lastMove: snapshot
      });
    } else {
      setScores(nextScores);
      setTurnHistories(nextTurnHistories);
      setCurrentPlayer(nextPlayer);
      setDice(resetD);
      setKeepers(resetK);
      setRollCount(0);
      setLastMove(snapshot);
    }
  };

  // Undo Last Move
  const handleUndo = () => {
    if (!lastMove) return;

    const { playerIdx, categoryId, oldValue, oldTurnHistory, oldCurrentPlayer, oldDice, oldKeepers, oldRollCount } = lastMove;

    const nextScores = { ...scores };
    if (oldValue === undefined) {
      if (nextScores[playerIdx]) {
        delete nextScores[playerIdx][categoryId];
      }
    } else {
      if (!nextScores[playerIdx]) nextScores[playerIdx] = {};
      nextScores[playerIdx][categoryId] = oldValue;
    }

    const nextTurnHistories = {
      ...turnHistories,
      [playerIdx]: oldTurnHistory
    };

    if (activeRoom) {
      updateRoom(activeRoom.code, {
        scores: nextScores,
        turnHistory: nextTurnHistories,
        currentPlayer: oldCurrentPlayer,
        dice: oldDice,
        keepers: oldKeepers,
        rollCount: oldRollCount,
        lastMove: null
      });
    } else {
      setScores(nextScores);
      setTurnHistories(nextTurnHistories);
      setCurrentPlayer(oldCurrentPlayer);
      setDice(oldDice);
      setKeepers(oldKeepers);
      setRollCount(oldRollCount);
      setLastMove(null);
    }
  };

  // Start new local game from setup
  const handleStartLocalGame = (mode: GameMode, count: number, names: string[]) => {
    const initialScores: Record<number, PlayerScores> = {};
    const initialHistories: Record<number, string[]> = {};
    for (let i = 0; i < count; i++) {
      initialScores[i] = {};
      initialHistories[i] = [];
    }

    setGameMode(mode);
    setNumPlayers(count);
    setPlayerNames(names);
    setScores(initialScores);
    setTurnHistories(initialHistories);
    setCurrentPlayer(0);
    setDice([null, null, null, null, null]);
    setKeepers([false, false, false, false, false]);
    setRollCount(0);
    setLastMove(null);
    setHasStarted(true);
    setShowSettingsModal(false);
  };

  // Reset current game
  const handleResetCurrentGame = () => {
    if (!window.confirm('Reset all scores for the current game?')) return;

    const initialScores: Record<number, PlayerScores> = {};
    const initialHistories: Record<number, string[]> = {};
    for (let i = 0; i < numPlayers; i++) {
      initialScores[i] = {};
      initialHistories[i] = [];
    }

    if (activeRoom) {
      updateRoom(activeRoom.code, {
        scores: initialScores,
        turnHistory: initialHistories,
        currentPlayer: 0,
        dice: [null, null, null, null, null],
        keepers: [false, false, false, false, false],
        rollCount: 0,
        lastMove: null
      });
    } else {
      setScores(initialScores);
      setTurnHistories(initialHistories);
      setCurrentPlayer(0);
      setDice([null, null, null, null, null]);
      setKeepers([false, false, false, false, false]);
      setRollCount(0);
      setLastMove(null);
    }
  };

  // Archive finished game and start next round
  const handleStartNextRound = async () => {
    let leaderIdx = 0;
    let leaderScore = -1;
    let isTie = false;

    playerIndices.forEach(p => {
      const s = getGrandTotal(scores[p] || {});
      if (s > leaderScore) {
        leaderScore = s;
        leaderIdx = p;
        isTie = false;
      } else if (s === leaderScore) {
        isTie = true;
      }
    });

    const historicalRecord: HistoricalGame = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      mode: gameMode,
      players: playerIndices.map(p => {
        const pScores = scores[p] || {};
        const pHist = turnHistories[p] || [];
        const { avgQuality } = buildPlayerProgression(pHist, pScores);
        return {
          name: playerNames[p],
          score: getGrandTotal(pScores),
          colorIdx: p,
          isWinner: !isTie && p === leaderIdx,
          avgQuality
        };
      }),
      winnerName: isTie ? 'Tie' : playerNames[leaderIdx],
      winningScore: leaderScore,
      isTie
    };

    const nextHistory = [historicalRecord, ...history];
    setHistory(nextHistory);
    saveCloudGameHistory(historicalRecord);

    // Reset board for next match with same players
    handleResetCurrentGame();
  };

  // Cell tap handler
  const handleCellClick = (pIdx: number, cat: Category) => {
    // Only current player can score on their turn
    if (pIdx !== currentPlayer && !isGameOver) return;
    if (!isMyTurn()) return;

    const pScores = scores[pIdx] || {};
    const diceReady = rollCount > 0 && dice.every(d => d !== null);

    // Fast-tap: if dice are ready and cell is empty, directly commit previewed score!
    if (diceReady && pScores[cat.id] === undefined) {
      const preview = calculateCategoryScore(cat, dice as number[], pScores);
      sound.playScoreCommit();
      haptics.scoreCommit();
      handleCommitScore(pIdx, cat.id, preview);
      return;
    }

    // Otherwise open modal for manual/custom or change
    setEditingCell({ playerIdx: pIdx, category: cat });
  };

  // Create Room handler
  const handleCreateRoom = async (code: string, mode: GameMode) => {
    if (!currentUser) return;
    await createMultiplayerRoom(
      code,
      {
        uid: currentUser.uid,
        name: currentUser.displayName || 'Host Player',
        avatarUrl: currentUser.photoURL || undefined
      },
      mode
    );
    setActiveRoom({
      code,
      hostId: currentUser.uid,
      hostName: currentUser.displayName || 'Host Player',
      mode,
      status: 'waiting',
      players: [
        {
          id: currentUser.uid,
          name: currentUser.displayName || 'Host Player',
          colorIdx: 0,
          isHost: true,
          avatarUrl: currentUser.photoURL || '',
          isOnline: true
        }
      ],
      currentPlayer: 0,
      scores: { 0: {} },
      turnHistory: { 0: [] },
      dice: [null, null, null, null, null],
      keepers: [false, false, false, false, false],
      rollCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  };

  // Join Room handler
  const handleJoinRoom = async (code: string) => {
    if (!currentUser) return;
    const room = await joinMultiplayerRoom(code, {
      uid: currentUser.uid,
      name: currentUser.displayName || 'Player',
      avatarUrl: currentUser.photoURL || undefined
    });
    setActiveRoom(room);
  };

  // Start Room Game
  const handleStartRoomGame = async () => {
    if (!activeRoom) return;
    await updateRoom(activeRoom.code, { status: 'playing' });
    setShowMultiplayerModal(false);
  };

  // Leave Room
  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setShowMultiplayerModal(false);
  };

  // If app has not started, show setup view
  if (!hasStarted && !activeRoom) {
    return (
      <SetupModal
        initialMode={gameMode}
        initialPlayerCount={numPlayers}
        initialNames={playerNames}
        onStartGame={handleStartLocalGame}
      />
    );
  }

  const activePlayerName = playerNames[currentPlayer] || `Player ${currentPlayer + 1}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 bg-dot-matrix select-none">
      {/* Top Navigation Bar adhering to Geometric Balance Theme */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-slate-900/80 backdrop-blur-xl">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center rotate-12 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-slate-100 flex items-center gap-1.5">
              <span>Y-FIRE</span> <span className="text-emerald-400">PRO</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {activePlayerName}&apos;s Turn · {numPlayers} Players
            </p>
          </div>
        </div>

        {/* Toolbar & Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                soundEnabled
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Mute sound FX' : 'Enable sound FX'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Haptics Toggle */}
            <button
              type="button"
              onClick={toggleHaptics}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                hapticsEnabled
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={hapticsEnabled ? 'Disable mobile haptics' : 'Enable mobile vibration'}
            >
              <Vibrate className="w-3.5 h-3.5" />
            </button>

            {/* Hide Totals Toggle */}
            <button
              type="button"
              onClick={() => setHideTotals(!hideTotals)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                hideTotals
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={hideTotals ? 'Show grand totals' : 'Hide totals for suspense'}
            >
              {hideTotals ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Undo Last Move */}
            <button
              type="button"
              disabled={!lastMove}
              onClick={handleUndo}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors"
              title="Undo last recorded score"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            {/* Stats */}
            <button
              type="button"
              onClick={() => setShowStatsModal(true)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors"
              title="Statistics & match history"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>

            {/* Rules */}
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors"
              title="Rules & strategy guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors"
              title="Game settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Multiplayer Profile Pill */}
          <button
            type="button"
            onClick={() => setShowMultiplayerModal(true)}
            className="flex items-center gap-2 pl-2 border-l border-slate-800 text-left hover:opacity-90 transition-opacity"
            title="Firebase Multiplayer Lobby"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activeRoom ? 'Multiplayer Lobby' : 'Pass & Play'}
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                {activeRoom ? `room_${activeRoom.code}_active` : 'local_session'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full border-2 border-emerald-500 p-0.5 bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xs font-black font-mono text-emerald-400">
                  {activePlayerName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 pt-4 space-y-4">
        {/* Waiting on other player notice in multiplayer */}
        {activeRoom && !isMyTurn() && !isGameOver && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>
                Waiting for <strong className="text-white">{activePlayerName}</strong> to roll and assign category...
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              LIVE SYNC
            </span>
          </div>
        )}

        {/* Digital Dice Roller (if Full Mode) */}
        {gameMode === 'full' && (
          <DiceRoller
            dice={dice}
            keepers={keepers}
            rollCount={rollCount}
            onRoll={handleRollDice}
            onToggleKeeper={handleToggleKeeper}
            onResetDice={handleResetDice}
            onOpenPhysicalInput={() => setShowPhysicalInput(true)}
            isCurrentPlayerTurn={isMyTurn()}
            activePlayerName={activePlayerName}
          />
        )}

        {/* Companion Mode Banner (if Companion) */}
        {gameMode === 'companion' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                🎲
              </div>
              <div>
                <h2 className="text-xs font-black uppercase italic text-slate-200">Companion Mode Active</h2>
                <p className="text-[11px] text-slate-400">
                  Roll your real dice on the table, then tap any open category below to enter points.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPhysicalInput(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              Input Dice (1-6)
            </button>
          </div>
        )}

        {/* Score Board Tables */}
        <ScoreBoard
          playerNames={playerNames}
          currentPlayer={currentPlayer}
          scores={scores}
          dice={dice}
          rollCount={rollCount}
          hideTotals={hideTotals}
          onCellClick={handleCellClick}
          onEditName={idx => setEditingNameIdx(idx)}
          isGameOver={isGameOver}
          onShowTotals={() => setHideTotals(false)}
        />

        {/* Analytics & Move Quality Graphs */}
        <GraphsView
          playerNames={playerNames}
          turnHistories={turnHistories}
          scores={scores}
        />

        {/* Game Over Banner & Next Round */}
        {isGameOver && (
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-emerald-400">Match Completed!</h2>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              All categories filled! Inspect final scores, progression curves, and move quality metrics above.
            </p>
            <button
              type="button"
              onClick={handleStartNextRound}
              className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-sm inline-flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            >
              <span>Save & Start Next Game</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Geometric Balance Theme Status Footer */}
      <footer className="mt-8 h-14 bg-slate-950 border-t border-slate-800 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleHaptics}
            className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${hapticsEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Haptic Feedback {hapticsEnabled ? 'On' : 'Off'}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleSound}
            className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sound FX {soundEnabled ? 'Active' : 'Muted'}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
          <span className="uppercase tracking-widest font-mono">v4.2.0-STABLE</span>
          <span className="text-slate-800">|</span>
          <span className="uppercase tracking-widest">
            {activeRoom ? 'Multiplayer Online' : gameMode === 'companion' ? 'Companion Mode' : 'Digital Mode'}
          </span>
        </div>
      </footer>

      {/* Score entry modal */}
      {editingCell && (
        <ScoreModal
          category={editingCell.category}
          playerIdx={editingCell.playerIdx}
          playerName={playerNames[editingCell.playerIdx]}
          currentValue={scores[editingCell.playerIdx]?.[editingCell.category.id]}
          onSave={val => {
            handleCommitScore(editingCell.playerIdx, editingCell.category.id, val);
            setEditingCell(null);
          }}
          onClear={() => {
            const nextScores = { ...scores };
            if (nextScores[editingCell.playerIdx]) {
              delete nextScores[editingCell.playerIdx][editingCell.category.id];
            }
            setScores(nextScores);
            setEditingCell(null);
          }}
          onClose={() => setEditingCell(null)}
        />
      )}

      {/* Physical dice input modal */}
      {showPhysicalInput && (
        <PhysicalDiceInputModal
          initialDice={dice}
          onApply={handleApplyPhysicalDice}
          onClose={() => setShowPhysicalInput(false)}
          playerName={activePlayerName}
        />
      )}

      {/* Multiplayer modal */}
      {showMultiplayerModal && (
        <MultiplayerModal
          currentUser={currentUser}
          currentRoom={activeRoom}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onStartRoomGame={handleStartRoomGame}
          onLeaveRoom={handleLeaveRoom}
          onClose={() => setShowMultiplayerModal(false)}
        />
      )}

      {/* Stats modal */}
      {showStatsModal && (
        <StatsModal
          history={history}
          playerNames={playerNames}
          onClearHistory={() => setHistory([])}
          onClose={() => setShowStatsModal(false)}
        />
      )}

      {/* Rules modal */}
      {showRulesModal && (
        <RulesGuideModal onClose={() => setShowRulesModal(false)} />
      )}

      {/* Settings modal */}
      {showSettingsModal && (
        <SetupModal
          initialMode={gameMode}
          initialPlayerCount={numPlayers}
          initialNames={playerNames}
          onStartGame={handleStartLocalGame}
          onClose={() => setShowSettingsModal(false)}
          isOverlay={true}
        />
      )}
    </div>
  );
}
