import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scanApi } from '../api/index.js';
import { Shield, AlertTriangle, Lock, ArrowLeft, Download, Copy, Check, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const riskBg = { low: 'risk-badge-low', medium: 'risk-badge-medium', high: 'risk-badge-high', critical: 'risk-badge-critical' };

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
      setFeedbackLabel(label);
      setFeedbackSent(true);
      toast.success('Feedback submitted, thank you!');
    } catch (err) {
      toast.error('Failed to submit feedback');
    }
  };

  const downloadReport = async () => {
    try {
      const { data } = await scanApi.getReport(id, 'json');
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kavachai-report-${id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const deleteScan = async () => {
    if (!confirm('Delete this scan? This action cannot be undone.')) return;
    try {
      await scanApi.deleteScan(id);
      toast.success('Scan deleted');
      navigate('/app/history');
    } catch { toast.error('Delete failed'); }
  };

  const copyAlert = (msg) => {
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-kavach-emerald" /></div>;
  if (!scan) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-kavach-text-muted hover:text-kavach-text text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={downloadReport} className="p-2 rounded-lg bg-kavach-surface border border-kavach-border text-kavach-text-muted hover:text-kavach-text transition-colors" title="Download Report">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={deleteScan} className="p-2 rounded-lg bg-kavach-surface border border-kavach-border text-kavach-text-muted hover:text-kavach-red transition-colors" title="Delete Scan">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Scan Report</h1>
            <p className="text-sm text-kavach-text-muted mt-1">{scan.mode.replace('_', ' ')} • {scan.input_type} • {new Date(scan.created_at).toLocaleString()}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${riskBg[scan.risk_level]}`}>
            {scan.risk_level.toUpperCase()} RISK — {scan.final_score}/100
          </span>
        </div>

        {/* Risk Gauge SVG */}
        <div className="flex justify-center mb-6">
          <svg width="160" height="90" viewBox="0 0 160 90" aria-label={`Risk score ${scan.final_score} out of 100`}>
            <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
            <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none"
              stroke={scan.final_score >= 70 ? '#ef4444' : scan.final_score >= 45 ? '#f97316' : scan.final_score >= 20 ? '#f59e0b' : '#10b981'}
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${(scan.final_score / 100) * 220} 220`}
              style={{ animation: 'gauge-fill 1s ease-out' }} />
            <text x="80" y="70" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">{scan.final_score}</text>
            <text x="80" y="85" textAnchor="middle" fill="#94a3b8" fontSize="10">/100</text>
          </svg>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-kavach-bg text-center">
            <p className="text-xl font-bold text-white">{scan.rule_score}</p>
            <p className="text-xs text-kavach-text-muted">Rule Score</p>
          </div>
          <div className="p-3 rounded-lg bg-kavach-bg text-center">
            <p className="text-xl font-bold text-white">{scan.ai_adjustment > 0 ? '+' : ''}{scan.ai_adjustment}</p>
            <p className="text-xs text-kavach-text-muted">AI Adjust</p>
          </div>
          <div className="p-3 rounded-lg bg-kavach-bg text-center">
            <p className="text-xs text-kavach-text-muted mb-1">Agreement</p>
            <span className={`text-sm font-semibold ${
              scan.agreement === 'agree' ? 'text-risk-low' :
              scan.agreement === 'partial' ? 'text-kavach-saffron' :
              scan.agreement === 'disagree' ? 'text-kavach-red' : 'text-kavach-text-muted'
            }`}>{scan.agreement === 'not_applicable' ? 'N/A' : scan.agreement}</span>
          </div>
        </div>

        {/* PII */}
        {scan.pii_summary && Object.keys(scan.pii_summary).length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-kavach-saffron/10 border border-kavach-saffron/20">
            <p className="text-sm font-medium text-kavach-saffron flex items-center gap-2"><Lock className="w-4 h-4" /> PII Redacted:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(scan.pii_summary).map(([t, c]) => <span key={t} className="px-2 py-0.5 rounded bg-kavach-saffron/20 text-kavach-saffron text-xs">{t}: {c}</span>)}
            </div>
          </div>
        )}

        {/* Rule findings */}
        {scan.rule_findings?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-kavach-text-muted mb-3 uppercase">Rule Findings</h3>
            <div className="space-y-2">
              {scan.rule_findings.filter(f => f.weight > 0).map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-kavach-bg">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${f.weight >= 25 ? 'text-kavach-red' : 'text-kavach-saffron'}`} />
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

        {/* AI Analysis */}
        {scan.ai_used && scan.ai_analysis && (
          <>
            {scan.ai_analysis.simple_explanation && (
              <div className="mb-4 p-4 rounded-lg bg-kavach-surface-2">
                <h3 className="text-sm font-semibold text-kavach-text-muted mb-2">AI Explanation</h3>
                <p className="text-sm text-kavach-text">{scan.ai_analysis.simple_explanation}</p>
              </div>
            )}

            {scan.ai_analysis.red_flags?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-kavach-text-muted mb-2">AI Red Flags (Grounded)</h3>
                {scan.ai_analysis.red_flags.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg bg-kavach-red/5 border border-kavach-red/10 mb-2">
                    <p className="text-sm font-medium text-kavach-text">{f.label}
                      {f.grounded && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-risk-low/20 text-risk-low rounded">✓ GROUNDED</span>}
                    </p>
                    <p className="text-xs text-kavach-text-muted italic mt-1">"{f.evidence_quote}"</p>
                  </div>
                ))}
              </div>
            )}

            {scan.ai_analysis.recommended_actions?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-kavach-text-muted mb-2">Actions</h3>
                {scan.ai_analysis.recommended_actions.map((a, i) => (
                  <p key={i} className="text-sm text-kavach-text mb-1">
                    <span className="inline-flex w-5 h-5 rounded-full bg-kavach-emerald/10 text-kavach-emerald text-xs items-center justify-center mr-2">{a.priority}</span>
                    {a.action}
                  </p>
                ))}
              </div>
            )}

            {scan.ai_analysis.do_not?.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-kavach-red/5 border border-kavach-red/10">
                <h3 className="text-sm font-semibold text-kavach-red mb-1">⛔ Do NOT</h3>
                {scan.ai_analysis.do_not.map((d, i) => <p key={i} className="text-sm text-kavach-text">• {d}</p>)}
              </div>
            )}

            {/* Family Alert */}
            {scan.ai_analysis.family_alert_message && (
              <div className="mb-4 p-4 rounded-lg bg-kavach-emerald/5 border border-kavach-emerald/20">
                <h3 className="text-sm font-semibold text-kavach-emerald mb-2">📢 Family Alert</h3>
                <p className="text-sm text-kavach-text mb-3">{scan.ai_analysis.family_alert_message}</p>
                <div className="flex gap-2">
                  <button onClick={() => copyAlert(scan.ai_analysis.family_alert_message)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kavach-surface border border-kavach-border text-xs text-kavach-text-muted hover:text-kavach-text">
                    {copied ? <Check className="w-3 h-3 text-risk-low" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(scan.ai_analysis.family_alert_message)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600/10 border border-green-600/20 text-xs text-green-400">
                    Share WhatsApp
                  </a>
                </div>
              </div>
            )}

            {scan.ai_analysis.limitations && (
              <div className="mb-4 p-3 rounded-lg bg-kavach-surface-2">
                <h3 className="text-sm font-semibold text-kavach-text-muted mb-1">Limitations</h3>
                <p className="text-xs text-kavach-text-muted">{scan.ai_analysis.limitations}</p>
              </div>
            )}
          </>
        )}

        {/* Feedback */}
        <div className="mt-6 pt-4 border-t border-kavach-border">
          <h3 className="text-sm font-semibold text-kavach-text-muted mb-3">Was this helpful? How would you classify this?</h3>
          <div className="flex gap-2">
            {['scam', 'legit', 'unsure'].map(label => (
              <button key={label} onClick={() => submitFeedback(label)} disabled={feedbackSent}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  feedbackLabel === label
                    ? label === 'scam' ? 'bg-kavach-red/20 text-kavach-red border border-kavach-red/30'
                    : label === 'legit' ? 'bg-risk-low/20 text-risk-low border border-risk-low/30'
                    : 'bg-kavach-saffron/20 text-kavach-saffron border border-kavach-saffron/30'
                    : 'bg-kavach-surface-2 border border-kavach-border text-kavach-text-muted hover:text-kavach-text'
                }`}>
                {label === 'scam' ? '🚨 Scam' : label === 'legit' ? '✅ Legit' : '🤷 Unsure'}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-kavach-text-muted mt-4 italic">KavachAI provides a heuristic risk assessment, not a guarantee.</p>
      </div>
    </div>
  );
}
