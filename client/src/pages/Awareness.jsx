import { useState, useEffect } from 'react';
import { drillsApi } from '../api/index.js';
import { Brain, CheckCircle, XCircle, ArrowRight, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Awareness() {
  const [scenario, setScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadNext = async () => {
    setResult(null); setLoading(true);
    try {
      const [s, st] = await Promise.all([drillsApi.getNext(), drillsApi.getStats()]);
      setScenario(s.data.data); setStats(st.data.data);
    } catch { toast.error('Failed to load scenario'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNext(); }, []);

  const answer = async (answeredScam) => {
    if (!scenario) return;
    try {
      const { data } = await drillsApi.submitAnswer(scenario.id, { answeredScam });
      setResult(data.data);
      const st = await drillsApi.getStats(); setStats(st.data.data);
    } catch { toast.error('Failed to submit'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="display-sm text-text">Awareness Lab</h1>
      <p className="text-text-muted text-sm">Spot the scam — practice with synthetic scenarios.</p>

      {stats && stats.totalAttempts > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <Trophy className="w-5 h-5 text-saffron mx-auto mb-1" />
            <p className="text-xl font-['Sora'] font-bold text-text">{stats.accuracy}%</p>
            <p className="text-xs text-text-muted">Accuracy</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-xl font-['Sora'] font-bold text-text">{stats.correctCount}</p>
            <p className="text-xs text-text-muted">Correct</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-xl font-['Sora'] font-bold text-text">{stats.totalAttempts}</p>
            <p className="text-xs text-text-muted">Attempted</p>
          </div>
        </div>
      )}

      {loading ? <div className="skeleton h-48 rounded-xl" />
      : !scenario ? (
        <div className="p-8 rounded-xl bg-surface border border-border text-center">
          <Trophy className="w-12 h-12 text-saffron mx-auto mb-3" />
          <h3 className="font-['Sora'] font-semibold text-text mb-2">All done!</h3>
          <p className="text-sm text-text-muted">Check back for new scenarios.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-surface border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue/15 text-blue">{scenario.channel}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface-2 text-text-muted">{'⭐'.repeat(scenario.difficulty)}</span>
          </div>
          <h3 className="font-['Sora'] font-semibold text-text mb-4">{scenario.title}</h3>
          <div className="p-4 rounded-lg bg-midnight border border-border font-['Noto_Sans'] text-sm text-text whitespace-pre-wrap mb-5 leading-relaxed">
            {scenario.message_text}
          </div>

          {!result ? (
            <div className="flex gap-3">
              <button onClick={() => answer(true)} className="flex-1 py-3 bg-red/8 border border-red/15 text-red font-semibold rounded-lg hover:bg-red/15 transition-colors text-sm">🚨 Scam</button>
              <button onClick={() => answer(false)} className="flex-1 py-3 bg-risk-low/8 border border-risk-low/15 text-risk-low font-semibold rounded-lg hover:bg-risk-low/15 transition-colors text-sm">✅ Legitimate</button>
            </div>
          ) : (
            <div>
              <div className={`p-4 rounded-lg mb-4 ${result.correct ? 'bg-risk-low/8 border border-risk-low/15' : 'bg-red/8 border border-red/15'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.correct ? <CheckCircle className="w-5 h-5 text-risk-low" /> : <XCircle className="w-5 h-5 text-red" />}
                  <span className={`font-bold ${result.correct ? 'text-risk-low' : 'text-red'}`}>{result.correct ? 'Correct!' : 'Incorrect'}</span>
                </div>
                <p className="text-sm text-text">This is <strong>{result.isScam ? 'a SCAM' : 'LEGITIMATE'}</strong>{result.scamCategory && ` (${result.scamCategory})`}.</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-2 mb-4">
                <p className="text-xs font-semibold text-text-muted mb-1">Explanation</p>
                <p className="text-sm text-text">{result.explanation}</p>
              </div>
              <button onClick={loadNext} className="w-full py-3 bg-emerald hover:bg-emerald-dim text-midnight font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
