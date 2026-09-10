import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy Google GenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Fallback Model Ladder as specified in guidelines
const MODEL_FALLBACK_LADDER = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-pro'
];

/**
 * Resilient Gemini call wrapper attempting models in order upon transient failures
 */
async function generateContentWithFallback(params: {
  contents: any[];
  systemInstruction?: string;
  responseMimeType?: string;
}) {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: params.responseMimeType || 'application/json',
          temperature: 0.3,
        },
      });

      return {
        modelUsed: model,
        text: response.text,
      };
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} failed with error:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw lastError || new Error('All models in fallback ladder failed.');
}

const SAHAI_SYSTEM_INSTRUCTION = `
You are "SahAI", a voice-first, multilingual financial literacy companion specifically created for gig and informal workers in Asia Pacific (India, Indonesia, Philippines: e.g., delivery couriers, ride-hailing drivers, street vendors, domestic workers, construction daily-wage earners).

TARGET AUDIENCE CONTEXT:
- Users often have low digital and reading literacy. They are not fluent in financial/legal jargon or complex English.
- They rely heavily on spoken communication, clear audio explanations, and photos of physical or digital documents.
- They frequently face issues like: unexplained wage/fuel/platform deductions, predatory informal loans (e.g. 5-6 lending with 20% interest), platform penalties, unfamiliar insurance policies, or unclaimed government subsidies.

DOCUMENT ANALYSIS RULES (WHEN AN IMAGE IS PROVIDED):
1. Extract and inspect text from the document (payslip, loan agreement, insurance certificate, subsidy notice, receipt).
2. Check for hidden fees, deduction breakdown, daily/monthly interest rates, repayment schedule, or eligibility conditions.
3. Compare gross earnings vs net payout if it is a payslip, highlighting deductions in simple words.
4. Flag any predatory clause immediately in "cautionFlag".

RESPONSE RULES:
1. Explain clearly in 2 to 3 simple sentences that can be easily understood when read aloud.
2. Ban financial jargon: Avoid terms like "statutory deduction", "amortization", "liquid collateral". Use everyday terms: "money kept by the app", "extra fee for late payment", "daily interest", "government grant".
3. ALWAYS provide ONE concrete, actionable next step (e.g. "Take a screenshot and message your fleet leader", "Visit your local bank branch with your Aadhaar / KTP / UMID card", "Do not sign until they write down the exact monthly interest rate").
4. If there is any warning sign (predatory interest rate, hidden fee, unfair penalty), flag it clearly.
5. Language: Respect the user's selected or spoken language:
   - Hindi (हिन्दी) for India
   - Bahasa Indonesia for Indonesia
   - Tagalog / Filipino for Philippines
   - English (simple, colloquial)
   - You may also handle colloquial mixtures like Hinglish or Taglish naturally.

OUTPUT FORMAT:
You MUST return valid, parseable JSON matching this exact structure:
{
  "plainExplanation": "Clear, short 2-3 sentence explanation",
  "concreteNextStep": "Immediate, simple, actionable instruction",
  "cautionFlag": "Optional brief warning, or null if none",
  "category": "deductions | loans | subsidies | pay | insurance | dispute | savings",
  "detectedLanguage": "hi | id | tl | en"
}
`;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Text, Audio & Multimodal Document Chat Analysis Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const { 
      query = '', 
      language = 'hi', 
      imageBase64, 
      imageMimeType = 'image/jpeg',
      audioBase64,
      audioMimeType = 'audio/webm'
    } = payload;

    if (!query && !imageBase64 && !audioBase64) {
      return res.status(400).json({
        error: 'Either query, imageBase64, or audioBase64 is required'
      });
    }

    const parts: any[] = [];

    // Multimodal image part (Payslip, Loan contract, Subsidy form)
    if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: imageMimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    // Multimodal audio part (Voice query recording)
    if (audioBase64 && typeof audioBase64 === 'string') {
      const cleanAudioBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9+]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: audioMimeType || 'audio/webm',
          data: cleanAudioBase64,
        },
      });
    }

    const defaultDocPrompt = 'Please analyze this document for an informal worker. Explain any deductions, interest charges, penalties, or entitlements simply and provide the single most important next step.';
    const effectiveQuery = (query && typeof query === 'string' && query.trim()) 
      ? query.trim() 
      : (imageBase64 ? defaultDocPrompt : 'Listen to my spoken voice question and provide clear guidance.');

    const promptContext = `User Language Preference: ${language}.
User Query / Task: "${effectiveQuery}"
${imageBase64 ? 'Note: A document photo has been attached. Extract details and explain in plain words.' : ''}
${audioBase64 ? 'Note: A voice recording is attached. Transcribe and answer the spoken inquiry.' : ''}

Provide the financial explanation and next step adhering to the target audience standards and JSON output schema.`;

    parts.push({ text: promptContext });

    const contents = [
      {
        role: 'user',
        parts,
      },
    ];

    const result = await generateContentWithFallback({
      contents,
      systemInstruction: SAHAI_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
    });

    if (!result.text) {
      throw new Error('Empty response received from Gemini');
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(result.text);
    } catch {
      // Fallback in case JSON wrapped in backticks
      const clean = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(clean);
    }

    return res.json({
      success: true,
      data: parsedData,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      error: 'Failed to analyze financial query',
      message: error?.message || 'Unknown server error',
      fallback: {
        plainExplanation: 'SahAI is currently unable to reach the financial reasoning server. Please try asking again in a moment.',
        concreteNextStep: 'Check your connection and tap the send button again.',
        category: 'general',
        detectedLanguage: 'en'
      }
    });
  }
});

// Mount Vite or static file serving
async function setupViteAndListen() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SahAI Server running at http://0.0.0.0:${PORT}`);
  });
}

setupViteAndListen();
