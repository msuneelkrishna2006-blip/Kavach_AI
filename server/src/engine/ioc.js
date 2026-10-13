/**
 * IOC (Indicators of Compromise) Pseudonymization Module
 * Replaces phone numbers, UPI IDs, emails, URLs with pseudonyms
 * while preserving analysis-relevant features.
 */

// Curated list of Indian bank/brand/government domains for lookalike detection
const BRAND_DOMAINS = [
  'sbi.co.in', 'onlinesbi.com', 'hdfcbank.com', 'icicibank.com', 'axisbank.com',
  'kotak.com', 'pnbindia.in', 'bobfinancial.com', 'bankofbaroda.in', 'yesbank.in',
  'idbibank.in', 'unionbankofindia.co.in', 'canarabank.com', 'indianbank.in',
  'paytm.com', 'phonepe.com', 'googlepay.com', 'bhimupi.org.in',
  'rbi.org.in', 'incometax.gov.in', 'uidai.gov.in', 'india.gov.in',
  'irctc.co.in', 'indiapost.gov.in', 'epfindia.gov.in', 'cybercrime.gov.in',
  'flipkart.com', 'amazon.in', 'myntra.com', 'meesho.com',
  'trai.gov.in', 'npci.org.in', 'policeonline.gov.in',
  'jio.com', 'airtel.in', 'vi.com', 'bsnl.co.in',
];

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'cutt.ly', 'rb.gy', 'shorturl.at',
  'tiny.cc', 'v.gd', 'shorte.st', 'clck.ru',
];

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.club', '.work', '.click', '.link', '.info',
  '.online', '.site', '.fun', '.icu', '.buzz', '.monster',
  '.tk', '.ml', '.ga', '.cf', '.gq',
];

const FREE_HOSTING = [
  'blogspot.com', 'wordpress.com', 'weebly.com', 'wixsite.com',
  'sites.google.com', 'herokuapp.com', 'netlify.app', 'vercel.app',
  'firebase.com', 'web.app',
];

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Check if a domain is a lookalike of known brands (Levenshtein ≤ 2).
 */
function findLookalike(domain) {
  const domainLower = domain.toLowerCase();
  for (const brand of BRAND_DOMAINS) {
    if (domainLower === brand) return null; // Exact match is not a lookalike
    const brandBase = brand.split('.')[0];
    const domainBase = domainLower.split('.')[0];
    if (levenshtein(domainBase, brandBase) <= 2 && domainBase !== brandBase) {
      return brand;
    }
  }
  return null;
}

/**
 * Extract and pseudonymize IOCs from text.
 * Returns { pseudonymizedText, iocs: [{ placeholder, type, features }], iocSummary }
 */
