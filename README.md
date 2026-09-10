# SahAI (सहाई) — Voice-First Multilingual Financial Literacy Assistant

**SahAI** is a voice-first, multimodal financial literacy assistant crafted specifically for gig delivery riders, domestic helpers, street vendors, and informal workers across Asia Pacific (**India, Indonesia, Philippines**).

The application is purpose-built for workers with low reading/form literacy who prefer speaking over typing or who receive paper agreements, weekly deduction payslips, informal 5-6 microloans, or government subsidy notices.

---

## Architecture Overview

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Lucide Icons
- **Voice Loop**: Web Speech API for Speech-to-Text (`SpeechRecognition`) and regional Text-to-Speech (`SpeechSynthesis`) with natural rate calibration (0.92x)
- **Vision OCR & Document Scanner**: Gemini Multimodal reasoning (`@google/genai`) for instant inspection of payslips, loan contracts, and subsidy cards
- **Backend API**: Node.js Express server (`server.ts`) running on port 3000 with resilient model fallback ladder (`gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-flash-latest` → `gemini-2.5-pro`)
- **Database & Auth**: Firebase Authentication (Phone verification with zero-friction sandbox OTP fallback) + Cloud Firestore (`/users/{userId}/interactions`)

---

## 1. Threat Summary Table (Agentic Threat Modeling)

| Threat Zone | Identified Risk | Countermeasure Implemented |
|---|---|---|
| **Input Surfaces** | Malicious image or audio payloads exceeding memory buffers | Maximum 10MB payload constraint, strict mime-type validation (`image/*`, `audio/*`), and pre-sanitization before Gemini ingestion |
| **Planning & Reasoning** | Prompt injection via scanned document text trying to hijack instructions | System prompt boundaries enforcing structured JSON output (`plainExplanation`, `concreteNextStep`, `cautionFlag`, `category`) and treating document text strictly as passive data |
| **Tool Execution** | API credential exposure or SSRF via model calls | Server-side proxying in `/api/chat`. No client-side API keys exposed; model calls bound to strict predefined fallback ladder |
| **Memory & State** | Cross-user interaction leaks or `undefined` payload crashes in Firestore | Owner-isolated path architecture (`/users/{userId}/interactions`), recursive undefined-stripper (`sanitizeForFirestore`), and sanitized session state |
| **Inter-System Communication** | Transit tampering or model quota exhaustion (`429`, `503`) | Resilient fallback ladder across 4 Gemini flash/lite models with exponential retry backoff |

---

## 2. Cloud Firestore Security Rules

To enforce strict owner-bound data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Google Cloud Secret Manager Setup

Secure operational credentials by provisioning `GEMINI_API_KEY` into Secret Manager:

```bash
# 1. Enable Secret Manager & Cloud Run APIs
gcloud services enable secretmanager.googleapis.com run.googleapis.com firestore.googleapis.com

# 2. Create the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Cloud Run runtime service account access
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Google Cloud Run Deployment & Campaign Verification

Deploy the application container directly to Cloud Run:

```bash
# 1. Build and deploy container to Cloud Run
gcloud run deploy sahai-app \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000

# 2. Apply mandatory campaign verification label
gcloud run services update sahai-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-south1
```

---

## 5. End-to-End Functional Test Scenarios

### Test Case 1: Phone Sign-In & Sandbox OTP
1. On app load, click **Select Country & Carrier** (India `+91`, Indonesia `+62`, or Philippines `+63`).
2. Type mobile number `9876543210` and click **Send SMS Code**.
3. In preview environments where carrier SMS is unconfigured in Firebase Console, the system automatically engages **Sandbox OTP Mode** with pre-filled code `123456`.
4. Click **Verify & Continue**. Verify the user profile loads instantly with active phone badge and persists across refreshes.
5. Alternatively, click any of the **Quick Demo Worker** buttons (e.g. Ramesh Kumar, Siti Rahayu, Maria Santos) for 1-click test sign-in.

### Test Case 2: Multilingual Language Switch
1. In the header bar, click the language dropdown (🇮🇳 हिन्दी, 🇮🇩 Bahasa Indonesia, 🇵🇭 Tagalog, 🌐 English).
2. Verify the greeting, prompt pills, and speech synthesis locale switch immediately to the selected language.

### Test Case 3: Voice-First Speech-to-Text (STT) & Text-to-Speech (TTS)
1. Tap the green **Microphone** button.
2. The UI enters active recording mode (`Listening in हिन्दी... Speak now`).
3. Speak a question: *"Why was money deducted from my delivery payout?"*
4. Stop or pause speaking; the speech transcript is automatically dispatched to `/api/chat`.
5. When Gemini responds, the **Read Aloud** button automatically begins speaking the explanation and next step.
6. Tap the speaker icon to pause/resume playback.

### Test Case 4: Document Photo Scanner (Gemini Vision OCR)
1. Tap the **Camera** button next to the chat bar.
2. In the modal, select either:
   - **Take Photo / Upload**: Upload any payslip or loan note image.
   - **Sample 1 (Gig Delivery Payout)**: Tests detection of ₹450 late penalty.
   - **Sample 2 (Informal 5-6 Loan)**: Tests detection of 20% predatory weekly interest trap.
   - **Sample 3 (Government Welfare Notice)**: Tests detection of free informal worker benefits.
3. Click **Analyze Document**.
4. Verify the document thumbnail appears in the conversation, Gemini extracts the text, generates a plain-language breakdown, highlights red flags, and provides a concrete next step.

### Test Case 5: Question Vault (Firestore Persistence)
1. Tap **Question Vault** in the top right.
2. Verify all questions, documents, and plain-language answers are listed with timestamps.
3. Tap **Listen Again** on any past card to hear the audio playback.
