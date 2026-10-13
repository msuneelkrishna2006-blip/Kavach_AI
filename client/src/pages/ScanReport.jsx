import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scanApi } from '../api/index.js';
import { AlertTriangle, Lock, ArrowLeft, Download, Copy,
         Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const riskBadge = { low: 'risk-low', medium: 'risk-medium',
                    high: 'risk-high', critical: 'risk-critical' };

export default function ScanReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackLabel, setFeedbackLabel] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    scanApi.getScan(id)
      .then(({ data }) => {
        setScan(data.data);
        if (data.data.feedback) {
          setFeedbackLabel(data.data.feedback.user_label);
          setFeedbackSent(true);
        }
      })
      .catch(() => { toast.error('Scan not found'); navigate('/app/history'); })
      .finally(() => setLoading(false));
  }, [id]);

  const submitFeedback = async (label) => {
    try {
      await scanApi.submitFeedback(id, { userLabel: label });
      setFeedbackLabel(label); setFeedbackSent(true);
      toast.success('Thank you for the feedback');
    } catch { toast.error('Feedback failed'); }
  };

  const downloadReport = async () => {
    try {
      const { data } = await scanApi.getReport(id, 'json');
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `kavachai-${id.slice(0, 8)}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const deleteScan = async () => {
    if (!confirm('Delete this scan?')) return;
    try { await scanApi.deleteScan(id); toast.success('Deleted'); navigate('/app/history'); }
    catch { toast.error('Delete failed'); }
  };

  const copyAlert = (msg) => {
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald" />
    </div>
  );
  if (!scan) return null;

  const positiveFindings = (scan.rule_findings || []).filter(f => f.weight > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={downloadReport} className="p-2 rounded-lg bg-surface border border-border text-text-muted hover:text-text" title="Download"><Download className="w-4 h-4" /></button>
          <button onClick={deleteScan} className="p-2 rounded-lg bg-surface border border-border text-text-muted hover:text-red" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-xl bg-surface border border-border p-5 sm:p-6 space-y-5 print:bg-white print:text-black">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="display-sm text-text">Scan report</h1>
            <p className="text-sm text-text-muted mt-1">
              {scan.mode.replace(/_/g, ' ')} · {scan.input_type} · {new Date(scan.created_at).toLocaleString()}
            </p>
          </div>
          <span className={`risk-badge ${riskBadge[scan.risk_level]}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            {scan.risk_level.toUpperCase()} — {scan.final_score}/100
          </span>
        </div>

        {/* Large risk gauge */}
        <div className="flex justify-center" aria-label={`Risk score ${scan.final_score} out of 100`}>
          <RiskGauge score={scan.final_score} level={scan.risk_level} />
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-midnight border border-border text-center">
            <p className="text-xl font-['Sora'] font-bold text-text">{scan.rule_score}</p>
            <p className="text-xs text-text-dim">Rule</p>
          </div>
          <div className="p-3 rounded-lg bg-midnight border border-border text-center">
            <p className="text-xl font-['Sora'] font-bold text-text">{scan.ai_adjustment > 0 ? '+' : ''}{scan.ai_adjustment}</p>
            <p className="text-xs text-text-dim">AI adjust</p>
          </div>
          <div className="p-3 rounded-lg bg-midnight border border-border text-center">
            <p className="text-xs text-text-dim mb-0.5">Agreement</p>
            <span className={`text-sm font-semibold ${
              scan.agreement === 'agree' ? 'text-risk-low' :
              scan.agreement === 'partial' ? 'text-saffron' :
              scan.agreement === 'disagree' ? 'text-red' : 'text-text-dim'
            }`}>{scan.agreement === 'not_applicable' ? 'N/A' : scan.agreement}</span>
          </div>
        </div>

        {/* PII */}
        {scan.pii_summary && Object.keys(scan.pii_summary).length > 0 && (
          <div className="p-3 rounded-lg bg-saffron/8 border border-saffron/15">
            <p className="text-sm font-medium text-saffron flex items-center gap-2"><Lock className="w-4 h-4" /> PII redacted</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {Object.entries(scan.pii_summary).map(([t, c]) => (
                <span key={t} className="px-2 py-0.5 rounded bg-saffron/15 text-saffron text-xs font-semibold">{t}: {c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Rule findings with bars */}
        {positiveFindings.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Risk indicators</h3>
            <div className="space-y-3">
              {positiveFindings.map((f, i) => (
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

        {/* AI analysis */}
        {scan.ai_used && scan.ai_analysis && (
          <>
            {scan.ai_analysis.simple_explanation && (
              <div className="p-4 rounded-lg bg-surface-2">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">AI explanation</h3>
                <p className="text-sm text-text">{scan.ai_analysis.simple_explanation}</p>
              </div>
            )}
            {scan.ai_analysis.red_flags?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">AI red flags</h3>
                {scan.ai_analysis.red_flags.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg bg-red/5 border border-red/10 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text">{f.label}</span>
                      {f.grounded && <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald/10 text-emerald font-semibold">✓ verified in text</span>}
                    </div>
                    <p className="text-xs text-text-muted italic">"{f.evidence_quote}"</p>
                  </div>
                ))}
              </div>
            )}
            {scan.ai_analysis.recommended_actions?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Actions</h3>
                {scan.ai_analysis.recommended_actions.map((a, i) => (
                  <p key={i} className="text-sm text-text mb-1">
                    <span className="inline-flex w-5 h-5 rounded-full bg-emerald/10 text-emerald text-xs items-center justify-center mr-2">{a.priority}</span>
                    {a.action}
                  </p>
                ))}
              </div>
            )}
            {scan.ai_analysis.do_not?.length > 0 && (
              <div className="p-3 rounded-lg bg-red/5 border border-red/10">
                <h3 className="text-sm font-semibold text-red mb-1">⛔ Do NOT</h3>
                {scan.ai_analysis.do_not.map((d, i) => <p key={i} className="text-sm text-text">• {d}</p>)}
              </div>
            )}
            {scan.ai_analysis.family_alert_message && (
              <div className="p-4 rounded-lg bg-emerald/5 border border-emerald/15">
                <h3 className="text-sm font-semibold text-emerald mb-2">📢 Family alert</h3>
                <p className="text-sm text-text mb-3">{scan.ai_analysis.family_alert_message}</p>
                <div className="flex gap-2">
                  <button onClick={() => copyAlert(scan.ai_analysis.family_alert_message)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-muted hover:text-text">
                    {copied ? <><Check className="w-3 h-3 text-emerald" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(scan.ai_analysis.family_alert_message)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-700/15 border border-green-700/25 text-xs text-green-400">WhatsApp</a>
                </div>
              </div>
            )}
          </>
        )}

        {/* Feedback */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Your feedback</h3>
          <div className="flex gap-2">
            {['scam', 'legit', 'unsure'].map(label => (
              <button key={label} onClick={() => submitFeedback(label)} disabled={feedbackSent}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border
                  ${feedbackLabel === label
                    ? label === 'scam' ? 'bg-red/12 text-red border-red/25'
                    : label === 'legit' ? 'bg-risk-low/12 text-risk-low border-risk-low/25'
                    : 'bg-saffron/12 text-saffron border-saffron/25'
                    : 'bg-surface-2 border-border text-text-muted hover:text-text'
                  }`}>
                {label === 'scam' ? '🚨 Scam' : label === 'legit' ? '✅ Legit' : '🤷 Unsure'}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-text-dim italic">
          KavachAI provides a heuristic risk assessment, not a guarantee.
        </p>
      </div>
    </div>
  );
}

function RiskGauge({ score, level }) {
  const stroke = { low: '#34d399', medium: '#f5a623', high: '#f97316', critical: '#ef4444' };
  const circumference = 220;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="160" height="90" viewBox="0 0 160 90" role="img"
         aria-label={`Risk score ${score} out of 100, ${level} risk`}>
      <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#243049" strokeWidth="10" strokeLinecap="round" />
      <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={stroke[level]} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ animation: 'gauge-sweep 1s ease-out forwards' }} />
      <text x="80" y="68" textAnchor="middle" fill="#e8ecf4" fontSize="28" fontWeight="700" fontFamily="Sora">{score}</text>
      <text x="80" y="83" textAnchor="middle" fill="#8896b3" fontSize="10">/100</text>
    </svg>
  );
}
