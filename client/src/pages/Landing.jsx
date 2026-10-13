import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Brain, Users, Lock, ChevronRight, AlertTriangle, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { demoApi } from '../api/index.js';
import toast from 'react-hot-toast';

const SYNTHETIC_SAMPLES = [
  {
    label: '🔴 KYC Phishing SMS',
    text: 'Dear Customer, Your SBI account will be BLOCKED in 24 hours due to incomplete KYC. Update now: http://sbi-kyc-update.xyz/verify. Call 9876543210. -SBI Team',
    inputType: 'sms',
  },
  {
    label: '🔴 Digital Arrest Call',
    text: 'This is Inspector Sharma from CBI Cyber Crime. Your Aadhaar has been linked to money laundering. Stay on this video call. Do not tell anyone. Transfer Rs 50000 to the RBI safe account.',
    inputType: 'call_transcript',
  },
  {
    label: '🔴 UPI Collect Scam',
    text: 'Hi I accidentally sent Rs 5000 to your number. Please return it by approving this collect request. Enter your UPI PIN to send it back. My family urgently needs this.',
    inputType: 'whatsapp',
  },
  {
    label: '🟢 Bank Alert (Legit)',
    text: 'Rs 2,500.00 debited from A/c XX4523 on 15-Oct. UPI Ref: 428176234523. If not done by you, call 1800-111-1111 (bank toll-free). Never share OTP with anyone. -YourBank',
    inputType: 'sms',
  },
];

const FEATURES = [
  { icon: Eye, title: 'Privacy Guard', desc: 'Detects and redacts sensitive data before any AI analysis. You see what gets sent.' },
  { icon: Brain, title: 'Explainable AI', desc: 'Every red flag backed by evidence from the actual text. No black-box verdicts.' },
  { icon: Shield, title: 'Rule + AI Engine', desc: 'Deterministic rules ensure reliability. AI adds nuance within strict bounds.' },
  { icon: Lock, title: 'Your Data, Your Choice', desc: 'Opt-in history, export everything, delete anytime. No third-party trackers.' },
  { icon: Users, title: 'Community Radar', desc: 'Anonymous threat signals help everyone. Only hash-based aggregates, never raw data.' },
  { icon: Zap, title: 'Family Alerts', desc: 'Generate shareable warnings in English, Hindi, or Telugu to protect your family.' },
];

const SCAM_TYPES = [
  'UPI Payment Fraud', 'KYC Phishing', 'Digital Arrest', 'Job/Task Scams',
  'Investment Scams', 'Lottery/Prize Scams', 'Utility Disconnection', 'Remote Access Scams',
];

