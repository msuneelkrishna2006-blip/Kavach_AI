import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Copy, Check, ArrowDown, ChevronRight,
         AlertTriangle, Phone, Lock, Eye, Share2, Download,
         ExternalLink } from 'lucide-react';
import { demoApi } from '../api/index.js';
import toast from 'react-hot-toast';

/* ───────────────────────────────────────────
   Synthetic samples — all fabricated
   ─────────────────────────────────────────── */
const SAMPLES = [
  {
    id: 'kyc',
    label: 'Fake KYC SMS',
    text: 'Dear Customer, Your SBI account will be BLOCKED in 24 hours due to incomplete KYC. Update now: http://sbi-kyc-update.xyz/verify. For help call 9876543210. Your OTP is 847291. Do not share. -SBI Team',
    inputType: 'sms',
    isScam: true,
  },
  {
    id: 'legit',
    label: 'Bank alert (legitimate)',
    text: 'Rs 2,500.00 debited from A/c XX4523 on 15-Oct. UPI Ref: 428176234523. If not done by you, call 1800-111-1111 (bank toll-free). Never share OTP with anyone. -YourBank',
    inputType: 'sms',
    isScam: false,
  },
  {
    id: 'upi',
    label: 'UPI refund scam',
    text: 'Hi, I accidentally sent Rs 5000 to your number. Please check and return it. I am sending a collect request, just approve it and enter your UPI PIN. My family urgently needs this money.',
    inputType: 'whatsapp',
    isScam: true,
  },
];

/* Pre-computed fallback for the KYC sample */
const FALLBACK_RESULT = {
  riskLevel: 'high',
  finalScore: 72,
  ruleScore: 72,
  aiUsed: false,
  scamCategory: 'kyc_phishing',
  piiSummary: { phone: 1, otp: 1 },
  piiFindings: [
    { type: 'phone', maskedHint: '98XXXX3210' },
    { type: 'otp', maskedHint: '8XXXX1' },
  ],
  sanitizedText: 'Dear Customer, Your SBI account will be BLOCKED in 24 hours due to incomplete KYC. Update now: [URL_1]. For help call [PHONE_REDACTED]. Your OTP is [OTP_REDACTED]. Do not share. -SBI Team',
  ruleFindings: [
    { label: 'Account block threat', weight: 25, explanation: 'Threatens to block your account to create panic.' },
    { label: 'Suspicious URL detected', weight: 20, explanation: 'Contains a link with a non-standard domain (.xyz).' },
    { label: 'Urgency language', weight: 15, explanation: 'Uses "24 hours" deadline to rush your decision.' },
    { label: 'Impersonates a bank', weight: 12, explanation: 'Claims to be from SBI but uses unofficial channels.' },
  ],
  disclaimer: 'KavachAI provides a heuristic risk assessment, not a guarantee.',
};

/* ═══════════════════════════════════════════
   Landing Page
   ═══════════════════════════════════════════ */
export default function Landing() {
  return (
    <div className="min-h-screen bg-midnight">
      <Nav />
      <Hero />
      <RedactionSection />
      <HowItWorks />
      <ReportPreview />
      <FamilyAlertSection />
      <PrivacyPromise />
      <RadarTeaser />
      <Footer />
    </div>
  );
}

