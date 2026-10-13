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
    setResult(null);
    setLoading(true);
    try {
      const [scenarioRes, statsRes] = await Promise.all([
        drillsApi.getNext(),
        drillsApi.getStats(),
      ]);
      setScenario(scenarioRes.data.data);
      setStats(statsRes.data.data);
    } catch { toast.error('Failed to load scenario'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNext(); }, []);

  const answer = async (answeredScam) => {
    if (!scenario) return;
    try {
      const { data } = await drillsApi.submitAnswer(scenario.id, { answeredScam });
      setResult(data.data);
      const statsRes = await drillsApi.getStats();
      setStats(statsRes.data.data);
    } catch { toast.error('Failed to submit answer'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Brain className="w-6 h-6" /> Awareness Lab</h1>
      <p className="text-kavach-text-muted">Spot the scam! Practice identifying real vs. fake messages using synthetic scenarios.</p>

      {/* Stats */}
      {stats && stats.totalAttempts > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-kavach-surface border border-kavach-border text-center">
            <Trophy className="w-6 h-6 text-kavach-saffron mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{stats.accuracy}%</p>
            <p className="text-xs text-kavach-text-muted">Accuracy</p>
          </div>
          <div className="p-4 rounded-xl bg-kavach-surface border border-kavach-border text-center">
            <p className="text-xl font-bold text-white">{stats.correctCount}</p>
            <p className="text-xs text-kavach-text-muted">Correct</p>
          </div>
          <div className="p-4 rounded-xl bg-kavach-surface border border-kavach-border text-center">
            <p className="text-xl font-bold text-white">{stats.totalAttempts}</p>
            <p className="text-xs text-kavach-text-muted">Attempted</p>
          </div>
        </div>
      )}

      {/* Scenario */}
      {loading ? (
        <div className="h-48 bg-kavach-surface rounded-xl animate-pulse" />
      ) : !scenario ? (
        <div className="p-8 rounded-2xl bg-kavach-surface border border-kavach-border text-center">
          <Trophy className="w-16 h-16 text-kavach-saffron mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">All scenarios completed!</h3>
          <p className="text-kavach-text-muted">Great job! Check back later for new scenarios.</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-kavach-blue/20 text-kavach-blue">{scenario.channel}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-kavach-surface-2 text-kavach-text-muted">
              Difficulty: {'⭐'.repeat(scenario.difficulty)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-4">{scenario.title}</h3>
          <div className="p-4 rounded-lg bg-kavach-bg border border-kavach-border font-mono text-sm text-kavach-text whitespace-pre-wrap mb-6">
            {scenario.message_text}
          </div>

          {!result ? (
            <div className="flex gap-3">
              <button onClick={() => answer(true)} className="flex-1 py-3 bg-kavach-red/10 border border-kavach-red/20 text-kavach-red font-semibold rounded-xl hover:bg-kavach-red/20 transition-colors">
                🚨 This is a Scam
              </button>
              <button onClick={() => answer(false)} className="flex-1 py-3 bg-risk-low/10 border border-risk-low/20 text-risk-low font-semibold rounded-xl hover:bg-risk-low/20 transition-colors">
                ✅ This is Legitimate
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className={`p-4 rounded-lg mb-4 ${result.correct ? 'bg-risk-low/10 border border-risk-low/20' : 'bg-kavach-red/10 border border-kavach-red/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.correct ? <CheckCircle className="w-5 h-5 text-risk-low" /> : <XCircle className="w-5 h-5 text-kavach-red" />}
                  <span className={`font-bold ${result.correct ? 'text-risk-low' : 'text-kavach-red'}`}>
                    {result.correct ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-kavach-text">
                  This message is <strong>{result.isScam ? 'a SCAM' : 'LEGITIMATE'}</strong>
                  {result.scamCategory && ` (${result.scamCategory})`}.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-kavach-surface-2 mb-4">
                <h4 className="text-sm font-semibold text-kavach-text-muted mb-1">Explanation</h4>
                <p className="text-sm text-kavach-text">{result.explanation}</p>
              </div>
              <button onClick={loadNext} className="w-full py-3 bg-kavach-emerald hover:bg-kavach-emerald-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                Next Scenario <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
