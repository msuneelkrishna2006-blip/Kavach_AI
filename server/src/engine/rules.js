/**
 * Config-driven Rule Engine for scam detection.
 * Each rule: id, label, category hint, weight, patterns (regex + predicate), explanation, limitation.
 * Supports English, Hindi (Devanagari), Telugu, and Hinglish/Tenglish transliterations.
 */

const rules = [
  {
    id: 'URG-01',
    label: 'Urgency/deadline pressure',
    categoryHint: 'other_suspicious',
    weight: 10,
    patterns: [
      /\b(?:urgent|immediately|within\s+\d+\s*(?:hour|hr|minute|min)s?|last\s+chance|expir(?:e|ing|es)|deadline|time\s*(?:is\s+)?running\s+out|act\s+now|hurry|don'?t\s+delay|today\s+only|right\s+away|asap|turant|jaldi|foran|abhi|tatkaal|vెంటనే|అర్జంట్|జల్ది|तुरंत|जल्दी|फ़ौरन|अभी|तत्काल)\b/gi,
    ],
    explanation: 'The message creates artificial urgency to pressure you into acting without thinking.',
    limitation: 'Some legitimate time-sensitive messages (e.g., OTP expiry) also use urgency.',
  },
  {
    id: 'AUTH-01',
    label: 'Authority/brand impersonation',
    categoryHint: 'kyc_phishing',
    weight: 12,
    patterns: [
      /\b(?:RBI|Reserve\s+Bank|TRAI|(?:Income\s+)?Tax\s+Dept|SEBI|NPCI|Customs|CBI|Police|Cyber\s*Crime|UIDAI|EPFO|Court|Tribunal|Ministry|Government\s+of\s+India|SBI|HDFC|ICICI|Axis\s+Bank|Kotak|PNB|Canara|State\s+Bank|Airtel|Jio|Vi\s+Vodafone|BSNL|भारतीय\s*रिज़र्व\s*बैंक|ट्राई|पुलिस|सीबीआई|कस्टम|आयकर|న్యాయస్థానం|పోలీసు|ప్రభుత్వం)\b/gi,
      /\b(?:we\s+are\s+(?:calling|writing)\s+from|this\s+is\s+(?:a\s+)?(?:notice|warning)\s+from|official\s+(?:notice|communication|letter)|your\s+(?:account|sim|number|service)\s+(?:will\s+be|has\s+been)\s+(?:blocked|suspended|deactivated|terminated))\b/gi,
    ],
    explanation: 'The message impersonates a trusted authority or brand. Real institutions contact you through official channels, not via SMS/WhatsApp.',
    limitation: 'Not all mentions of official entities are scams. Some may be legitimate references.',
  },
  {
    id: 'THR-01',
    label: 'Threat of block/arrest/disconnection',
    categoryHint: 'digital_arrest',
    weight: 15,
    patterns: [
      /\b(?:(?:will\s+be|shall\s+be|is\s+being)\s+(?:blocked|suspended|terminated|deactivated|disconnected|cancelled|seized|frozen|arrested)|arrest\s+warrant|legal\s+(?:action|proceedings|notice)|FIR\s+(?:filed|registered|lodged)|police\s+complaint|court\s+(?:order|summons|notice)|imprisonment|jail|fine\s+of\s+Rs|penalty|prosecution|गिरफ्तार|ब्लॉक|बंद|निलंबित|कानूनी\s*कार्रवाई|अरెస్టు|బ్లాక్|నిలిపివేయబడుతుంది|చట్టపరమైన)\b/gi,
    ],
    explanation: 'Scammers threaten consequences like arrest, account blocking, or legal action to create fear.',
    limitation: 'Some legitimate service notices mention suspension, but typically without urgent personal threats.',
  },
  {
    id: 'CRED-01',
    label: 'Requests sensitive credentials',
    categoryHint: 'kyc_phishing',
    weight: 30,
    patterns: [
      /\b(?:(?:enter|share|send|provide|confirm|verify|update|submit)\s+(?:your\s+)?(?:OTP|PIN|UPI\s*PIN|CVV|password|passcode|Aadhaar|PAN|card\s+(?:number|details)|account\s+(?:number|details)|bank\s+details|KYC|credentials|login\s+details)|(?:OTP|PIN|password|Aadhaar|PAN)\s+(?:bhejo|dijiye|batao|भेजो|दीजिए|बताओ|పంపండి|చెప్పండి)|click\s+(?:here\s+)?to\s+(?:verify|update|confirm)\s+(?:your\s+)?(?:KYC|account|details))\b/gi,
    ],
    explanation: 'No legitimate organization ever asks for OTP, PIN, CVV, or passwords via message. These are requested only by scammers.',
    limitation: 'Messages discussing these credentials conceptually (not requesting them) may trigger this.',
  },
  {
    id: 'PAY-01',
    label: 'Payment/transfer request',
    categoryHint: 'upi_payment_fraud',
    weight: 20,
    patterns: [
      /\b(?:(?:pay|transfer|send)\s+(?:Rs\.?|₹|INR)?\s*\d+|collect\s+request|approve\s+(?:the\s+)?(?:payment|request|transaction)|advance\s+(?:fee|payment|deposit)|processing\s+(?:fee|charge)|release\s+fee|registration\s+(?:fee|charge)|refundable\s+(?:deposit|amount)|paisa\s+bhejo|paise\s+transfer|रुपये\s+(?:भेजो|ट्रांसफर)|డబ్బు\s+(?:పంపండి|చెల్లించండి))\b/gi,
    ],
    explanation: 'The message asks you to make a payment or transfer money. Be very cautious of unsolicited payment requests.',
    limitation: 'Genuine payment reminders from known contacts or businesses may match.',
  },
  {
    id: 'QR-01',
    label: 'QR code / UPI PIN to "receive" money',
    categoryHint: 'upi_payment_fraud',
    weight: 25,
    patterns: [
      /\b(?:scan\s+(?:this\s+)?(?:QR|code)|enter\s+(?:your\s+)?(?:UPI\s*)?PIN\s+to\s+(?:receive|get|collect)|(?:receive|get)\s+(?:money|payment)\s+(?:by\s+)?(?:scanning|entering\s+PIN)|QR\s+(?:code\s+)?scan\s+(?:karo|करो|karein|करें)|UPI\s+PIN\s+(?:enter\s+)?(?:karo|करो|डालो|చేయండి))\b/gi,
    ],
    explanation: 'You NEVER need to enter your UPI PIN or scan a QR code to RECEIVE money. This is always a scam to take money from you.',
    limitation: 'Very specific pattern. Low false positive risk.',
  },
  {
    id: 'REM-01',
    label: 'Remote access / APK install request',
    categoryHint: 'remote_access',
    weight: 30,
    patterns: [
      /\b(?:AnyDesk|TeamViewer|QuickSupport|remote\s+(?:access|desktop|control|support)|screen\s+sharing|install\s+(?:this\s+)?(?:app|apk|application|software)|download\s+(?:this\s+)?(?:apk|app|file)|\.apk\b|sideload)/gi,
    ],
    explanation: 'Scammers ask you to install remote access tools to control your device and steal money/data. Never install apps at a stranger\'s request.',
    limitation: 'Legitimate IT support may use these tools, but they will not cold-call you.',
  },
  {
    id: 'URL-01',
    label: 'URL shortener detected',
    categoryHint: 'other_suspicious',
    weight: 10,
    patterns: [
      /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|adf\.ly|cutt\.ly|rb\.gy|shorturl\.at|tiny\.cc)\b/gi,
    ],
    explanation: 'Shortened URLs hide the real destination. Do not click without verifying where it leads.',
    limitation: 'Shortened URLs are also used legitimately for sharing.',
  },
  {
    id: 'URL-02',
    label: 'Lookalike/typosquatted domain',
    categoryHint: 'kyc_phishing',
    weight: 25,
    // This is checked programmatically via IOC analysis, not regex
    patterns: [],
    checkIoc: true,
    iocCheck: (iocs) => iocs.some(i => i.type === 'url' && i.features?.lookalike_of),
    explanation: 'The URL mimics a legitimate brand domain with slight spelling changes to trick you into entering credentials.',
    limitation: 'Levenshtein similarity check may flag some legitimate but similarly named domains.',
  },
  {
    id: 'URL-03',
    label: 'Punycode/IP-literal/excessive subdomains',
    categoryHint: 'kyc_phishing',
    weight: 20,
    patterns: [],
    checkIoc: true,
    iocCheck: (iocs) => iocs.some(i => i.type === 'url' && (i.features?.has_punycode || i.features?.is_ip_literal || i.features?.subdomain_depth > 3)),
    explanation: 'The URL uses techniques (IP addresses, punycode, many subdomains) commonly associated with phishing.',
    limitation: 'Some legitimate internal/development URLs use IP addresses.',
  },
  {
    id: 'URL-04',
    label: 'Suspicious TLD / free hosting',
    categoryHint: 'other_suspicious',
    weight: 8,
    patterns: [],
    checkIoc: true,
    iocCheck: (iocs) => iocs.some(i => i.type === 'url' && (i.features?.suspicious_tld || i.features?.free_hosting)),
    explanation: 'The URL uses a domain extension or hosting platform commonly used in scam campaigns.',
    limitation: 'Not all sites on free hosting or uncommon TLDs are scams.',
  },
  {
    id: 'REW-01',
    label: 'Prize/lottery/cashback/refund bait',
    categoryHint: 'lottery_reward',
    weight: 15,
    patterns: [
      /\b(?:(?:you(?:'ve|'ve| have)?\s+)?won|winner|lottery|prize|lucky\s+(?:draw|winner|customer)|congratulations|cashback\s+of|claim\s+(?:your\s+)?(?:reward|prize|cashback|refund)|unclaimed\s+(?:refund|amount|reward)|(?:refund|cashback)\s+(?:of\s+)?(?:Rs\.?|₹|INR)\s*[\d,]+|इनाम|लॉटरी|कैशबैक|बధాయి|జయమ్|లాటరీ|క్యాష్‌బ్యాక్)\b/gi,
    ],
    explanation: 'Unsolicited "you have won" messages are almost always scams designed to collect fees or personal data.',
    limitation: 'Legitimate promotions exist but never require upfront payment to claim.',
  },
  {
    id: 'INV-01',
    label: 'Investment/trading scam indicators',
    categoryHint: 'investment_scam',
    weight: 20,
    patterns: [
      /\b(?:guaranteed\s+(?:returns?|profit|income)|(?:daily|weekly|monthly)\s+(?:returns?|profit|income)\s+of\s+\d+%|(?:double|triple)\s+your\s+(?:money|investment)|insider\s+(?:tips?|information)|(?:crypto|trading|forex)\s+(?:group|signal|mentor|academy)|join\s+(?:our\s+)?(?:trading|investment|crypto)\s+(?:group|channel|community)|minimum\s+investment\s+(?:of\s+)?(?:Rs\.?|₹|INR)|risk[- ]?free\s+(?:investment|returns?))\b/gi,
    ],
    explanation: 'Guaranteed high returns are a hallmark of investment scams. No legitimate investment can guarantee returns.',
    limitation: 'Mentions of investment terms in educational or news context may trigger this.',
  },
  {
    id: 'JOB-01',
    label: 'Fake job / task-based scam',
    categoryHint: 'job_task_scam',
    weight: 20,
    patterns: [
      /\b(?:earn\s+(?:Rs\.?|₹|INR)?\s*[\d,]+\s*(?:per\s+)?(?:day|task|hour|like|review|video)|(?:work\s+from\s+home|part[\s-]?time)\s+(?:job|earn|income)|(?:like|review|rate|watch)\s+(?:videos?|products?|apps?)\s+(?:and\s+)?(?:earn|get\s+paid)|(?:deposit|invest)\s+(?:Rs\.?|₹|INR)?\s*[\d,]+\s*(?:to\s+)?(?:start|unlock|withdraw|activate)|Telegram\s+(?:group|channel|contact)|WhatsApp\s+(?:group|number|contact)\s+(?:for\s+)?(?:job|earn|work)|registration\s+fee\s+(?:of\s+)?(?:Rs\.?|₹|INR))\b/gi,
    ],
    explanation: 'Legitimate jobs never ask you to pay upfront. "Like/review for money" schemes are scams that eventually demand deposits.',
    limitation: 'Some legitimate remote job postings may partially match.',
  },
  {
    id: 'ARR-01',
    label: 'Digital arrest pattern',
    categoryHint: 'digital_arrest',
    weight: 35,
    patterns: [
      /\b(?:(?:stay|remain)\s+on\s+(?:the\s+)?(?:video\s+)?call|(?:do\s+)?not\s+(?:disconnect|hang\s+up|cut\s+the\s+call|end\s+the\s+call|switch\s+off)|don'?t\s+(?:tell|inform|contact)\s+(?:anyone|family|police|your\s+family)|digital\s+arrest|under\s+(?:surveillance|investigation|monitoring)|your\s+(?:Aadhaar|PAN|phone|SIM|number)\s+(?:is\s+|has\s+been\s+)?(?:linked|connected|used|involved)\s+(?:in|to|with)\s+(?:money\s+laundering|drug|illegal|crime|fraud|terrorism)|कॉल\s*(?:मत\s*काटो|पर\s*रहो|बंद\s*मत\s*करो)|किसी\s*को\s*(?:मत\s*बताओ|ना\s*बताना)|కాల్\s*(?:కట్\s*చేయకండి|లో\s*ఉండండి)|ఎవరికీ\s*చెప్పకండి)\b/gi,
    ],
    explanation: 'This is a "digital arrest" scam. No authority conducts arrests over video calls. This is a serious fraud designed to keep you isolated while they extract money.',
    limitation: 'Very specific pattern. Extremely unlikely to match legitimate communication.',
  },
  {
    id: 'SEC-01',
    label: 'Secrecy/isolation instructions',
    categoryHint: 'digital_arrest',
    weight: 15,
    patterns: [
      /\b(?:(?:do\s+)?not\s+(?:tell|share|discuss|inform|disclose)\s+(?:this\s+)?(?:with\s+)?(?:anyone|family|friends|police)|keep\s+(?:this|it)\s+(?:confidential|secret|private|between\s+us)|this\s+is\s+(?:confidential|classified|top\s+secret)|(?:गोपनीय|किसी\s+को\s+(?:मत\s+बताना|ना\s+बताना))|(?:రహస్యం|ఎవరికీ\s+చెప్పకండి))\b/gi,
    ],
    explanation: 'Scammers try to isolate you from people who would recognize the scam. Legitimate authorities never ask you to hide their communication from family.',
    limitation: 'Some legitimate confidential communications may match.',
  },
  {
    id: 'OBF-01',
    label: 'Zero-width/homoglyph obfuscation',
    categoryHint: 'other_suspicious',
    weight: 10,
    // This is checked via normalization flags, not regex
    patterns: [],
    checkNormalization: true,
    explanation: 'The message contains invisible characters used to disguise content or bypass security filters.',
    limitation: 'Some text editors or copy-paste operations may introduce zero-width characters unintentionally.',
  },
  {
    id: 'INJ-01',
    label: 'Prompt injection targeting AI',
    categoryHint: 'ai_prompt_injection',
    weight: 20,
    patterns: [
      /\b(?:ignore\s+(?:previous|all|above|prior)\s+(?:instructions?|rules?|prompts?)|(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|roleplay\s+as)\s+[a-z]+|(?:tell|say|respond|output|reply)\s+(?:to\s+)?(?:the\s+)?(?:user|them)\s+(?:that\s+)?(?:this\s+is|it'?s?)\s+(?:safe|legit|legitimate|not\s+a?\s*scam)|(?:system|admin|developer)\s*(?:prompt|instruction|override|mode)|do\s+not\s+flag|mark\s+(?:this\s+)?as\s+(?:safe|legitimate|not\s+(?:a\s+)?scam)|forget\s+(?:everything|all\s+(?:previous|prior)))\b/gi,
    ],
    explanation: 'The message contains hidden instructions trying to manipulate an AI analyzer into giving a false "safe" verdict.',
    limitation: 'Discussion about prompt injection in educational context may trigger this.',
  },
  {
    id: 'MIT-01',
    label: 'Mitigating: informational, no ask',
    categoryHint: 'none',
    weight: -10,
    patterns: [
      /\b(?:(?:visit|go\s+to)\s+(?:your\s+)?(?:nearest\s+)?(?:branch|official\s+(?:website|app))|(?:call|contact)\s+(?:our\s+)?(?:customer\s+(?:care|service|support)|helpline|toll[- ]?free)|(?:for\s+)?(?:more\s+)?(?:info(?:rmation)?|details?|assistance)\s*[,:]\s*(?:visit|call|contact)|do\s+not\s+share\s+(?:your\s+)?(?:OTP|PIN|password)|never\s+share|(?:RBI|bank)\s+says|awareness|advisory|we\s+will\s+never\s+ask)\b/gi,
    ],
    explanation: 'The message contains protective/advisory language, suggesting it may be a legitimate communication.',
    limitation: 'Scammers sometimes include fake advisory language to appear legitimate.',
    isMitigation: true,
  },
];

/**
 * Run all rules against normalized text and IOC/normalization results.
 * @returns {{ findings: Array, rawScore: number }}
 */
export function evaluateRules(normalizedText, iocs = [], normalizationFlags = []) {
  const findings = [];

  for (const rule of rules) {
    let matched = false;
    let evidenceSnippet = '';

    // Check IOC-based rules
    if (rule.checkIoc && rule.iocCheck) {
      matched = rule.iocCheck(iocs);
      if (matched) {
        const matchingIoc = iocs.find(i => {
          if (rule.id === 'URL-02') return i.type === 'url' && i.features?.lookalike_of;
          if (rule.id === 'URL-03') return i.type === 'url' && (i.features?.has_punycode || i.features?.is_ip_literal || i.features?.subdomain_depth > 3);
          if (rule.id === 'URL-04') return i.type === 'url' && (i.features?.suspicious_tld || i.features?.free_hosting);
          return false;
        });
        evidenceSnippet = matchingIoc ? matchingIoc.placeholder : '';
      }
    }
    // Check normalization-based rules
    else if (rule.checkNormalization) {
      matched = normalizationFlags.length > 0;
      if (matched) {
        evidenceSnippet = normalizationFlags.map(f => `${f.type}(${f.count})`).join(', ');
      }
    }
    // Check regex-based rules
    else {
      for (const pattern of rule.patterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        const match = regex.exec(normalizedText);
        if (match) {
          matched = true;
          // Extract evidence (up to 50 chars around the match)
          const start = Math.max(0, match.index - 10);
          const end = Math.min(normalizedText.length, match.index + match[0].length + 10);
          evidenceSnippet = normalizedText.substring(start, end).trim();
          if (evidenceSnippet.length > 60) evidenceSnippet = evidenceSnippet.substring(0, 60) + '...';
          break;
        }
      }
    }

    if (matched) {
      findings.push({
        id: rule.id,
        label: rule.label,
        weight: rule.weight,
        categoryHint: rule.categoryHint,
        explanation: rule.explanation,
        limitation: rule.limitation,
        evidenceSnippet,
        isMitigation: rule.isMitigation || false,
      });
    }
  }

  return findings;
}

export { rules };
