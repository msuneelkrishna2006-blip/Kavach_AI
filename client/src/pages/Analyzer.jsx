import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scanApi, urlApi } from '../api/index.js';
import {
  Shield, Search, Eye, AlertTriangle, Lock, Send, Globe,
  Sparkles, Copy, Check, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Modes ──────────────────────────────── */
const MODES = [
  { id: 'scam_check',      label: 'Scam Check',   icon: Shield,   desc: 'Analyze messages for scam indicators' },
  { id: 'ai_prompt_check', label: 'AI Safe-Share', icon: Sparkles, desc: 'Check text before sharing with AI' },
  { id: 'url_inspect',     label: 'URL Inspector', icon: Globe,    desc: 'Analyze URL structure (never visits)' },
];
const INPUT_TYPES = ['sms', 'whatsapp', 'email', 'call_transcript', 'url', 'other'];

/* ═══════════════════════════════════════════ */
export default function Analyzer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('scam_check');
  const [inputType, setInputType] = useState('sms');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState(user?.preferred_language || 'en');
  const [useAI, setUseAI] = useState(true);
  const [saveToHistory, setSaveToHistory] = useState(user?.store_history ?? true);
  const [saveSanitizedText, setSaveSanitizedText] = useState(true);
  const [contributeToRadar, setContributeToRadar] = useState(user?.contribute_to_radar ?? true);

  const [step, setStep] = useState(0);
  const [redactPreview, setRedactPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [urlResult, setUrlResult] = useState(null);

  /* ─── Handlers ──────────────────────────── */
  const handleScanPreview = async () => {
    if (mode === 'url_inspect') {
      setLoading(true);
      try {
        const { data } = await urlApi.inspect({ url: text });
        setUrlResult(data.data);
        setStep(2);
      } catch (err) {
        toast.error(err.response?.data?.error?.message || 'URL inspection failed');
      } finally { setLoading(false); }
      return;
    }
    if (text.trim().length < 20) {
      toast.error('Text must be at least 20 characters'); return;
    }
    setLoading(true);
    try {
      const { data } = await scanApi.redactPreview({ text: text.trim() });
      setRedactPreview(data.data);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Scan failed');
    } finally { setLoading(false); }
  };

  const handleFullAnalysis = async () => {
    setLoading(true);
    try {
      const { data } = await scanApi.analyze({
        mode, inputType, text: text.trim(), language, useAI,
        saveToHistory, saveSanitizedText, contributeToRadar,
      });
      setResult(data.data);
      setStep(2);
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Analysis failed');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setStep(0); setRedactPreview(null);
    setResult(null); setUrlResult(null);
  };

  const riskBadge = { low: 'risk-low', medium: 'risk-medium', high: 'risk-high', critical: 'risk-critical' };
  const riskVerdict = {
    low: '✓ Appears safe',
    medium: '⚠ Suspicious — verify independently',
    high: '⚠ Likely scam — do not engage',
    critical: '⛔ Dangerous — do not respond',
  };

  /* ═══════════════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="display-sm text-text">Analyze</h1>

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        {MODES.map(m => (
          <button key={m.id}
            onClick={() => { setMode(m.id); reset(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg
              text-sm font-medium transition-colors border
              ${mode === m.id
                ? 'bg-emerald/8 text-emerald border-emerald/25'
                : 'bg-surface border-border text-text-muted hover:text-text'
              }`}>
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>

      {/* Stepper — only for non-URL modes */}
      {mode !== 'url_inspect' && (
        <div className="flex items-center gap-3 text-sm">
          <StepDot num={1} label="Scan locally" active={step === 0} done={step > 0} />
          <div className={`flex-1 h-px ${step > 0 ? 'bg-emerald/40' : 'bg-border'}`} />
          <StepDot num={2} label="Full analysis" active={step === 1} done={step > 1} />
        </div>
      )}

      {/* ─── Step 0: Input ────────────────── */}
      {step === 0 && (
        <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
          {mode !== 'url_inspect' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Source</label>
                <select value={inputType} onChange={e => setInputType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-midnight border border-border rounded-lg text-text text-sm focus:outline-none focus:border-emerald/50">
                  {INPUT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-midnight border border-border rounded-lg text-text text-sm focus:outline-none focus:border-emerald/50">
                  <option value="en">English</option>
                  <option value="te">Telugu</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              {mode === 'url_inspect' ? 'URL to inspect' : 'Paste the message'}
            </label>
            <div className="relative">
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder={mode === 'url_inspect'
                  ? 'https://example.com/suspicious-page'
                  : 'Paste a suspicious message here (20–6000 characters)…'}
                rows={mode === 'url_inspect' ? 2 : 6} maxLength={6000}
                className="w-full p-4 bg-midnight border border-border rounded-xl text-text text-sm font-['Noto_Sans'] placeholder:text-text-dim focus:outline-none focus:border-emerald/50 resize-none" />
              {mode !== 'url_inspect' && (
                <span className="absolute bottom-3 right-3 text-xs text-text-dim">{text.length}/6000</span>
              )}
            </div>
          </div>

          {mode !== 'url_inspect' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ['AI analysis', useAI, setUseAI],
                ['Save to history', saveToHistory, setSaveToHistory],
                ['Save sanitized text', saveSanitizedText, setSaveSanitizedText],
                ['Contribute to Radar', contributeToRadar, setContributeToRadar],
              ].map(([label, val, set]) => (
                <label key={label} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                  <input type="checkbox" checked={val} onChange={e => set(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-emerald" />
                  {label}
                </label>
              ))}
            </div>
          )}

          <button onClick={handleScanPreview}
            disabled={loading || (mode === 'url_inspect' ? text.length < 10 : text.trim().length < 20)}
            className="w-full py-3 bg-emerald hover:bg-emerald-dim disabled:opacity-40 text-midnight font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
            {loading
              ? <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-midnight" /> Scanning…</>
              : <><Eye className="w-4 h-4" /> {mode === 'url_inspect' ? 'Inspect URL' : 'Step 1: Scan locally'}</>
            }
          </button>
        </div>
      )}

      {/* ─── Step 1: Redaction Preview ────── */}
      {step === 1 && redactPreview && (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface border border-border p-5">
            <h2 className="display-sm text-text mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-saffron" /> Privacy scan complete
            </h2>

            {/* PII chips */}
            {Object.keys(redactPreview.piiSummary || {}).length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-saffron/8 border border-saffron/15">
                <p className="text-xs font-semibold text-saffron uppercase tracking-wider mb-2">Sensitive data detected &amp; redacted</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(redactPreview.piiSummary).map(([type, count]) => (
                    <span key={type} className="px-2.5 py-1 rounded-md bg-saffron/15 text-saffron text-xs font-semibold border border-saffron/20">
                      <Lock className="w-3 h-3 inline mr-0.5" />{type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Your original</p>
                <div className="p-3 rounded-lg bg-midnight border border-border text-sm text-text font-['Noto_Sans'] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {text}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald uppercase tracking-wider mb-2">What AI receives</p>
                <div className="p-3 rounded-lg bg-emerald/5 border border-emerald/15 text-sm text-text font-['Noto_Sans'] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  <AnnotatedText text={redactPreview.sanitizedText} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)}
              className="flex-1 py-3 border border-border hover:bg-surface-2 text-text font-medium rounded-lg transition-colors text-sm">
              ← Edit
            </button>
            <button onClick={handleFullAnalysis} disabled={loading}
              className="flex-1 py-3 bg-emerald hover:bg-emerald-dim disabled:opacity-40 text-midnight font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
              {loading
                ? <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-midnight" /> Analyzing…</>
                : <><Send className="w-4 h-4" /> Step 2: Full analysis</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Result ───────────────── */}
      {step === 2 && (result || urlResult) && (
        <div className="space-y-4">
          {/* URL result */}
          {urlResult && <UrlResultCard data={urlResult} riskBadge={riskBadge} />}

          {/* Scan result */}
          {result && (
            <div className="rounded-xl bg-surface border border-border p-5 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="display-sm text-text">Analysis report</h2>
                <span className={`risk-badge ${riskBadge[result.riskLevel]}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {result.riskLevel.toUpperCase()} — {result.finalScore}/100
                </span>
              </div>

              {/* Verdict */}
              <p className={`text-sm font-semibold ${
                result.finalScore >= 45 ? 'text-risk-high' : result.finalScore >= 20 ? 'text-saffron' : 'text-risk-low'
              }`}>{riskVerdict[result.riskLevel]}</p>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <ScoreBox label="Rule score" value={result.ruleScore} />
                <ScoreBox label="AI adjust" value={result.aiAdjustment > 0 ? `+${result.aiAdjustment}` : result.aiAdjustment} />
                <ScoreBox label="Final" value={result.finalScore}
                  accent={result.finalScore >= 45 ? 'text-risk-high' : result.finalScore >= 20 ? 'text-saffron' : 'text-risk-low'} />
              </div>

              {/* Rule findings with bars */}
              {result.ruleFindings?.filter(f => f.weight > 0).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Risk indicators</h3>
                  <div className="space-y-3">
                    {result.ruleFindings.filter(f => f.weight > 0).map((f, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-3.5 h-3.5 ${f.weight >= 25 ? 'text-red' : 'text-saffron'}`} />
                            <span className="text-sm text-text">{f.label}</span>
                          </div>
                          <span className="text-xs text-text-muted font-mono">+{f.weight}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border">
                          <div className={`h-full rounded-full ${f.weight >= 25 ? 'bg-red' : 'bg-saffron'}`}
                            style={{ width: `${Math.min((f.weight / 30) * 100, 100)}%` }} />
                        </div>
                        <p className="text-xs text-text-dim mt-0.5">{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI red flags */}
              {result.aiAnalysis?.red_flags?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">AI red flags</h3>
                  {result.aiAnalysis.red_flags.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg bg-red/5 border border-red/10 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text">{f.label}</span>
                        {f.grounded && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald/10 text-emerald font-semibold">✓ verified in text</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted italic">"{f.evidence_quote}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {result.aiAnalysis?.recommended_actions?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Recommended actions</h3>
                  {result.aiAnalysis.recommended_actions.map((a, i) => (
                    <p key={i} className="text-sm text-text mb-1">
                      <span className="inline-flex w-5 h-5 rounded-full bg-emerald/10 text-emerald text-xs items-center justify-center mr-2">{a.priority}</span>
                      {a.action}
                    </p>
                  ))}
                </div>
              )}

              {/* Family alert */}
              {result.aiAnalysis?.family_alert_message && (
                <FamilyAlert message={result.aiAnalysis.family_alert_message} />
              )}

              <p className="text-xs text-text-dim italic">{result.disclaimer}</p>

              {result.scanId && (
                <div className="pt-3 border-t border-border">
                  <button onClick={() => navigate(`/app/scans/${result.scanId}`)}
                    className="px-4 py-2 text-sm bg-emerald/8 text-emerald border border-emerald/20 rounded-lg hover:bg-emerald/15 transition-colors">
                    View full report →
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={reset}
            className="w-full py-3 border border-border hover:bg-surface text-text font-medium rounded-lg transition-colors text-sm">
            ← Analyze another message
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────── */
function StepDot({ num, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors
        ${done ? 'bg-emerald/15 border-emerald/30 text-emerald'
          : active ? 'bg-emerald/10 border-emerald/40 text-emerald'
          : 'bg-surface border-border text-text-dim'}`}>
        {done ? <Check className="w-3.5 h-3.5" /> : num}
      </div>
      <span className={`text-xs font-medium hidden sm:inline ${active || done ? 'text-emerald' : 'text-text-dim'}`}>{label}</span>
    </div>
  );
}

function ScoreBox({ label, value, accent }) {
  return (
    <div className="p-3 rounded-lg bg-midnight border border-border text-center">
      <p className={`text-xl font-['Sora'] font-bold ${accent || 'text-text'}`}>{value}</p>
      <p className="text-xs text-text-dim">{label}</p>
    </div>
  );
}

function AnnotatedText({ text }) {
  const parts = text.split(/(\[[A-Z_0-9]+\])/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        /^\[.*\]$/.test(p) ? (
          <span key={i} className="inline-flex items-center gap-0.5 px-1 py-0.5 mx-0.5 rounded bg-saffron/20 text-saffron text-[11px] font-semibold align-baseline">
            <Lock className="w-2.5 h-2.5" />{p}
          </span>
        ) : <span key={i}>{p}</span>
      )}
    </span>
  );
}

function FamilyAlert({ message }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="p-4 rounded-lg bg-emerald/5 border border-emerald/15">
      <h3 className="text-sm font-semibold text-emerald mb-2">📢 Family alert</h3>
      <p className="text-sm text-text mb-3">{message}</p>
      <div className="flex gap-2">
        <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-muted hover:text-text transition-colors">
          {copied ? <><Check className="w-3 h-3 text-emerald" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700/15 border border-green-700/25 text-xs text-green-400">
          WhatsApp
        </a>
      </div>
    </div>
  );
}

function UrlResultCard({ data, riskBadge }) {
  return (
    <div className="rounded-xl bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="display-sm text-text">URL inspection</h2>
        <span className={`risk-badge ${riskBadge[data.riskLevel]}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {data.riskLevel?.toUpperCase()} — {data.riskScore}/100
        </span>
      </div>
      <p className="text-sm text-text-muted font-mono mb-4">{data.defanged}</p>
      {data.findings?.length > 0 ? (
        <div className="space-y-2">
          {data.findings.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-midnight">
              <AlertTriangle className={`w-4 h-4 mt-0.5 ${f.severity === 'critical' ? 'text-red' : 'text-saffron'}`} />
              <div>
                <p className="text-sm font-medium text-text">{f.label}</p>
                <p className="text-xs text-text-muted">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No suspicious indicators found.</p>
      )}
      <p className="text-xs text-text-dim mt-4 italic">{data.disclaimer}</p>
    </div>
  );
}
