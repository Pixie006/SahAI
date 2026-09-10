import React from 'react';
import { UserProfile, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { Globe, LogOut, ShieldCheck, HeartHandshake } from 'lucide-react';
import { firebaseSignOut, auth } from '../lib/firebase';

interface HeaderProps {
  userProfile: UserProfile | null;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  currentLanguage,
  onLanguageChange,
  onSignOut,
}) => {
  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    onSignOut();
  };

  return (
    <header 
      id="app-header" 
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                SahAI
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                APAC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Voice Financial Companion for Gig & Informal Workers
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1 hidden xs:inline" />
            <select
              id="language-selector"
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent text-xs font-bold text-slate-800 py-1 px-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-slate-900">
                  {lang.flag} {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* User Status and Logout */}
          {userProfile && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <div 
                title={userProfile.phoneNumber} 
                className="hidden md:flex flex-col items-end text-right"
              >
                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">
                  {userProfile.phoneNumber}
                </span>
                <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> Private Vault
                </span>
              </div>
              <button
                id="sign-out-btn"
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
