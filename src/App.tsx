/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  getOrCreateUserProfile, 
  getActiveWorkerSession, 
  saveActiveWorkerSession, 
  clearActiveWorkerSession, 
  firebaseSignOut,
  User 
} from './lib/firebase';
import { UserProfile, SupportedLanguage } from './types';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { PhoneAuthModal } from './components/PhoneAuthModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getActiveWorkerSession());
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    const existing = getActiveWorkerSession();
    return existing?.preferredLanguage || 'hi';
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 1. Check if cached worker session exists
    const existingSession = getActiveWorkerSession();
    if (existingSession) {
      setUserProfile(existingSession);
      if (existingSession.preferredLanguage) {
        setCurrentLanguage(existingSession.preferredLanguage);
      }
      setInitializing(false);
    }

    // 2. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getOrCreateUserProfile(user, undefined, currentLanguage);
          setUserProfile(profile);
          if (profile.preferredLanguage) {
            setCurrentLanguage(profile.preferredLanguage);
          }
        } catch (e) {
          console.warn('Failed to load user profile from Firestore:', e);
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            phoneNumber: user.phoneNumber || 'Informal Worker',
            preferredLanguage: currentLanguage,
            country: 'IN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUserProfile(fallbackProfile);
          saveActiveWorkerSession(fallbackProfile);
        }
      } else {
        setCurrentUser(null);
        // If not in Firebase Auth, check if session stored in local worker profile
        const local = getActiveWorkerSession();
        if (!local) {
          setUserProfile(null);
        }
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    saveActiveWorkerSession(profile);
    if (profile.preferredLanguage) {
      setCurrentLanguage(profile.preferredLanguage);
    }
  };

  const handleSignOut = async () => {
    clearActiveWorkerSession();
    setCurrentUser(null);
    setUserProfile(null);
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore if not signed in via Firebase Auth
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Starting SahAI...</h2>
        <p className="text-xs text-slate-500 mt-1">Checking secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      <Header
        userProfile={userProfile}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 flex flex-col">
        {userProfile ? (
          <ChatInterface
            userProfile={userProfile}
            currentLanguage={currentLanguage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <PhoneAuthModal
              onSuccess={handleAuthSuccess}
              currentLanguage={currentLanguage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