/* ─── Nav ─────────────────────────────────── */
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
      <div className="max-w-6xl mx-auto px-5 py-3.5
                      flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-emerald" />
          <span className="font-['Sora'] text-lg font-bold text-text">
            KavachAI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="px-4 py-2 text-sm font-medium
                       text-text-muted hover:text-text transition-colors">
            Sign in
          </Link>
          <Link to="/register"
            className="px-4 py-2 text-sm font-medium bg-emerald
                       hover:bg-emerald-dim text-midnight rounded-lg
                       transition-colors">
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ────────────────────────────────── */
function Hero() {
  const [activeSample, setActiveSample] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [phase, setPhase] = useState(0);
  const prefersReducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const runAnalysis = useCallback(async (sample) => {
    setLoading(true);
    setResult(null);
    setPhase(0);
    setIsFallback(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const { data } = await demoApi.analyze({
        text: sample.text,
        inputType: sample.inputType,
      });
      clearTimeout(timeout);
      setResult(data.data);
      setIsFallback(false);
    } catch {
      clearTimeout(timeout);
      if (sample.id === 'kyc') {
        setResult(FALLBACK_RESULT);
      } else {
        setResult({
          ...FALLBACK_RESULT,
          finalScore: sample.isScam ? 65 : 8,
          riskLevel: sample.isScam ? 'high' : 'low',
          ruleScore: sample.isScam ? 65 : 8,
          ruleFindings: sample.isScam
            ? FALLBACK_RESULT.ruleFindings
            : [],
          piiSummary: {},
          sanitizedText: sample.text,
        });
      }
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runAnalysis(SAMPLES[0]);
  }, [runAnalysis]);

  /* Orchestrated animation phases */
  useEffect(() => {
    if (loading || !result) return;
    if (prefersReducedMotion.current) { setPhase(4); return; }

    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [loading, result]);

  const switchSample = (idx) => {
    setActiveSample(idx);
    runAnalysis(SAMPLES[idx]);
  };

  return (
    <section className="pt-24 pb-12 sm:pt-32 sm:pb-20 px-5">
      <div className="max-w-6xl mx-auto
                      grid grid-cols-1 lg:grid-cols-2 gap-12
                      items-center">
        {/* Left: Copy */}
        <div>
          <h1 className="display-lg text-text mb-5">
            Check before you click,{' '}
            share, or&nbsp;pay.
          </h1>
          <p className="text-text-muted text-lg mb-8 max-w-lg">
            Paste a suspicious message and get an explainable
            verdict in seconds — your data stays redacted,
            always.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/register"
              className="px-6 py-3 bg-emerald hover:bg-emerald-dim
                         text-midnight font-semibold rounded-lg
                         transition-colors">
              Check a message
            </Link>
            <a href="#how-it-works"
               className="flex items-center gap-1.5 px-4 py-3
                          text-text-muted hover:text-text text-sm
                          font-medium transition-colors">
              See how it works
              <ArrowDown className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Right: Phone Mockup */}
        <div className="flex flex-col items-center">
          <PhoneMockup
            sample={SAMPLES[activeSample]}
            result={result}
            phase={phase}
            loading={loading}
            isFallback={isFallback}
          />
          {/* Sample switcher */}
          <div className="flex gap-2 mt-5">
            {SAMPLES.map((s, i) => (
              <button key={s.id}
                onClick={() => switchSample(i)}
                className={`px-3 py-1.5 text-xs font-medium
                  rounded-lg border transition-colors
                  ${activeSample === i
                    ? 'bg-emerald/10 text-emerald border-emerald/30'
                    : 'bg-surface border-border text-text-muted hover:text-text'
                  }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Phone Mockup (pure CSS/SVG) ─────────── */
function PhoneMockup({ sample, result, phase, loading, isFallback }) {
  if (loading) {
    return (
      <div className="w-[280px] sm:w-[300px]">
        <div className="rounded-[32px] border-2 border-border-light
                        bg-surface p-3 pb-4">
          <div className="rounded-[24px] bg-midnight p-4 min-h-[380px]
                          flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8
                            border-t-2 border-emerald" />
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const riskColor = {
    low: 'text-risk-low',
    medium: 'text-risk-medium',
    high: 'text-risk-high',
    critical: 'text-risk-critical',
  };
  const riskStroke = {
    low: '#34d399',
    medium: '#f5a623',
    high: '#f97316',
    critical: '#ef4444',
  };
  const riskBadgeClass = {
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
    critical: 'risk-critical',
  };
  const riskVerdict = {
    low: '✓ Appears safe — standard alert',
    medium: '⚠ Suspicious — verify independently',
    high: '⚠ Likely scam — do not engage',
    critical: '⛔ Dangerous — do not respond',
  };

  const positiveFindings = (result.ruleFindings || [])
    .filter(f => f.weight > 0)
    .slice(0, 3);

  return (
    <div className="w-[280px] sm:w-[300px]" aria-label="Demo analysis">
      {/* Phone shell */}
      <div className="rounded-[32px] border-2 border-border-light
                      bg-surface p-3 pb-4 shadow-2xl
                      shadow-emerald/5">
        {/* Notch */}
        <div className="flex justify-center mb-2">
          <div className="w-24 h-5 rounded-b-xl bg-midnight" />
        </div>

        {/* Screen */}
        <div className="rounded-[24px] bg-midnight p-3
                        min-h-[380px] space-y-3 overflow-hidden">
          {/* SMS header */}
          <div className="flex items-center gap-2 pb-2
                          border-b border-border">
            <Phone className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">
              {sample.inputType.toUpperCase()}
            </span>
            {isFallback && (
              <span className="ml-auto text-[10px] text-text-dim
                              bg-surface-2 px-1.5 py-0.5 rounded">
                Demo data
              </span>
            )}
          </div>

          {/* Message bubble */}
          <div className={`text-[13px] leading-relaxed
                          font-['Noto_Sans'] text-text
                          transition-opacity duration-500
                          ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
            {phase >= 2
              ? <AnnotatedText text={result.sanitizedText} />
              : <span className="whitespace-pre-wrap">
                  {sample.text}
                </span>
            }
          </div>

          {/* PII chips */}
          {phase >= 2 && result.piiSummary
            && Object.keys(result.piiSummary).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(result.piiSummary).map(([t, c]) => (
                <span key={t}
                  className="px-2 py-0.5 rounded-md text-[10px]
                             font-semibold bg-saffron/15
                             text-saffron border border-saffron/25"
                  style={{ animation: phase === 2
                    ? 'chip-enter 0.3s ease-out both' : 'none' }}>
                  <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                  {t}: {c} redacted
                </span>
              ))}
            </div>
          )}

          {/* Risk gauge */}
          {phase >= 3 && (
            <div className="flex flex-col items-center pt-1">
              <RiskGauge
                score={result.finalScore}
                level={result.riskLevel}
                stroke={riskStroke[result.riskLevel]}
                animate={phase === 3}
              />
              <p className={`text-xs font-semibold mt-1
                            ${riskColor[result.riskLevel]}`}
                 role="status" aria-live="polite">
                {riskVerdict[result.riskLevel]}
              </p>
            </div>
          )}

          {/* Red-flag chips */}
          {phase >= 4 && positiveFindings.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {positiveFindings.map((f, i) => (
                <span key={i}
                  className="risk-badge risk-high text-[10px]"
                  style={{
                    animation: `chip-enter 0.3s ease-out ${i * 0.12}s both`,
                  }}>
                  <AlertTriangle className="w-3 h-3" />
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Render sanitized text with placeholder highlights */
function AnnotatedText({ text }) {
  const parts = text.split(/(\[[A-Z_]+\])/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        /^\[.*\]$/.test(part) ? (
          <span key={i}
            className="inline-flex items-center gap-0.5 px-1
                       py-0.5 mx-0.5 rounded bg-saffron/20
                       text-saffron text-[11px] font-semibold
                       align-baseline">
            <Lock className="w-2.5 h-2.5" />
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

/* Accessible SVG risk gauge */
function RiskGauge({ score, level, stroke, animate }) {
  const circumference = 220;
  const dashoffset = circumference - (score / 100) * circumference;

  return (
    <svg width="100" height="58" viewBox="0 0 120 65"
         role="img"
         aria-label={`Risk score ${score} out of 100, ${level} risk`}>
      <path d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none" stroke="#243049" strokeWidth="8"
            strokeLinecap="round" />
      <path d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none" stroke={stroke} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={animate ? {
              animation: 'gauge-sweep 1s ease-out forwards',
            } : {}} />
      <text x="60" y="52" textAnchor="middle"
            fill="#e8ecf4" fontSize="22" fontWeight="700"
            fontFamily="Sora">
        {score}
      </text>
      <text x="60" y="63" textAnchor="middle"
            fill="#8896b3" fontSize="8">
        /100
      </text>
    </svg>
  );
}

/* ─── Redaction Section ───────────────────── */
function RedactionSection() {
  const original = `Dear Customer, Your SBI account will be
BLOCKED in 24 hours. Update KYC now:
http://sbi-kyc-update.xyz/verify

Your Aadhaar: 2341 8765 9012
Call: 9876543210
OTP: 847291`;

  const sanitized = `Dear Customer, Your SBI account will be
BLOCKED in 24 hours. Update KYC now:
[URL_1]

Your Aadhaar: [AADHAAR_REDACTED]
Call: [PHONE_REDACTED]
OTP: [OTP_REDACTED]`;

  return (
    <section className="py-16 sm:py-24 px-5">
      <div className="max-w-5xl mx-auto">
        <h2 className="display-md text-text mb-3 text-center">
          What you paste vs. what the AI sees
        </h2>
        <p className="text-text-muted text-center mb-10 max-w-xl mx-auto">
          Gemini only ever receives the right-hand side.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-surface border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-text-muted" />
              <span className="text-xs font-semibold text-text-muted
                              uppercase tracking-wider">
                Your original
              </span>
            </div>
            <pre className="text-sm text-text font-['Noto_Sans']
                           whitespace-pre-wrap leading-relaxed">
              {original}
            </pre>
          </div>

          <div className="rounded-xl bg-surface border border-emerald/20
                         p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-emerald" />
              <span className="text-xs font-semibold text-emerald
                              uppercase tracking-wider">
                What Gemini receives
              </span>
            </div>
            <pre className="text-sm text-text font-['Noto_Sans']
                           whitespace-pre-wrap leading-relaxed">
              <AnnotatedText text={sanitized} />
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: '1',
      title: 'Paste',
      desc: 'Drop any SMS, WhatsApp, email, or call transcript.',
      snippet: (
        <div className="rounded-lg bg-midnight border border-border
                       p-3 text-xs text-text-muted font-mono">
          <span className="text-text-dim">$</span>{' '}
          Paste message here...
        </div>
      ),
    },
    {
      num: '2',
      title: 'Preview redactions',
      desc: 'See exactly what gets removed before analysis.',
      snippet: (
        <div className="flex gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-saffron/15
                          text-saffron text-[11px] font-semibold">
            phone: 1
          </span>
          <span className="px-2 py-0.5 rounded bg-saffron/15
                          text-saffron text-[11px] font-semibold">
            aadhaar: 1
          </span>
          <span className="px-2 py-0.5 rounded bg-saffron/15
                          text-saffron text-[11px] font-semibold">
            otp: 1
          </span>
        </div>
      ),
    },
    {
      num: '3',
      title: 'Explainable score',
      desc: 'Every red flag backed by a quote from the actual text.',
      snippet: (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-risk-high" />
            <span className="text-xs text-text">
              Account block threat
            </span>
            <span className="text-[10px] text-text-muted">+25</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-saffron" />
            <span className="text-xs text-text">
              Suspicious URL
            </span>
            <span className="text-[10px] text-text-muted">+20</span>
          </div>
        </div>
      ),
    },
    {
      num: '4',
      title: 'Share a family alert',
      desc: 'Copy a warning in English, Telugu, or Hindi.',
      snippet: (
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-2 py-1
                            rounded bg-surface-2 border border-border
                            text-[11px] text-text-muted">
            <Copy className="w-3 h-3" /> Copy
          </button>
          <button className="flex items-center gap-1 px-2 py-1
                            rounded bg-green-700/20 border
                            border-green-700/30
                            text-[11px] text-green-400">
            <Share2 className="w-3 h-3" /> WhatsApp
          </button>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works"
             className="py-16 sm:py-24 px-5 bg-surface/40">
      <div className="max-w-5xl mx-auto">
        <h2 className="display-md text-text mb-12 text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
                       gap-6">
          {steps.map(s => (
            <div key={s.num} className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald/10
                            flex items-center justify-center
                            text-emerald font-['Sora'] font-bold
                            text-sm">
                {s.num}
              </div>
              <h3 className="font-['Sora'] font-semibold text-text">
                {s.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {s.desc}
              </p>
              <div className="pt-1">{s.snippet}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Explainable Report Preview ──────────── */
function ReportPreview() {
  const findings = [
    { label: 'Account block threat', weight: 25, max: 100 },
    { label: 'Suspicious URL (.xyz)', weight: 20, max: 100 },
    { label: 'Urgency (24 hours)', weight: 15, max: 100 },
    { label: 'Bank impersonation', weight: 12, max: 100 },
  ];

  return (
    <section className="py-16 sm:py-24 px-5">
      <div className="max-w-3xl mx-auto">
        <h2 className="display-md text-text mb-3 text-center">
          Explainable, not a black box
        </h2>
        <p className="text-text-muted text-center mb-10">
          Every risk factor shows its contribution and where
          it was found in the text.
        </p>

        <div className="rounded-xl bg-surface border border-border
                       p-5 sm:p-6 space-y-4">
          {/* Score header */}
          <div className="flex items-center justify-between">
            <span className="display-sm text-text">Score breakdown</span>
            <span className="risk-badge risk-high">
              <AlertTriangle className="w-3.5 h-3.5" />
              HIGH — 72/100
            </span>
          </div>

          {/* Score bars */}
          <div className="space-y-3 pt-2">
            {findings.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5
                                             text-risk-high" />
                    <span className="text-sm text-text">{f.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]
                                   bg-emerald/10 text-emerald
                                   font-semibold">
                      ✓ verified in text
                    </span>
                  </div>
                  <span className="text-xs text-text-muted
                                 font-mono">+{f.weight}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border">
                  <div className="h-full rounded-full bg-risk-high"
                       style={{ width: `${(f.weight / f.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Family Alert in 3 Languages ─────────── */
function FamilyAlertSection() {
  const [lang, setLang] = useState('en');
  const [copied, setCopied] = useState(false);

  const alerts = {
    en: '⚠️ Warning: A fake "KYC update" SMS is circulating. It threatens to block your bank account and asks for OTP. No bank sends KYC links by SMS. Do not click, do not share OTP. Call 1930 to report.',
    te: '⚠️ హెచ్చరిక: "KYC అప్‌డేట్" పేరుతో నకిలీ SMS వస్తోంది. మీ బ్యాంక్ ఖాతా బ్లాక్ అవుతుందని బెదిరిస్తుంది. ఏ బ్యాంకు SMS ద్వారా KYC లింక్‌లు పంపదు. క్లిక్ చేయకండి, OTP షేర్ చేయకండి. రిపోర్ట్ చేయడానికి 1930 కు కాల్ చేయండి.',
    hi: '⚠️ चेतावनी: "KYC अपडेट" के नाम पर फर्जी SMS आ रहा है। यह आपका बैंक अकाउंट ब्लॉक होने की धमकी देता है। कोई भी बैंक SMS से KYC लिंक नहीं भेजता। क्लिक न करें, OTP शेयर न करें। रिपोर्ट के लिए 1930 पर कॉल करें।',
  };

  const copyAlert = () => {
    navigator.clipboard.writeText(alerts[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-16 sm:py-24 px-5 bg-surface/40">
      <div className="max-w-2xl mx-auto">
        <h2 className="display-md text-text mb-3 text-center">
          Warn your family in their language
        </h2>
        <p className="text-text-muted text-center mb-8">
          Share a plain-language warning via WhatsApp or text.
        </p>

        {/* Language tabs */}
        <div className="flex justify-center gap-1 mb-4">
          {[
            { id: 'en', label: 'English' },
            { id: 'te', label: 'తెలుగు' },
            { id: 'hi', label: 'हिन्दी' },
          ].map(l => (
            <button key={l.id}
              onClick={() => setLang(l.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg
                transition-colors
                ${lang === l.id
                  ? 'bg-emerald/10 text-emerald border border-emerald/25'
                  : 'bg-surface border border-border text-text-muted hover:text-text'
                }`}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Alert card */}
        <div className="rounded-xl bg-surface border border-border
                       p-5">
          <p className="text-sm text-text leading-relaxed mb-4
                       font-['Noto_Sans']">
            {alerts[lang]}
          </p>
          <div className="flex gap-2">
            <button onClick={copyAlert}
              className="flex items-center gap-1.5 px-3 py-2
                        rounded-lg bg-surface-2 border border-border
                        text-xs text-text-muted hover:text-text
                        transition-colors font-medium">
              {copied
                ? <><Check className="w-3.5 h-3.5 text-emerald" /> Copied</>
                : <><Copy className="w-3.5 h-3.5" /> Copy</>
              }
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(alerts[lang])}`}
               target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 px-3 py-2
                         rounded-lg bg-green-700/15 border
                         border-green-700/25 text-xs text-green-400
                         font-medium hover:bg-green-700/25
                         transition-colors">
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Privacy Promise ─────────────────────── */
function PrivacyPromise() {
  const claims = [
    {
      icon: Lock,
      title: 'Redact before AI',
      desc: 'Aadhaar, PAN, phone, OTP, card numbers — all replaced with placeholders before anything reaches Gemini.',
    },
    {
      icon: Shield,
      title: 'Hash-only community radar',
      desc: 'Threat signals use SHA-256 fingerprints. No message text is stored or shared in the radar.',
    },
    {
      icon: Download,
      title: 'Export and delete anytime',
      desc: 'Download all your data as JSON. Delete your account and everything cascades immediately.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <h2 className="display-md text-text mb-10 text-center">
          Privacy promise
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {claims.map(c => (
            <div key={c.title} className="space-y-3">
              <c.icon className="w-8 h-8 text-emerald" />
              <h3 className="font-['Sora'] font-semibold text-text">
                {c.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Radar Teaser ────────────────────────── */
function RadarTeaser() {
  return (
    <section className="py-16 sm:py-24 px-5 bg-surface/40">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="display-md text-text mb-3">
          Community Threat Radar
        </h2>
        <p className="text-text-muted mb-6">
          Anonymous, aggregated threat patterns from opt-in users.
        </p>
        <div className="rounded-xl bg-surface border border-border
                       p-8 text-center">
          <Shield className="w-12 h-12 text-text-dim mx-auto mb-3
                            opacity-40" />
          <p className="text-text-muted text-sm">
            No community campaigns yet. Signals will appear here
            as users analyze messages with radar enabled.
          </p>
        </div>
        <Link to="/register"
          className="inline-flex items-center gap-1.5 mt-6
                     text-emerald hover:text-emerald-dim text-sm
                     font-medium transition-colors">
          Join the community
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────── */
function Footer() {
  return (
    <footer className="py-8 px-5 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row
                     items-center justify-between gap-3
                     text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald" />
          <span>KavachAI</span>
        </div>
        <p>
          KavachAI provides a heuristic risk assessment,
          not a guarantee.
        </p>
      </div>
    </footer>
  );
}
