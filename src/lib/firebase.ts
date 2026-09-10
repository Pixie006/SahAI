import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult, 
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  limit
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { UserProfile, Interaction, SupportedLanguage } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Specify database ID if present in config
export const db = firebaseConfigJson.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

/**
 * Strips undefined properties recursively to comply with Firestore constraints
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Initializes or fetches existing user profile
 */
export async function getOrCreateUserProfile(
  user: { uid: string; phoneNumber?: string | null; isAnonymous?: boolean }, 
  phoneNumber?: string,
  preferredLanguage: SupportedLanguage = 'hi',
  country: 'IN' | 'ID' | 'PH' | 'OTHER' = 'IN'
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      saveActiveWorkerSession(data);
      return data;
    }
  } catch (err) {
    console.warn('Could not read existing user doc from Firestore:', err);
  }

  const newProfile: UserProfile = {
    uid: user.uid,
    phoneNumber: phoneNumber || user.phoneNumber || 'Informal Worker',
    preferredLanguage,
    country,
    occupation: 'Gig & Informal Worker',
    isGuest: Boolean(user.isAnonymous),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, sanitizeForFirestore(newProfile));
  } catch (err) {
    console.warn('Could not write new user doc to Firestore:', err);
  }

  saveActiveWorkerSession(newProfile);
  return newProfile;
}

const STORAGE_SESSION_KEY = 'sahai_active_worker_session';

export function getActiveWorkerSession(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveActiveWorkerSession(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save worker session:', e);
  }
}

export function clearActiveWorkerSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } catch (e) {
    console.warn('Failed to clear worker session:', e);
  }
}

/**
 * Saves a user interaction under /users/{userId}/interactions
 */
export async function saveUserInteraction(
  userId: string, 
  interaction: Omit<Interaction, 'userId' | 'createdAt'>
): Promise<string> {
  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const payload: Interaction = {
    ...interaction,
    userId,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(interactionsRef, sanitizeForFirestore(payload));
  return docRef.id;
}

/**
 * Fetches recent interactions for the logged-in user
 */
export async function getUserInteractions(userId: string, count = 20): Promise<Interaction[]> {
  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<Interaction, 'id'>)
  }));
}

export { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signInAnonymously,
  firebaseSignOut,
  onAuthStateChanged 
};
export type { ConfirmationResult, User };
