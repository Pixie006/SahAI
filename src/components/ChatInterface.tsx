import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SupportedLanguage, ChatMessage, Interaction } from '../types';
import { SUPPORTED_LANGUAGES, QUICK_PROMPTS_BY_LANG } from '../data/languages';
import { saveUserInteraction, getUserInteractions } from '../lib/firebase';
import { createSpeechRecognizer, isSpeechRecognitionSupported, speakText, stopSpeaking } from '../lib/audioVoice';
import { DocumentUploadModal } from './DocumentUploadModal';
import { 
  Send, 
  Mic, 
  MicOff,
  Camera, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  History, 
  ArrowRight,
  RefreshCw,
  Loader2,
  Shield,
  HelpCircle,
  FileText,
  AudioLines
} from 'lucide-react';

interface ChatInterfaceProps {
  userProfile: UserProfile;
  currentLanguage: SupportedLanguage;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userProfile,
  currentLanguage,
}) => {
  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  const quickPrompts = QUICK_PROMPTS_BY_LANG[currentLanguage] || QUICK_PROMPTS_BY_LANG.en;

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pastInteractions, setPastInteractions] = useState<Interaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Voice STT State
  const [isListening, setIsListening] = useState(false);
  const [speechInterimText, setSpeechInterimText] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);

  // Audio TTS State
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);

  // Document Upload Modal State
  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with localized welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: currentLangMeta.sampleGreeting,
          plainExplanation: currentLangMeta.sampleGreeting,
          concreteNextStep: 'Tap the mic to speak out loud, or tap the camera to scan a payslip or loan form.',
          category: 'welcome',
          timestamp: Date.now(),
        },
      ]);
    }
  }, [currentLanguage, currentLangMeta]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, speechInterimText]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        try { recognizerRef.current.abort(); } catch {}
      }
    };
  }, []);

  // Load history from Firestore
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const items = await getUserInteractions(userProfile.uid, 25);
      setPastInteractions(items);
    } catch (err) {
      console.warn('Failed to load history from Firestore:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleToggleHistory = () => {
    const nextState = !historyOpen;
    setHistoryOpen(nextState);
    if (nextState) {
      fetchHistory();
    }
  };

  // Central send message handler (handles Text, Speech, and Document inputs)
  const handleSendMessage = async (
    textToSend?: string,
    options?: {
      type?: 'text' | 'voice' | 'document';
      imageBase64?: string;
      documentTitle?: string;
    }
  ) => {
    const query = (textToSend || inputQuery).trim();
    const type = options?.type || 'text';
    const imageBase64 = options?.imageBase64;
    const documentTitle = options?.documentTitle;

    if (!query && !imageBase64) return;
    if (loading) return;

    setInputQuery('');
    setSpeechInterimText('');
    setErrorMessage(null);

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: query || (documentTitle ? `Analyzed Document: ${documentTitle}` : 'Document attached'),
      imageUrl: imageBase64,
      documentTitle,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language: currentLanguage,
          imageBase64,
          imageMimeType: imageBase64?.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/jpeg',
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.data) {
        throw new Error(json.message || 'Failed to analyze request');
      }

      const result = json.data;
      const assistantMessageId = `assistant-${Date.now()}`;

      const assistantMsg: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: result.plainExplanation,
        plainExplanation: result.plainExplanation,
        concreteNextStep: result.concreteNextStep,
        cautionFlag: result.cautionFlag,
        category: result.category,
        detectedLanguage: result.detectedLanguage,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically read aloud for informal workers who prefer audio
      if (autoSpeakEnabled && result.plainExplanation) {
        handleSpeak(
          assistantMessageId,
          `${result.plainExplanation}. Action: ${result.concreteNextStep || ''}`
        );
      }

      // Persist interaction to user's isolated Firestore collection
      try {
        await saveUserInteraction(userProfile.uid, {
          type,
          query: query || documentTitle || 'Document inspection',
          imageUrl: imageBase64 ? imageBase64.slice(0, 500) : undefined, // Store compact reference
          documentTitle,
          language: result.detectedLanguage || currentLanguage,
          plainExplanation: result.plainExplanation,
          concreteNextStep: result.concreteNextStep,
          cautionFlag: result.cautionFlag || undefined,
          category: result.category || 'general',
        });
      } catch (saveErr) {
        console.warn('Could not save interaction to Firestore:', saveErr);
      }
    } catch (err: any) {
      console.error('Error querying SahAI:', err);
      setErrorMessage(err?.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Voice STT Toggle
  const handleToggleMic = () => {
    if (isListening) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    setSpeechInterimText('');

    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        `Voice Speech-to-Text is not enabled in this browser. You can tap any Quick Tap question below or type your inquiry!`
      );
      return;
    }

    try {
      const recognizer = createSpeechRecognizer(
        currentLanguage,
        (transcript, isFinal) => {
          setSpeechInterimText(transcript);
          if (isFinal && transcript.trim()) {
            setIsListening(false);
            handleSendMessage(transcript.trim(), { type: 'voice' });
          }
        },
        (err) => {
          setSpeechError(err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
        setIsListening(true);
      }
    } catch (e: any) {
      console.warn('Could not start speech recognition:', e);
      setSpeechError('Microphone error: ' + (e?.message || 'Unable to access microphone.'));
      setIsListening(false);
    }
  };

  // Text-to-Speech playback handler
  const handleSpeak = (msgId: string, text: string) => {
    if (activeSpeechId === msgId) {
      stopSpeaking();
      setActiveSpeechId(null);
      return;
    }

    stopSpeaking();
    setActiveSpeechId(msgId);

    speakText(
      text,
      currentLanguage,
      () => setActiveSpeechId(msgId),
      () => setActiveSpeechId(null),
      () => setActiveSpeechId(null)
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-4xl mx-auto bg-slate-50 relative">
      {/* Top utility sub-header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-200 text-xs font-semibold">
            <span className="text-sm">{currentLangMeta.flag}</span>
            <span>{currentLangMeta.nativeName}</span>
          </div>

          <button
            type="button"
            onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
            className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${
              autoSpeakEnabled ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
            }`}
            title="Toggle automatic voice read-aloud"
          >
            {autoSpeakEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Auto Voice: {autoSpeakEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <button
          id="history-toggle-btn"
          onClick={handleToggleHistory}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-emerald-600" />
          <span>Question Vault</span>
        </button>
      </div>

      {/* Main Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[94%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                }`}
              >
                {/* Document thumbnail attachment if user sent one */}
                {isUser && msg.imageUrl && (
                  <div className="mb-2.5 rounded-xl overflow-hidden border border-emerald-400/40 bg-white/10 p-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-100 mb-1 px-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{msg.documentTitle || 'Attached Document Photo'}</span>
                    </div>
                    <img
                      src={msg.imageUrl}
                      alt="Scanned Document"
                      className="max-h-36 w-full object-contain rounded-lg bg-white"
                    />
                  </div>
                )}

                {/* User message query */}
                {isUser && (
                  <p className="text-base font-medium leading-relaxed">
                    {msg.content}
                  </p>
                )}

                {/* Assistant response */}
                {!isUser && (
                  <div className="space-y-3.5">
                    {/* Header with audio readout button */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        SahAI Guidance
                      </span>

                      {msg.plainExplanation && (
                        <button
                          onClick={() =>
                            handleSpeak(
                              msg.id,
                              `${msg.plainExplanation}. Action: ${msg.concreteNextStep || ''}`
                            )
                          }
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                            activeSpeechId === msg.id
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Listen to this explanation"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${activeSpeechId === msg.id ? 'animate-bounce' : ''}`} />
                          <span>{activeSpeechId === msg.id ? 'Speaking...' : 'Read Aloud'}</span>
                        </button>
                      )}
                    </div>

                    {/* Plain language explanation */}
                    <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                      {msg.plainExplanation || msg.content}
                    </div>

                    {/* Caution flag if predatory terms/penalties detected */}
                    {msg.cautionFlag && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block text-amber-950">Beware / Red Flag:</strong>
                          <span>{msg.cautionFlag}</span>
                        </div>
                      </div>
                    )}

                    {/* Concrete Next Step - User intent mandate */}
                    {msg.concreteNextStep && (
                      <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl text-slate-900 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>WHAT TO DO NEXT:</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-emerald-950">
                          {msg.concreteNextStep}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live speech interim transcription banner */}
        {isListening && (
          <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500 border-dashed rounded-2xl flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <AudioLines className="w-5 h-5 animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Listening in {currentLangMeta.nativeName}... Speak now
              </p>
              <p className="text-sm font-semibold text-slate-800 italic mt-0.5">
                "{speechInterimText || 'Listening for your voice...'}"
              </p>
            </div>
            <button
              onClick={handleToggleMic}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-emerald-700"
            >
              Stop & Send
            </button>
          </div>
        )}

        {/* Speech recognition error banner */}
        {speechError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={() => setSpeechError(null)}
              className="text-amber-800 font-bold hover:underline ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading placeholder */}
        {loading && (
          <div className="flex items-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-4 shadow-xs flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              <span className="text-sm font-semibold text-slate-700">
                SahAI is reviewing with Gemini in {currentLangMeta.nativeName}...
              </span>
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => handleSendMessage()}
              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel for fast one-tap asking */}
      <div className="bg-white/90 border-t border-slate-200 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 max-w-full">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Quick Tap:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shrink-0 transition-all cursor-pointer truncate max-w-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Action Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button (Real Speech-to-Text Loop) */}
          <button
            id="voice-mic-btn"
            type="button"
            title={isListening ? 'Stop recording' : 'Speak your question out loud'}
            onClick={handleToggleMic}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/20 shadow-md'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-emerald-700" />
            )}
          </button>

          {/* Photo / Document Upload Button (Real Gemini Vision OCR) */}
          <button
            id="camera-upload-btn"
            type="button"
            title="Scan Payslip, Loan Agreement or Subsidy Notice"
            onClick={() => setDocumentModalOpen(true)}
            className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <Camera className="w-5 h-5 text-slate-700 hover:text-indigo-700" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              id="chat-query-input"
              type="text"
              placeholder={`Ask in ${currentLangMeta.nativeName} or English...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Send Button */}
          <button
            id="send-query-btn"
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all shadow-md cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Document Scanner & Upload Modal */}
      <DocumentUploadModal
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        onAnalyze={(base64, query, docTitle) => {
          handleSendMessage(query, {
            type: 'document',
            imageBase64: base64,
            documentTitle: docTitle,
          });
        }}
        language={currentLanguage}
      />

      {/* History Vault Drawer / Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Your Question Vault</h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-slate-500 hover:text-slate-800 text-sm font-bold px-2 py-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-900 text-xs border-b border-emerald-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Persisted in Firestore under <code className="font-mono text-[10px]">{userProfile.uid.slice(0, 10)}...</code>. Completely private to you.
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="text-sm">Loading your vault...</span>
                </div>
              ) : pastInteractions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-slate-600">No saved questions yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Questions you ask or documents you scan will be saved here.</p>
                </div>
              ) : (
                pastInteractions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="uppercase text-emerald-700 font-bold flex items-center gap-1">
                        {item.type === 'document' ? <FileText className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        {item.category || 'General'}
                      </span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-sm font-bold text-slate-900">"{item.query}"</p>
                    <p className="text-xs text-slate-600 line-clamp-3">{item.plainExplanation}</p>

                    {item.concreteNextStep && (
                      <div className="p-2 bg-emerald-100/50 rounded-lg text-xs font-semibold text-emerald-950 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item.concreteNextStep}</span>
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        onClick={() =>
                          handleSpeak(
                            item.id || 'vault-item',
                            `${item.plainExplanation}. Action: ${item.concreteNextStep || ''}`
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen Again</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
