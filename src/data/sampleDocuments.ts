export interface SampleDocument {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  svgPreview: string;
  simulatedQuery: string;
}

// Crisp, readable SVG document previews converted to data URLs for instant zero-lag loading
export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'doc-payslip',
    title: 'Gig Delivery Weekly Payout',
    subtitle: 'Unexplained ₹450 penalty on 142 deliveries',
    category: 'deductions',
    badge: 'Delivery Payslip',
    simulatedQuery: 'Why was ₹450 deducted from my delivery payout this week? Is this penalty fair?',
    svgPreview: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350" fill="none">
      <rect width="600" height="350" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
      <rect width="600" height="60" rx="16" fill="%230f766e"/>
      <text x="30" y="38" fill="%23ffffff" font-family="sans-serif" font-size="18" font-weight="bold">HYPER-DELIVERY LOGISTICS • WEEKLY PAYSLIP</text>
      <text x="30" y="95" fill="%23334155" font-family="sans-serif" font-size="13">Rider ID: DL-88492 | Period: 01 Sep - 07 Sep</text>
      <text x="30" y="115" fill="%2364748b" font-family="sans-serif" font-size="12">Total Completed Orders: 142 | Distance: 388 km</text>
      
      <line x1="30" y1="135" x2="570" y2="135" stroke="%23e2e8f0" stroke-width="1.5"/>
      <text x="30" y="160" fill="%230f172a" font-family="sans-serif" font-size="14" font-weight="600">Gross Payout (Trip Fares + Surge):</text>
      <text x="480" y="160" fill="%230f172a" font-family="sans-serif" font-size="14" font-weight="bold">₹5,480.00</text>
      
      <text x="30" y="190" fill="%23b91c1c" font-family="sans-serif" font-size="14" font-weight="600">DEDUCTION: Late Dropoff Penalty (x3):</text>
      <text x="480" y="190" fill="%23b91c1c" font-family="sans-serif" font-size="14" font-weight="bold">-₹450.00</text>
      
      <text x="30" y="220" fill="%23b91c1c" font-family="sans-serif" font-size="14" font-weight="600">DEDUCTION: Bag / Jacket EMI (Inst 3/6):</text>
      <text x="480" y="220" fill="%23b91c1c" font-family="sans-serif" font-size="14" font-weight="bold">-₹200.00</text>
      
      <line x1="30" y1="245" x2="570" y2="245" stroke="%23cbd5e1" stroke-width="2"/>
      <text x="30" y="278" fill="%23047857" font-family="sans-serif" font-size="16" font-weight="bold">NET AMOUNT TRANSFERRED TO BANK:</text>
      <text x="480" y="278" fill="%23047857" font-family="sans-serif" font-size="18" font-weight="bold">₹4,830.00</text>
      
      <rect x="30" y="298" width="540" height="34" rx="8" fill="%23fef2f2"/>
      <text x="45" y="320" fill="%23991b1b" font-family="sans-serif" font-size="11" font-weight="bold">Clause 14B: Penalty disputes must be raised within 48 hours in app help ticket.</text>
    </svg>`
  },
  {
    id: 'doc-loan',
    title: 'Informal Daily Loan Contract',
    subtitle: '5-6 Loan: ₱1,200/wk on ₱5,000 (20% interest)',
    category: 'loans',
    badge: 'Microloan Contract',
    simulatedQuery: 'Is this loan agreement safe for a street vendor? How much total interest am I actually paying?',
    svgPreview: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350" fill="none">
      <rect width="600" height="350" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
      <rect width="600" height="60" rx="16" fill="%23b45309"/>
      <text x="30" y="38" fill="%23ffffff" font-family="sans-serif" font-size="18" font-weight="bold">PROMISSORY NOTE & INFORMAL CASH ADVANCE</text>
      <text x="30" y="95" fill="%23334155" font-family="sans-serif" font-size="13">Borrower: Maria Santos (Market Stall 14) | Date: 12 Aug 2026</text>
      
      <line x1="30" y1="120" x2="570" y2="120" stroke="%23e2e8f0" stroke-width="1.5"/>
      <text x="30" y="150" fill="%230f172a" font-family="sans-serif" font-size="14" font-weight="600">Principal Cash Handed Over:</text>
      <text x="480" y="150" fill="%230f172a" font-family="sans-serif" font-size="15" font-weight="bold">₱5,000.00</text>
      
      <text x="30" y="180" fill="%230f172a" font-family="sans-serif" font-size="14" font-weight="600">Repayment Terms (5-6 Rule):</text>
      <text x="410" y="180" fill="%230f172a" font-family="sans-serif" font-size="14" font-weight="bold">₱1,200/wk x 5 wks</text>
      
      <text x="30" y="210" fill="%23b91c1c" font-family="sans-serif" font-size="14" font-weight="600">Total Repayment Required:</text>
      <text x="480" y="210" fill="%23b91c1c" font-family="sans-serif" font-size="15" font-weight="bold">₱6,000.00</text>
      
      <text x="30" y="240" fill="%23dc2626" font-family="sans-serif" font-size="14" font-weight="600">LATE DEFAULT PENALTY CLAUSE:</text>
      <text x="480" y="240" fill="%23dc2626" font-family="sans-serif" font-size="14" font-weight="bold">₱250.00 / day</text>
      
      <rect x="30" y="268" width="540" height="60" rx="8" fill="%23fffbeb" stroke="%23fde68a"/>
      <text x="45" y="292" fill="%2392400e" font-family="sans-serif" font-size="12" font-weight="bold">WARNING: Effective interest is 20% in just 30 days (over 240% per annum).</text>
      <text x="45" y="312" fill="%23b45309" font-family="sans-serif" font-size="11">Collateral retained: Original Government Voter ID card.</text>
    </svg>`
  },
  {
    id: 'doc-subsidy',
    title: 'Government Social Security Scheme',
    subtitle: 'Health & Accident Insurance Notice for Informal Workers',
    category: 'subsidies',
    badge: 'Govt Subsidy Notice',
    simulatedQuery: 'Am I eligible for this informal worker welfare benefit? How do I apply without an agent fee?',
    svgPreview: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350" fill="none">
      <rect width="600" height="350" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
      <rect width="600" height="60" rx="16" fill="%231d4ed8"/>
      <text x="30" y="38" fill="%23ffffff" font-family="sans-serif" font-size="18" font-weight="bold">MINISTRY OF LABOUR • INFORMAL WORKER WELFARE</text>
      <text x="30" y="95" fill="%23334155" font-family="sans-serif" font-size="13">Scheme: E-Shram / BPJS Ketenagakerjaan BPU Grant</text>
      
      <line x1="30" y1="120" x2="570" y2="120" stroke="%23e2e8f0" stroke-width="1.5"/>
      <text x="30" y="150" fill="%230f172a" font-family="sans-serif" font-size="14" font-weight="600">Accidental Disability Cover:</text>
      <text x="460" y="150" fill="%23047857" font-family="sans-serif" font-size="14" font-weight="bold">100% Cashless</text>
      
      <text x="30" y="180" fill="%230f172a" font-family="sans-serif" font-size="14" font-weight="600">Hospital Daily Cash Subsidy:</text>
      <text x="460" y="180" fill="%23047857" font-family="sans-serif" font-size="14" font-weight="bold">Direct Bank Transfer</text>
      
      <text x="30" y="210" fill="%230f172a" font-family="sans-serif" font-size="14" font-weight="600">Annual Worker Premium:</text>
      <text x="460" y="210" fill="%23047857" font-family="sans-serif" font-size="14" font-weight="bold">100% Free (Subsidized)</text>
      
      <rect x="30" y="240" width="540" height="85" rx="10" fill="%23eff6ff" stroke="%23bfdbfe"/>
      <text x="45" y="268" fill="%231e40af" font-family="sans-serif" font-size="13" font-weight="bold">ELIGIBILITY CRITERIA:</text>
      <text x="45" y="290" fill="%231e3a8a" font-family="sans-serif" font-size="12">1. Must be informal / gig / self-employed earner aged 18 to 59.</text>
      <text x="45" y="310" fill="%231e3a8a" font-family="sans-serif" font-size="12">2. Register for free with Aadhaar / KTP / PhilSys ID. Never pay middleman fees.</text>
    </svg>`
  }
];
