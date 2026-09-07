import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  signInAnonymously,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import type { GameRoomData, HistoricalGame } from '../types/yahtzee';

// Load config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDNEPL_cBjiReJV72PKZAgi6okpRlUleSE",
  authDomain: "gen-lang-client-0764771862.firebaseapp.com",
  projectId: "gen-lang-client-0764771862",
  storageBucket: "gen-lang-client-0764771862.firebasestorage.app",
  messagingSenderId: "1092986138409",
  appId: "1:1092986138409:web:5ce3bf5e67ebcdf0c05138"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-yahtzee-a38adb81-e719-4b08-8ffb-134d49d8251d");

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google (tries popup, falls back gracefully)
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Popup blocked or failed, attempting redirect or anonymous fallback:', error);
    try {
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
    } catch (redirectErr) {
      console.error('Redirect sign in failed:', redirectErr);
    }
    throw error;
  }
}

/**
 * Sign in as guest (for quick multiplayer play without Google account)
 */
export async function loginAsGuest(guestName?: string): Promise<User> {
  const cred = await signInAnonymously(auth);
  if (guestName && cred.user) {
    await updateProfile(cred.user, { displayName: guestName });
  }
  return cred.user;
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Generate a friendly 5-6 letter room code (avoiding confusing chars like O/0, I/1)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new multiplayer room in Firestore
 */
export async function createMultiplayerRoom(
  roomCode: string,
  host: { uid: string; name: string; avatarUrl?: string },
  mode: 'full' | 'companion'
): Promise<string> {
  const roomRef = doc(db, 'rooms', roomCode.toUpperCase());
  
  const initialRoom: GameRoomData = {
    code: roomCode.toUpperCase(),
    hostId: host.uid,
    hostName: host.name,
    mode,
    status: 'waiting',
    players: [
      {
        id: host.uid,
        name: host.name,
        colorIdx: 0,
        isHost: true,
        avatarUrl: host.avatarUrl || '',
        isOnline: true
      }
    ],
    currentPlayer: 0,
    scores: { 0: {} },
    turnHistory: { 0: [] },
    turnRecords: { 0: [] },
    dice: [null, null, null, null, null],
    keepers: [false, false, false, false, false],
    rollCount: 0,
    hideTotals: false,
    lastMove: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(roomRef, initialRoom);
  return roomCode.toUpperCase();
}

/**
 * Join an existing multiplayer room
 */
export async function joinMultiplayerRoom(
  roomCode: string,
  player: { uid: string; name: string; avatarUrl?: string }
): Promise<GameRoomData> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  const snapshot = await getDoc(roomRef);

  if (!snapshot.exists()) {
    throw new Error(`Room "${cleanCode}" was not found. Check the code and try again.`);
  }

  const roomData = snapshot.data() as GameRoomData;
  const existingPlayerIndex = roomData.players.findIndex(p => p.id === player.uid);

  if (existingPlayerIndex >= 0) {
    // Already in room, mark online and update name if needed
    roomData.players[existingPlayerIndex].isOnline = true;
    roomData.players[existingPlayerIndex].name = player.name || roomData.players[existingPlayerIndex].name;
    await updateDoc(roomRef, {
      players: roomData.players,
      updatedAt: Date.now()
    });
    return roomData;
  }

  if (roomData.players.length >= 6) {
    throw new Error('This room is already full (maximum 6 players).');
  }

  const newPlayerIndex = roomData.players.length;
  const newPlayer = {
    id: player.uid,
    name: player.name || `Player ${newPlayerIndex + 1}`,
    colorIdx: newPlayerIndex,
    avatarUrl: player.avatarUrl || '',
    isOnline: true
  };

  const updatedPlayers = [...roomData.players, newPlayer];
  const updatedScores = { ...roomData.scores, [newPlayerIndex]: {} };
  const updatedTurnHistory = { ...roomData.turnHistory, [newPlayerIndex]: [] };

  await updateDoc(roomRef, {
    players: updatedPlayers,
    scores: updatedScores,
    turnHistory: updatedTurnHistory,
    updatedAt: Date.now()
  });

  return {
    ...roomData,
    players: updatedPlayers,
    scores: updatedScores,
    turnHistory: updatedTurnHistory
  };
}

/**
 * Subscribe to live updates of a room
 */
export function subscribeToRoom(
  roomCode: string,
  callback: (room: GameRoomData | null) => void
): Unsubscribe {
  const roomRef = doc(db, 'rooms', roomCode.toUpperCase());
  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GameRoomData);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error('Room subscription error:', err);
  });
}

/**
 * Update room state
 */
export async function updateRoom(
  roomCode: string,
  partialUpdate: Partial<GameRoomData>
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomCode.toUpperCase());
  await updateDoc(roomRef, {
    ...partialUpdate,
    updatedAt: Date.now()
  });
}

/**
 * Save completed game into global/cloud history
 */
export async function saveCloudGameHistory(game: HistoricalGame): Promise<void> {
  try {
    const colRef = collection(db, 'gameHistory');
    await addDoc(colRef, {
      ...game,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Could not save to cloud history, saved locally:', err);
  }
}
