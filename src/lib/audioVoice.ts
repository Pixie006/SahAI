import { SupportedLanguage } from '../types';

export const LANGUAGE_LOCALE_MAP: Record<SupportedLanguage, string> = {
  hi: 'hi-IN',
  id: 'id-ID',
  tl: 'fil-PH',
  en: 'en-IN',
};

// Check if Web Speech Recognition is available in browser
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

// Create and configure SpeechRecognition instance
export function createSpeechRecognizer(
  language: SupportedLanguage,
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void
): any {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRec();

  recognition.lang = LANGUAGE_LOCALE_MAP[language] || 'en-US';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error event:', event.error);
    if (event.error === 'not-allowed') {
      onError('Microphone access was denied. Please allow microphone permission.');
    } else if (event.error === 'no-speech') {
      onError('No speech was detected. Tap the mic and speak clearly.');
    } else {
      onError(`Speech recognition notice: ${event.error}`);
    }
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}

// Speak aloud using SpeechSynthesis
export function speakText(
  text: string,
  language: SupportedLanguage,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis is not supported in this environment');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const locale = LANGUAGE_LOCALE_MAP[language] || 'en-US';
  utterance.lang = locale;
  utterance.rate = 0.92; // Slightly slower for maximum informal worker clarity
  utterance.pitch = 1.0;

  // Try to find a matching voice if voices are loaded
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(locale.toLowerCase().slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis playback ended or errored:', e);
    if (onEnd) onEnd();
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
