import { LanguageMeta } from '../types';

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    country: 'India',
    flag: '🇮🇳',
    sampleQuestion: 'मेरे इस हफ्ते के पेआउट से पैसे क्यों कटे?',
    sampleGreeting: 'नमस्ते! मैं सहाय हूँ। आपकी कमाई और पैसों से जुड़े किसी भी सवाल में मदद के लिए तैयार।',
  },
  {
    code: 'id',
    name: 'Bahasa Indonesia',
    nativeName: 'Bahasa Indonesia',
    country: 'Indonesia',
    flag: '🇮🇩',
    sampleQuestion: 'Kenapa ada potongan insentif di akun saya minggu ini?',
    sampleGreeting: 'Halo! Saya SahAI. Siap membantu memahami slip gaji, potongan, atau pinjaman Anda.',
  },
  {
    code: 'tl',
    name: 'Tagalog',
    nativeName: 'Tagalog / Filipino',
    country: 'Philippines',
    flag: '🇵🇭',
    sampleQuestion: 'Bakit may kaltas sa payout ko ngayong linggo?',
    sampleGreeting: 'Kumusta! Ako si SahAI, ang iyong kasama sa pag-intindi ng sahod, kaltas, at ayuda.',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'Simple English',
    country: 'Universal',
    flag: '🌏',
    sampleQuestion: 'Why was money deducted from my pay this week?',
    sampleGreeting: 'Hello! I am SahAI, your simple financial companion for pay, loans, and subsidies.',
  },
];

export const QUICK_PROMPTS_BY_LANG: Record<string, string[]> = {
  hi: [
    'मेरे पेआउट से पैसे क्यों काटे गए?',
    'क्या यह 10% ब्याज वाला लोन सही है?',
    'स्ट्रीट वेंडर के लिए सरकारी योजना कौन सी है?',
    'राइड कैंसिलेशन पेनल्टी से कैसे बचें?'
  ],
  id: [
    'Kenapa ada potongan insentif di dompet driver?',
    'Apakah pinjol bunga harian ini berbahaya?',
    'Bagaimana cara daftar subsidi bansos PKH / BLT?',
    'Klaim asuransi kecelakaan kerja ojol'
  ],
  tl: [
    'Bakit may kaltas sa delivery payout ko?',
    'Ligtas ba ang 5-6 loan o online lending app na ito?',
    'Paano mag-apply ng SSS o ayuda para sa informal worker?',
    'Ano ang gagawin kapag na-penalize ng rider app?'
  ],
  en: [
    'Why was money deducted from my delivery pay?',
    'Is this micro-loan interest rate safe or a trap?',
    'What government subsidies can gig workers get?',
    'How do I dispute an unfair platform cancellation fee?'
  ]
};
