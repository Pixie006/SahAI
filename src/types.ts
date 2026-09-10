export type SupportedLanguage = 'hi' | 'id' | 'tl' | 'en';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  country: string;
  flag: string;
  sampleQuestion: string;
  sampleGreeting: string;
}

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  preferredLanguage: SupportedLanguage;
  country: 'IN' | 'ID' | 'PH' | 'OTHER';
  occupation?: string;
  isGuest?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id?: string;
  userId: string;
  type: 'text' | 'voice' | 'document';
  query: string;
  imageUrl?: string;
  documentTitle?: string;
  language: string;
  plainExplanation: string;
  concreteNextStep: string;
  cautionFlag?: string;
  category: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  documentTitle?: string;
  plainExplanation?: string;
  concreteNextStep?: string;
  cautionFlag?: string;
  category?: string;
  detectedLanguage?: string;
  timestamp: number;
}

export interface GeminiAnalysisResult {
  plainExplanation: string;
  concreteNextStep: string;
  cautionFlag?: string;
  category: string;
  detectedLanguage: string;
}