export function extractAndPseudonymize(text) {
  if (!text || typeof text !== 'string') {
    return { pseudonymizedText: '', iocs: [], iocSummary: {} };
  }

  let result = text;
  const iocs = [];
  const counters = { phone: 0, upi: 0, email: 0, url: 0 };

  // URLs first (most complex, to avoid partial matches)
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(result)) !== null) {
    try {
      const url = new URL(urlMatch[0]);
      counters.url++;
      const placeholder = `[URL_${counters.url}]`;
      
      const host = url.hostname.toLowerCase();
      const features = {
        is_shortener: URL_SHORTENERS.some(s => host === s || host.endsWith('.' + s)),
        is_ip_literal: /^\d{1,3}(\.\d{1,3}){3}$/.test(host),
        has_punycode: host.startsWith('xn--') || host.includes('.xn--'),
        subdomain_depth: host.split('.').length - 2,
        tld: '.' + host.split('.').pop(),
        suspicious_tld: SUSPICIOUS_TLDS.some(t => host.endsWith(t)),
        free_hosting: FREE_HOSTING.some(f => host.endsWith(f)),
        lookalike_of: findLookalike(host),
        defanged_host: `hxxps://${host}`,
      };

      iocs.push({ placeholder, type: 'url', features });
      
      // Replace URL, keeping host for display but masking path/query
      const replacement = features.defanged_host + (url.pathname !== '/' ? '/[URL_PATH_REDACTED]' : '');
      result = result.substring(0, urlMatch.index) + placeholder + result.substring(urlMatch.index + urlMatch[0].length);
      urlRegex.lastIndex = urlMatch.index + placeholder.length;
    } catch {
      // Invalid URL, skip
    }
  }

  // UPI IDs (before email to avoid confusion)
  const upiRegex = /\b([a-zA-Z0-9._-]+@[a-zA-Z]{2,}(?:bank|paytm|ybl|axl|ibl|upi|apl|okhdfcbank|okaxis|oksbi|okicici|jupiteraxis|timecosmos|axisb|yesbankltd|sbi|icici|hdfcbank|federal|kotak|indus|idbi|citi|boi|cnrb|pnb|unionbank|freecharge|airtel|jio|slice|fi|cred|groww|gpay|phonepe))\b/gi;
  let upiMatch;
  while ((upiMatch = upiRegex.exec(result)) !== null) {
    counters.upi++;
    const placeholder = `[UPI_${counters.upi}]`;
    const handle = upiMatch[1].split('@')[1]?.toLowerCase() || '';
    
    let providerCategory = 'other';
    if (['paytm', 'ptaxis', 'pthdfc', 'ptsbi'].some(p => handle.includes(p))) providerCategory = 'paytm';
    else if (['ybl', 'axl'].some(p => handle.includes(p))) providerCategory = 'phonepe';
    else if (['okhdfcbank', 'okaxis', 'oksbi', 'okicici'].some(p => handle.includes(p))) providerCategory = 'gpay';
    else if (handle.includes('ibl')) providerCategory = 'bank_direct';
    
    iocs.push({ placeholder, type: 'upi', features: { providerCategory } });
    result = result.substring(0, upiMatch.index) + placeholder + result.substring(upiMatch.index + upiMatch[0].length);
    upiRegex.lastIndex = upiMatch.index + placeholder.length;
  }

  // Emails
  const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
  let emailMatch;
  while ((emailMatch = emailRegex.exec(result)) !== null) {
    // Skip if already pseudonymized
    if (emailMatch[0].startsWith('[')) continue;
    counters.email++;
    const placeholder = `[EMAIL_${counters.email}]`;
    const domain = emailMatch[1].split('@')[1]?.toLowerCase() || '';
    
    iocs.push({ placeholder, type: 'email', features: { domain, is_freemail: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com', 'rediffmail.com'].includes(domain) } });
    result = result.substring(0, emailMatch.index) + placeholder + result.substring(emailMatch.index + emailMatch[0].length);
    emailRegex.lastIndex = emailMatch.index + placeholder.length;
  }

  // Phone numbers (Indian and international)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}\b/g;
  let phoneMatch;
  while ((phoneMatch = phoneRegex.exec(result)) !== null) {
    const cleaned = phoneMatch[0].replace(/[\s().-]/g, '');
    // Must be at least 7 digits to be a phone number
    if (cleaned.replace(/\D/g, '').length < 7) continue;
    // Skip if already pseudonymized
    if (phoneMatch[0].startsWith('[')) continue;
    
    counters.phone++;
    const placeholder = `[PHONE_${counters.phone}]`;
    
    const digits = cleaned.replace(/\D/g, '');
    const features = {
      has_country_code: cleaned.startsWith('+'),
      is_indian_mobile: /^(\+?91)?[6-9]\d{9}$/.test(digits),
      is_tollfree: /^1800/.test(digits) || /^1860/.test(digits),
      is_shortcode: digits.length <= 6,
      digit_count: digits.length,
    };

    iocs.push({ placeholder, type: 'phone', features });
    result = result.substring(0, phoneMatch.index) + placeholder + result.substring(phoneMatch.index + phoneMatch[0].length);
    phoneRegex.lastIndex = phoneMatch.index + placeholder.length;
  }

  const iocSummary = {};
  for (const [type, count] of Object.entries(counters)) {
    if (count > 0) iocSummary[type] = count;
  }

  return { pseudonymizedText: result, iocs, iocSummary };
}

export { BRAND_DOMAINS, URL_SHORTENERS, SUSPICIOUS_TLDS, findLookalike };
