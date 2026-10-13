/**
 * URL Heuristics Inspector (offline only - NEVER fetches URLs)
 * Analyzes URL structure for suspicious patterns without making any network requests.
 */

import { BRAND_DOMAINS, URL_SHORTENERS, SUSPICIOUS_TLDS, findLookalike } from './ioc.js';

const FREE_HOSTING_PATTERNS = [
  'blogspot.com', 'wordpress.com', 'weebly.com', 'wixsite.com',
  'sites.google.com', 'herokuapp.com', 'netlify.app', 'vercel.app',
  'firebase.com', 'web.app', '000webhostapp.com', 'infinityfreeapp.com',
];

/**
 * Perform offline URL heuristic analysis.
 * @param {string} urlStr - The URL string to analyze
 * @returns {object} Analysis result with risk indicators
 */
export function inspectUrl(urlStr) {
  const findings = [];
  let riskScore = 0;

  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format',
      findings: [{ id: 'URL-INVALID', label: 'Invalid URL', severity: 'high' }],
      riskScore: 0,
      defanged: urlStr,
    };
  }

  const host = parsed.hostname.toLowerCase();
  const defanged = urlStr.replace(/^https?:\/\//, (m) => m.replace('http', 'hxxp'));

  // Check: IP literal host
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    findings.push({ id: 'URL-03', label: 'IP address used instead of domain name', severity: 'high', detail: 'Legitimate services use domain names' });
    riskScore += 20;
  }

  // Check: Punycode (internationalized domain)
  if (host.startsWith('xn--') || host.includes('.xn--')) {
    findings.push({ id: 'URL-03', label: 'Punycode/internationalized domain', severity: 'high', detail: 'May be used to impersonate legitimate domains using look-alike characters' });
    riskScore += 20;
  }

  // Check: Excessive subdomains
  const subdomainDepth = host.split('.').length - 2;
  if (subdomainDepth > 3) {
    findings.push({ id: 'URL-03', label: `Excessive subdomains (${subdomainDepth} levels)`, severity: 'medium', detail: 'Legitimate sites rarely use more than 2 subdomain levels' });
    riskScore += 15;
  }

  // Check: URL shortener
  if (URL_SHORTENERS.some(s => host === s || host.endsWith('.' + s))) {
    findings.push({ id: 'URL-01', label: 'URL shortener detected', severity: 'medium', detail: 'Hides the actual destination. Verify by expanding the link in a safe environment.' });
    riskScore += 10;
  }

  // Check: Suspicious TLD
  const tld = '.' + host.split('.').pop();
  if (SUSPICIOUS_TLDS.includes(tld)) {
    findings.push({ id: 'URL-04', label: `Suspicious TLD: ${tld}`, severity: 'medium', detail: 'This TLD is commonly used in scam campaigns' });
    riskScore += 8;
  }

  // Check: Free hosting
  if (FREE_HOSTING_PATTERNS.some(f => host.endsWith(f))) {
    findings.push({ id: 'URL-04', label: 'Free hosting platform', severity: 'low', detail: 'Not inherently malicious, but often used for temporary scam pages' });
    riskScore += 5;
  }

  // Check: Lookalike domain
  const lookalike = findLookalike(host);
  if (lookalike) {
    findings.push({ id: 'URL-02', label: `Possible typosquatted domain (similar to ${lookalike})`, severity: 'critical', detail: `This domain closely resembles "${lookalike}" and may be impersonating it` });
    riskScore += 25;
  }

  // Check: HTTPS
  if (parsed.protocol === 'http:') {
    findings.push({ id: 'URL-SEC', label: 'Not using HTTPS', severity: 'medium', detail: 'Connection is not encrypted. Legitimate banking and payment sites always use HTTPS.' });
    riskScore += 10;
  }

  // Check: Suspicious path patterns
  const path = parsed.pathname.toLowerCase();
  if (/(?:login|signin|verify|secure|update|confirm|account|banking)/i.test(path)) {
    findings.push({ id: 'URL-PATH', label: 'Sensitive keywords in URL path', severity: 'medium', detail: 'Path contains words like "login", "verify", "secure" commonly used in phishing URLs' });
    riskScore += 10;
  }

  // Check: Very long URL
  if (urlStr.length > 200) {
    findings.push({ id: 'URL-LEN', label: 'Unusually long URL', severity: 'low', detail: 'Long URLs may be used to hide the true destination' });
    riskScore += 5;
  }

  // Check: @ symbol in URL (user info)
  if (parsed.username || parsed.password) {
    findings.push({ id: 'URL-AT', label: '@ symbol in URL (user info abuse)', severity: 'high', detail: 'The @ symbol can trick you into thinking you are visiting a different site' });
    riskScore += 20;
  }

  // Determine risk level
  riskScore = Math.min(riskScore, 100);
  let riskLevel = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 45) riskLevel = 'high';
  else if (riskScore >= 20) riskLevel = 'medium';

  return {
    valid: true,
    defanged,
    host,
    protocol: parsed.protocol,
    hasPath: parsed.pathname !== '/',
    hasQuery: parsed.search.length > 0,
    findings,
    riskScore,
    riskLevel,
    summary: findings.length === 0
      ? 'No suspicious indicators found in URL structure. This does not guarantee safety.'
      : `Found ${findings.length} suspicious indicator(s). Exercise caution.`,
  };
}
