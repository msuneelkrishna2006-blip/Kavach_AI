import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scanApi, urlApi } from '../api/index.js';
import { Shield, Search, Eye, AlertTriangle, Lock, Send, Globe, Sparkles, ChevronRight, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const MODES = [
  { id: 'scam_check', label: 'Scam Check', icon: Shield, desc: 'Analyze messages for scam indicators' },
  { id: 'ai_prompt_check', label: 'AI Safe-Share', icon: Sparkles, desc: 'Check text before sharing with AI' },
  { id: 'url_inspect', label: 'URL Inspector', icon: Globe, desc: 'Analyze URL structure (never visits)' },
];

const INPUT_TYPES = ['sms', 'whatsapp', 'email', 'call_transcript', 'url', 'other'];

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

  // State
  const [step, setStep] = useState(0); // 0: input, 1: preview, 2: result
  const [redactPreview, setRedactPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [urlResult, setUrlResult] = useState(null);

  const handleScanPreview = async () => {
    if (mode === 'url_inspect') {
      setLoading(true);
      try {
        const { data } = await urlApi.inspect({ url: text });
        setUrlResult(data.data);
        setStep(2);
      } catch (err) {
        toast.error(err.response?.data?.error?.message || 'URL inspection failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (text.trim().length < 20) {
      toast.error('Text must be at least 20 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await scanApi.redactPreview({ text: text.trim() });
      setRedactPreview(data.data);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Redaction preview failed');
    } finally {
      setLoading(false);
    }
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
      if (data.data.scanId) {
        toast.success('Analysis complete! Scan saved.');
      } else {
        toast.success('Analysis complete!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setStep(0); setRedactPreview(null); setResult(null); setUrlResult(null); };

  const riskBg = { low: 'risk-badge-low', medium: 'risk-badge-medium', high: 'risk-badge-high', critical: 'risk-badge-critical' };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Scam Analyzer</h1>

      {/* Mode switch */}
      <div className="flex flex-wrap gap-2">
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); resetForm(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === m.id ? 'bg-kavach-emerald/10 text-kavach-emerald border border-kavach-emerald/30' : 'bg-kavach-surface border border-kavach-border text-kavach-text-muted hover:text-kavach-text'
            }`}>
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>

      {/* Step 0: Input */}
      {step === 0 && (
        <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border space-y-4">
          {mode !== 'url_inspect' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-kavach-text mb-1.5">Input Type</label>
                <select value={inputType} onChange={e => setInputType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text focus:outline-none focus:border-kavach-emerald/50">
                  {INPUT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-kavach-text mb-1.5">Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text focus:outline-none focus:border-kavach-emerald/50">
                  <option value="en">English</option>
                  <option value="te">Telugu</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-kavach-text mb-1.5">
              {mode === 'url_inspect' ? 'URL to Inspect' : 'Suspicious Content'}
            </label>
            <div className="relative">
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder={mode === 'url_inspect' ? 'https://example.com/suspicious-page' : 'Paste the suspicious message here (20-6000 characters)...'}
                rows={mode === 'url_inspect' ? 2 : 6} maxLength={6000}
                className="w-full p-4 bg-kavach-bg border border-kavach-border rounded-xl text-kavach-text placeholder-kavach-text-muted/50 focus:outline-none focus:border-kavach-emerald/50 resize-none font-mono text-sm" />
              {mode !== 'url_inspect' && (
                <span className="absolute bottom-3 right-3 text-xs text-kavach-text-muted">{text.length}/6000</span>
              )}
            </div>
          </div>

          {mode !== 'url_inspect' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm text-kavach-text-muted cursor-pointer">
                <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
                  className="w-4 h-4 rounded border-kavach-border text-kavach-emerald focus:ring-kavach-emerald" />
                Use AI analysis
              </label>
              <label className="flex items-center gap-2 text-sm text-kavach-text-muted cursor-pointer">
                <input type="checkbox" checked={saveToHistory} onChange={e => setSaveToHistory(e.target.checked)}
                  className="w-4 h-4 rounded border-kavach-border text-kavach-emerald focus:ring-kavach-emerald" />
                Save to history
              </label>
              <label className="flex items-center gap-2 text-sm text-kavach-text-muted cursor-pointer">
                <input type="checkbox" checked={saveSanitizedText} onChange={e => setSaveSanitizedText(e.target.checked)}
                  className="w-4 h-4 rounded border-kavach-border text-kavach-emerald focus:ring-kavach-emerald" />
                Save sanitized text
              </label>
              <label className="flex items-center gap-2 text-sm text-kavach-text-muted cursor-pointer">
                <input type="checkbox" checked={contributeToRadar} onChange={e => setContributeToRadar(e.target.checked)}
                  className="w-4 h-4 rounded border-kavach-border text-kavach-emerald focus:ring-kavach-emerald" />
                Contribute to Threat Radar
              </label>
            </div>
          )}

          <button onClick={handleScanPreview} disabled={loading || (mode === 'url_inspect' ? text.length < 10 : text.trim().length < 20)}
            className="w-full py-3 bg-kavach-emerald hover:bg-kavach-emerald-dark disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" /> Scanning...</>
              : <><Eye className="w-5 h-5" /> {mode === 'url_inspect' ? 'Inspect URL' : 'Step 1: Scan & Preview'}</>}
          </button>
        </div>
      )}

      {/* Step 1: Redaction Preview */}
      {step === 1 && redactPreview && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-kavach-saffron" /> Privacy Scan Complete
            </h2>

            {Object.keys(redactPreview.piiSummary).length > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-kavach-saffron/10 border border-kavach-saffron/20">
                <p className="text-sm font-semibold text-kavach-saffron mb-2">Sensitive Data Detected & Redacted:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(redactPreview.piiSummary).map(([type, count]) => (
                    <span key={type} className="px-3 py-1 rounded-full bg-kavach-saffron/20 text-kavach-saffron text-xs font-semibold">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(redactPreview.iocSummary).length > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-kavach-blue/10 border border-kavach-blue/20">
                <p className="text-sm font-semibold text-kavach-blue mb-2">Indicators Pseudonymized:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(redactPreview.iocSummary).map(([type, count]) => (
                    <span key={type} className="px-3 py-1 rounded-full bg-kavach-blue/20 text-kavach-blue text-xs font-semibold">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs font-semibold text-kavach-text-muted mb-2 uppercase">Original Text</p>
                <div className="p-3 rounded-lg bg-kavach-bg border border-kavach-border text-sm text-kavach-text font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {text}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-kavach-emerald mb-2 uppercase">Sanitized (what AI sees)</p>
                <div className="p-3 rounded-lg bg-kavach-emerald/5 border border-kavach-emerald/20 text-sm text-kavach-text font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {redactPreview.sanitizedText}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)}
              className="flex-1 py-3 border border-kavach-border hover:bg-kavach-surface-2 text-kavach-text font-medium rounded-xl transition-colors">
              ← Back to Edit
            </button>
            <button onClick={handleFullAnalysis} disabled={loading}
              className="flex-1 py-3 bg-kavach-emerald hover:bg-kavach-emerald-dark disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" /> Analyzing...</>
                : <><Send className="w-5 h-5" /> Step 2: Run Full Analysis</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Result */}
      {step === 2 && (result || urlResult) && (
        <div className="space-y-4 animate-fade-in">
          {/* URL Result */}
          {urlResult && (
            <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">URL Inspection Result</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${riskBg[urlResult.riskLevel]}`}>
                  {urlResult.riskLevel?.toUpperCase()} ({urlResult.riskScore}/100)
                </span>
              </div>
              <p className="text-sm text-kavach-text-muted mb-4 font-mono">{urlResult.defanged}</p>
              {urlResult.findings?.length > 0 ? (
                <div className="space-y-2">
                  {urlResult.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-kavach-bg">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 ${f.severity === 'critical' ? 'text-kavach-red' : f.severity === 'high' ? 'text-risk-high' : 'text-kavach-saffron'}`} />
                      <div>
                        <p className="text-sm font-medium text-kavach-text">{f.label}</p>
                        <p className="text-xs text-kavach-text-muted">{f.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-kavach-text-muted">No suspicious indicators found in URL structure.</p>
              )}
              <p className="text-xs text-kavach-text-muted mt-4 italic">{urlResult.disclaimer}</p>
            </div>
          )}

          {/* Scan Result */}
          {result && (
            <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Analysis Report</h2>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${riskBg[result.riskLevel]}`}>
                  {result.riskLevel.toUpperCase()} RISK — {result.finalScore}/100
                </span>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-kavach-bg text-center">
                  <p className="text-2xl font-bold text-white">{result.ruleScore}</p>
                  <p className="text-xs text-kavach-text-muted">Rule Score</p>
                </div>
                <div className="p-3 rounded-lg bg-kavach-bg text-center">
                  <p className="text-2xl font-bold text-white">{result.aiAdjustment > 0 ? '+' : ''}{result.aiAdjustment}</p>
                  <p className="text-xs text-kavach-text-muted">AI Adjustment</p>
                </div>
                <div className="p-3 rounded-lg bg-kavach-bg text-center">
                  <p className={`text-2xl font-bold ${result.finalScore >= 45 ? 'text-kavach-red' : result.finalScore >= 20 ? 'text-kavach-saffron' : 'text-risk-low'}`}>{result.finalScore}</p>
                  <p className="text-xs text-kavach-text-muted">Final Score</p>
                </div>
              </div>

              {/* Agreement */}
              {result.aiUsed && (
                <div className={`p-3 rounded-lg mb-4 text-sm ${
                  result.agreement === 'agree' ? 'bg-risk-low/10 text-risk-low' :
                  result.agreement === 'partial' ? 'bg-kavach-saffron/10 text-kavach-saffron' :
                  result.agreement === 'disagree' ? 'bg-kavach-red/10 text-kavach-red' : 'bg-kavach-surface-2 text-kavach-text-muted'
                }`}>
                  <strong>Agreement:</strong> {result.agreement === 'agree' ? '✓ Rules and AI agree' :
                    result.agreement === 'partial' ? '~ Partial agreement — exercise caution' :
                    result.agreement === 'disagree' ? '✗ Rules and AI disagree — exercise extra caution' : 'AI not used'}
                </div>
              )}

              {!result.aiUsed && (
                <div className="p-3 rounded-lg mb-4 bg-kavach-surface-2 text-kavach-text-muted text-sm">
                  ℹ️ AI analysis not used. Showing rule-based assessment only.
                </div>
              )}

              {/* Rule findings */}
              {result.ruleFindings?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-kavach-text-muted mb-3 uppercase">Risk Indicators</h3>
                  <div className="space-y-2">
                    {result.ruleFindings.filter(f => f.weight > 0).map((f, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-kavach-bg">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${f.weight >= 25 ? 'text-kavach-red' : f.weight >= 15 ? 'text-risk-high' : 'text-kavach-saffron'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-kavach-text">{f.label}</p>
                            <span className="text-xs text-kavach-text-muted">+{f.weight}</span>
                          </div>
                          <p className="text-xs text-kavach-text-muted mt-0.5">{f.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Red Flags */}
              {result.aiAnalysis?.red_flags?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-kavach-text-muted mb-3 uppercase">AI-Detected Red Flags</h3>
                  <div className="space-y-2">
                    {result.aiAnalysis.red_flags.map((f, i) => (
                      <div key={i} className="p-3 rounded-lg bg-kavach-red/5 border border-kavach-red/10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-kavach-text">{f.label}</span>
                          {f.grounded && <span className="px-1.5 py-0.5 rounded text-[10px] bg-risk-low/20 text-risk-low font-semibold">GROUNDED</span>}
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-kavach-purple/20 text-kavach-purple font-semibold">{f.tactic}</span>
                        </div>
                        <p className="text-xs text-kavach-text-muted italic">"{f.evidence_quote}"</p>
                        <p className="text-xs text-kavach-text-muted mt-1">{f.why_it_matters}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {result.aiAnalysis?.simple_explanation && (
                <div className="mb-6 p-4 rounded-lg bg-kavach-surface-2">
                  <h3 className="text-sm font-semibold text-kavach-text-muted mb-2">Explanation</h3>
                  <p className="text-sm text-kavach-text">{result.aiAnalysis.simple_explanation}</p>
                </div>
              )}

              {/* Actions */}
              {result.aiAnalysis?.recommended_actions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-kavach-text-muted mb-2">Recommended Actions</h3>
                  <div className="space-y-1">
                    {result.aiAnalysis.recommended_actions.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-kavach-text">
                        <span className="w-5 h-5 rounded-full bg-kavach-emerald/10 text-kavach-emerald text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{a.priority}</span>
                        {a.action}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Do Not */}
              {result.aiAnalysis?.do_not?.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-kavach-red/5 border border-kavach-red/10">
                  <h3 className="text-sm font-semibold text-kavach-red mb-2">⛔ Do NOT</h3>
                  <ul className="space-y-1 text-sm text-kavach-text">
                    {result.aiAnalysis.do_not.map((d, i) => <li key={i}>• {d}</li>)}
                  </ul>
                </div>
              )}

              {/* Family Alert */}
              {result.aiAnalysis?.family_alert_message && (
                <FamilyAlert message={result.aiAnalysis.family_alert_message} />
              )}

              {/* Disclaimer */}
              <p className="text-xs text-kavach-text-muted mt-4 italic">{result.disclaimer}</p>

              {/* Navigate to full report if saved */}
              {result.scanId && (
                <div className="mt-4 pt-4 border-t border-kavach-border flex gap-3">
                  <button onClick={() => navigate(`/app/scans/${result.scanId}`)}
                    className="px-4 py-2 text-sm bg-kavach-emerald/10 text-kavach-emerald border border-kavach-emerald/20 rounded-lg hover:bg-kavach-emerald/20 transition-colors">
                    View Full Report →
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={resetForm}
            className="w-full py-3 border border-kavach-border hover:bg-kavach-surface text-kavach-text font-medium rounded-xl transition-colors">
            ← Analyze Another Message
          </button>
        </div>
      )}
    </div>
  );
}

function FamilyAlert({ message }) {
  const [copied, setCopied] = useState(false);

  const copyAlert = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-4 rounded-lg bg-kavach-emerald/5 border border-kavach-emerald/20">
      <h3 className="text-sm font-semibold text-kavach-emerald mb-2">📢 Family Alert</h3>
      <p className="text-sm text-kavach-text mb-3">{message}</p>
      <div className="flex gap-2">
        <button onClick={copyAlert}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-kavach-surface border border-kavach-border text-xs text-kavach-text-muted hover:text-kavach-text transition-colors">
          {copied ? <Check className="w-3 h-3 text-risk-low" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={shareWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/10 border border-green-600/20 text-xs text-green-400 hover:bg-green-600/20 transition-colors">
          Share via WhatsApp
        </button>
      </div>
    </div>
  );
}