export default function Landing() {
  const [demoText, setDemoText] = useState('');
  const [demoResult, setDemoResult] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const runDemo = async (text, inputType = 'sms') => {
    if (text.length < 20) {
      toast.error('Text must be at least 20 characters');
      return;
    }
    setDemoLoading(true);
    setDemoResult(null);
    try {
      const { data } = await demoApi.analyze({ text, inputType });
      setDemoResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Demo analysis failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const riskColors = { low: 'text-risk-low', medium: 'text-risk-medium', high: 'text-risk-high', critical: 'text-risk-critical' };
  const riskBg = { low: 'risk-badge-low', medium: 'risk-badge-medium', high: 'risk-badge-high', critical: 'risk-badge-critical' };

  return (
    <div className="min-h-screen bg-kavach-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-kavach-emerald" />
            <span className="text-xl font-bold gradient-text">KavachAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-kavach-text-muted hover:text-kavach-text transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium bg-kavach-emerald hover:bg-kavach-emerald-dark text-white rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-kavach-emerald/10 border border-kavach-emerald/20 text-kavach-emerald text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            AI Security, Privacy & Trust
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Check before you
            <span className="gradient-text"> click, share, or pay</span>
          </h1>
          <p className="text-lg sm:text-xl text-kavach-text-muted max-w-2xl mx-auto mb-8">
            KavachAI defends you against digital fraud with explainable AI, privacy-first design, and real-time community threat intelligence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="px-8 py-3 bg-kavach-emerald hover:bg-kavach-emerald-dark text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-kavach-emerald/25 flex items-center gap-2">
              Start Protecting Yourself <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo" className="px-8 py-3 border border-kavach-border hover:border-kavach-emerald/50 text-kavach-text font-medium rounded-xl transition-colors">
              Try Demo
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">How KavachAI Protects You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Paste suspicious content', desc: 'Paste the SMS, WhatsApp message, email, or call transcript you want to verify.' },
              { step: '2', title: 'Privacy scan & preview', desc: 'KavachAI detects and redacts sensitive data locally. You see exactly what gets analyzed.' },
              { step: '3', title: 'Get explainable verdict', desc: 'Receive a detailed risk report with evidence-backed red flags and practical actions.' },
            ].map(item => (
              <div key={item.step} className="relative p-6 rounded-2xl bg-kavach-surface border border-kavach-border hover:border-kavach-emerald/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-kavach-emerald/10 flex items-center justify-center text-kavach-emerald font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-kavach-text-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 bg-kavach-surface/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Privacy-First Protection</h2>
          <p className="text-center text-kavach-text-muted mb-12 max-w-2xl mx-auto">
            Every feature designed with your privacy as the top priority.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 rounded-2xl bg-kavach-bg border border-kavach-border hover:border-kavach-emerald/20 transition-all duration-300 group">
                <f.icon className="w-10 h-10 text-kavach-emerald mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-kavach-text-muted text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scam types */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Scams We Detect</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {SCAM_TYPES.map(type => (
              <span key={type} className="px-4 py-2 rounded-full bg-kavach-surface border border-kavach-border text-sm text-kavach-text-muted hover:text-kavach-emerald hover:border-kavach-emerald/30 transition-colors cursor-default">
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section id="demo" className="py-16 px-4 sm:px-6 bg-kavach-surface/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Try It Now — No Login Required</h2>
          <p className="text-center text-kavach-text-muted mb-8">
            Paste a suspicious message or try one of our synthetic samples below. Rules-only analysis, no data saved.
          </p>

          {/* Sample buttons */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {SYNTHETIC_SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => { setDemoText(s.text); setDemoResult(null); }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-kavach-surface-2 border border-kavach-border hover:border-kavach-emerald/30 text-kavach-text-muted hover:text-kavach-text transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="relative mb-4">
            <textarea
              value={demoText}
              onChange={e => setDemoText(e.target.value)}
              placeholder="Paste a suspicious message here (20-1500 characters)..."
              rows={5}
              maxLength={1500}
              className="w-full p-4 bg-kavach-bg border border-kavach-border rounded-xl text-kavach-text placeholder-kavach-text-muted/50 focus:outline-none focus:border-kavach-emerald/50 resize-none"
            />
            <span className="absolute bottom-3 right-3 text-xs text-kavach-text-muted">
              {demoText.length}/1500
            </span>
          </div>

          <button
            onClick={() => runDemo(demoText)}
            disabled={demoLoading || demoText.length < 20}
            className="w-full py-3 bg-kavach-emerald hover:bg-kavach-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {demoLoading ? (
              <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> Analyzing...</>
            ) : (
              <><Shield className="w-5 h-5" /> Analyze Message</>
            )}
          </button>

          {/* Demo Result */}
          {demoResult && (
            <div className="mt-6 p-6 rounded-2xl bg-kavach-bg border border-kavach-border animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Analysis Result</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${riskBg[demoResult.riskLevel]}`}>
                  {demoResult.riskLevel.toUpperCase()} ({demoResult.finalScore}/100)
                </span>
              </div>

              {/* PII Summary */}
              {Object.keys(demoResult.piiSummary).length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-kavach-saffron/10 border border-kavach-saffron/20">
                  <p className="text-sm font-medium text-kavach-saffron flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Sensitive data detected and redacted:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(demoResult.piiSummary).map(([type, count]) => (
                      <span key={type} className="px-2 py-0.5 rounded bg-kavach-saffron/20 text-kavach-saffron text-xs font-medium">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rule findings */}
              {demoResult.ruleFindings && demoResult.ruleFindings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-kavach-text-muted mb-2">Risk Indicators</h4>
                  <div className="space-y-2">
                    {demoResult.ruleFindings.filter(f => f.weight > 0).map((f, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-kavach-surface-2">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${f.weight >= 20 ? 'text-kavach-red' : 'text-kavach-saffron'}`} />
                        <div>
                          <p className="text-sm font-medium text-kavach-text">{f.label} <span className="text-kavach-text-muted">(+{f.weight})</span></p>
                          <p className="text-xs text-kavach-text-muted mt-0.5">{f.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-kavach-text-muted mt-4 italic">{demoResult.disclaimer}</p>
              
              <div className="mt-4 pt-4 border-t border-kavach-border text-center">
                <Link to="/register" className="text-kavach-emerald hover:text-kavach-emerald-dark font-medium text-sm inline-flex items-center gap-1">
                  Register for AI-powered analysis with more features <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Protect Yourself & Your Family Today</h2>
          <p className="text-kavach-text-muted mb-8">Free to use. Your data stays yours. Always.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-kavach-emerald hover:bg-kavach-emerald-dark text-white font-bold text-lg rounded-xl transition-all hover:shadow-lg hover:shadow-kavach-emerald/25">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-kavach-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-kavach-text-muted">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-kavach-emerald" />
            <span>KavachAI — Privacy-First Scam Defense</span>
          </div>
          <p>KavachAI provides heuristic risk assessments, not guarantees.</p>
        </div>
      </footer>
    </div>
  );
}
