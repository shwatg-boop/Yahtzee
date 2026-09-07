import React, { useState } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  LogIn, 
  LogOut, 
  Play, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Crown, 
  User as UserIcon,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GameRoomData, GameMode } from '../types/yahtzee';
import { loginWithGoogle, loginAsGuest, logoutUser, generateRoomCode } from '../lib/firebase';

interface MultiplayerModalProps {
  currentUser: User | null;
  currentRoom: GameRoomData | null;
  onCreateRoom: (code: string, mode: GameMode) => Promise<void>;
  onJoinRoom: (code: string) => Promise<void>;
  onStartRoomGame: () => Promise<void>;
  onLeaveRoom: () => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  currentUser,
  currentRoom,
  onCreateRoom,
  onJoinRoom,
  onStartRoomGame,
  onLeaveRoom,
  onClose
}) => {
  const [guestName, setGuestName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('full');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Google sign in failed. Try signing in as guest.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await loginAsGuest(guestName.trim());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Guest sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const code = generateRoomCode();
      await onCreateRoom(code, selectedMode);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await onJoinRoom(joinCode.trim());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to join room. Verify code.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomInvite = () => {
    if (!currentRoom) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${currentRoom.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const isHost = currentRoom && currentUser && currentRoom.hostId === currentUser.uid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight uppercase italic">
                Firebase <span className="text-emerald-400">Live Lobby</span>
              </h2>
              <p className="text-xs text-slate-400">Play across laptops, tablets & smartphones in real time</p>
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

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Authentication Card */}
        {!currentUser ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-center space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Player Sign In
              </h3>
              <p className="text-[11px] text-slate-500">
                Choose Google login or enter a quick display name to jump right in
              </p>
            </div>

            {/* Google Sign in */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-2 my-2 text-slate-600 text-[10px] uppercase tracking-wider font-bold">
              <div className="flex-1 h-[1px] bg-slate-800" />
              <span>or instant guest</span>
              <div className="flex-1 h-[1px] bg-slate-800" />
            </div>

            {/* Quick Guest Name */}
            <form onSubmit={handleGuestLogin} className="flex gap-2">
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Enter Nickname"
                maxLength={16}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoading || !guestName.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full border-2 border-emerald-500 p-0.5 bg-slate-900 flex items-center justify-center overflow-hidden">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {currentUser.displayName || 'Guest Player'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  Online · Ready
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logoutUser}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Room Management Section */}
        {currentUser && !currentRoom && (
          <div className="space-y-4">
            {/* Create Room */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Host New Room
                </h3>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMode('full')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMode === 'full'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold uppercase">🎲 Digital Roll</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Live dice synced across all screens</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('companion')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMode === 'companion'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold uppercase">📋 Companion</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Physical dice, shared leaderboard</div>
                </button>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleCreate}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Room & Get Code</span>
              </button>
            </div>

            {/* Join Room */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Join Active Room
              </h3>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 482"
                  maxLength={6}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono font-black text-center tracking-widest text-sm uppercase focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={isLoading || !joinCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-black uppercase tracking-wider text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <span>Join</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* In Room Lobby View */}
        {currentRoom && (
          <div className="space-y-4">
            {/* Room Code Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Active Room Code
              </span>
              <div className="text-3xl font-mono font-black tracking-widest text-emerald-400 my-1">
                {currentRoom.code}
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Share this code with players to connect seamlessly from other devices.
              </p>
              <button
                type="button"
                onClick={copyRoomInvite}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Code & Direct Link'}</span>
              </button>
            </div>

            {/* Players List matching Geometric Balance Lobby */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Players in Room ({currentRoom.players.length}/6)</span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  {currentRoom.status === 'playing' ? 'GAME IN PROGRESS' : 'WAITING FOR PLAYERS'}
                </span>
              </div>

              <div className="space-y-2">
                {currentRoom.players.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-200">
                        {p.name} {currentUser?.uid === p.id && '(You)'}
                      </span>
                    </div>
                    {p.isHost && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                        HOST
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions for Host & Players */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onLeaveRoom}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 font-bold text-xs transition-colors"
              >
                Leave Room
              </button>

              {isHost && currentRoom.status === 'waiting' ? (
                <button
                  type="button"
                  onClick={onStartRoomGame}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Multiplayer Game</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                >
                  Return to Game
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
