/**
 * Scoring module: Noisy-OR scoring with floor rules and explainable breakdown.
 * score = round(100 × (1 − Π(1 − wᵢ/100))) for positive rules
 * then apply mitigation, clamp 0-100, apply floor rules.
 */

/**
 * Calculate the noisy-OR score and provide a per-rule breakdown.
 * @param {Array} findings - Rule findings from evaluateRules()
 * @returns {{ score: number, breakdown: Array, riskLevel: string }}
 */
export function calculateScore(findings) {
  const positiveFindings = findings.filter(f => !f.isMitigation && f.weight > 0);
  const mitigationFindings = findings.filter(f => f.isMitigation || f.weight < 0);

  // Noisy-OR for positive rules
  let product = 1;
  const breakdown = [];

  for (const finding of positiveFindings) {
    const contribution = finding.weight / 100;
    product *= (1 - contribution);
    breakdown.push({
      id: finding.id,
      label: finding.label,
      weight: finding.weight,
      evidenceSnippet: finding.evidenceSnippet,
      explanation: finding.explanation,
    });
  }

  let score = Math.round(100 * (1 - product));

  // Apply mitigation
  let mitigationTotal = 0;
  for (const finding of mitigationFindings) {
    mitigationTotal += Math.abs(finding.weight);
    breakdown.push({
      id: finding.id,
      label: finding.label,
      weight: finding.weight,
      evidenceSnippet: finding.evidenceSnippet,
      explanation: finding.explanation,
    });
  }
  score = Math.max(0, score - mitigationTotal);

  // Floor rules
  const findingIds = new Set(positiveFindings.map(f => f.id));
  
  // CRED-01 + any URL rule → min 60
  if (findingIds.has('CRED-01') && ['URL-01', 'URL-02', 'URL-03', 'URL-04'].some(id => findingIds.has(id))) {
    score = Math.max(score, 60);
  }
  // ARR-01 → min 60
  if (findingIds.has('ARR-01')) {
    score = Math.max(score, 60);
  }
  // REM-01 → min 60
  if (findingIds.has('REM-01')) {
    score = Math.max(score, 60);
  }

  // Clamp 0-100
  score = Math.min(100, Math.max(0, score));

  // Determine risk level
  let riskLevel;
  if (score >= 70) riskLevel = 'critical';
  else if (score >= 45) riskLevel = 'high';
  else if (score >= 20) riskLevel = 'medium';
  else riskLevel = 'low';

  return { score, breakdown, riskLevel };
}

/**
 * Compute final score with AI adjustment.
 * @param {number} ruleScore
 * @param {number} aiAdjustment - Must be between -15 and 15
 * @returns {{ finalScore: number, riskLevel: string }}
 */
export function computeFinalScore(ruleScore, aiAdjustment = 0) {
  const clampedAdjustment = Math.min(15, Math.max(-15, aiAdjustment));
  const finalScore = Math.min(100, Math.max(0, ruleScore + clampedAdjustment));

  let riskLevel;
  if (finalScore >= 70) riskLevel = 'critical';
  else if (finalScore >= 45) riskLevel = 'high';
  else if (finalScore >= 20) riskLevel = 'medium';
  else riskLevel = 'low';

  return { finalScore, riskLevel };
}

/**
 * Determine agreement between rule-based and AI verdicts.
 */
export function computeAgreement(ruleRiskLevel, aiVerdict) {
  if (!aiVerdict) return 'not_applicable';
  
  const ruleToVerdict = {
    critical: 'likely_scam',
    high: 'likely_scam',
    medium: 'suspicious',
    low: 'likely_legitimate',
  };

  const expected = ruleToVerdict[ruleRiskLevel];
  if (aiVerdict === expected) return 'agree';
  
  // Partial agreement: adjacent levels
  const levels = ['likely_legitimate', 'suspicious', 'likely_scam', 'insufficient_information'];
  const expectedIdx = levels.indexOf(expected);
  const actualIdx = levels.indexOf(aiVerdict);
  if (actualIdx === -1 || expectedIdx === -1) return 'partial';
  if (Math.abs(expectedIdx - actualIdx) <= 1) return 'partial';
  
  return 'disagree';
}
