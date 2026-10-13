# KavachAI — Privacy-First Scam & Fraud Defense Copilot

> "Check before you click, share, or pay."

KavachAI is a privacy-first scam analysis platform that detects and redacts sensitive data before AI analysis, produces explainable verdicts with grounded evidence, and empowers users with full control of their data.

## 🛡️ Features

### P0 (Core)
- **Auth**: Register/login with bcrypt + JWT, account lockout, role-based access (user/analyst/admin)
- **Privacy Guard**: Detects and redacts Aadhaar (Verhoeff), PAN, cards (Luhn), OTP, PIN, passwords, bank accounts, IFSC, API keys
- **Scam Analyzer**: Two-step flow — redaction preview → full analysis with 18+ rule engine + optional Gemini AI
- **Explainable Report**: Risk gauge, score breakdown, grounded red flags, agreement meter, actions, family alert
- **Scan History**: Saved scans with filters, detail view, delete
- **Public Demo**: Landing page with no-login rules-only demo using synthetic samples

### P1
- **AI Prompt Safe-Share**: Scan text for PII + hidden instructions before sharing with any AI
- **URL Inspector**: Offline heuristics only (never fetches URLs)
- **Community Threat Radar**: Anonymous hash-only aggregates with Recharts visualization
- **Privacy Center**: Consent toggles, JSON export, account deletion, data retention explanation
- **Multilingual**: AI explanations and family alerts in English/Telugu/Hindi
- **Report Export**: Sanitized JSON download

### P2
- **Awareness Lab**: "Spot the Scam" drills with synthetic scenarios
- **Admin Console**: Analytics, calibration, AI briefing, user management, audit logs

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite, Tailwind CSS v4, React Router, Recharts, Lucide Icons |
| Backend | Node.js + Express, Zod validation, Pino logging, Helmet, CORS, Rate Limiting |
| Database | Supabase PostgreSQL (cloud) with RLS |
| AI | Google Gemini via `@google/genai` (server-side only) |
| Auth | Custom JWT + bcrypt (not Supabase Auth) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- Google Gemini API key (optional — app degrades gracefully without it)

### 1. Clone and install

```bash
cd KavachAI_1

# Server
cd server
cp .env.example .env
# Edit .env with your credentials
npm install

# Client
cd ../client
cp .env.example .env
npm install
```

### 2. Configure environment

**server/.env** — Required values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=postgresql://postgres.xxx:password@host:5432/postgres
JWT_SECRET=generate_a_random_string_of_at_least_32_chars
```

Optional:
```
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run database migration

```bash
cd server
npm run migrate
```

If `SUPABASE_DB_URL` is not available, copy `supabase/migrations/001_initial_schema.sql` and run it in the Supabase SQL Editor.

### 4. Seed demo users

```bash
npm run seed
```

Demo credentials (printed in terminal):
| Email | Password | Role |
|-------|----------|------|
| demo.user@example.com | DemoUser2024! | user |
| demo.analyst@example.com | DemoAnalyst2024! | analyst |
| demo.admin@example.com | DemoAdmin2024! | admin |

⚠️ These are demo-only credentials. Change in production.

### 5. Start development servers

```bash
# Terminal 1: Server
cd server
npm run dev

# Terminal 2: Client
cd client
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5000
- Health check: http://localhost:5000/api/health

## 🔐 Security Notes

- JWT stored in `sessionStorage` (cleared on tab close). Trade-off: cross-site cookie issues with Safari on Vercel+Render make httpOnly cookies unreliable for this architecture.
- Passwords: bcrypt cost 12, min 10 chars with letter + number
- No raw input logging (pino redaction on body, authorization, cookies)
- CORS allowlist (never `*` in production)
- Rate limiting on all routes, stricter on auth and AI
- RLS enabled on all tables as defense-in-depth
- Server NEVER fetches/visits user-provided URLs
- AI receives only sanitized text with pseudonymized IOCs
- Prompt injection defense: delimiters, system rules, schema-constrained output, grounding verification

## 📦 Deployment

### Supabase (Database)
1. Create a Supabase project
2. Run migration SQL in SQL Editor
3. Copy project URL and service role key

### Render (Server)
1. Create Web Service from the `server/` directory
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set all server environment variables
5. Set `CLIENT_URL` to your Vercel URL

### Vercel (Client)
1. Import repo, set Root Directory to `client`
2. Framework: Vite
3. Set `VITE_API_BASE_URL` to your Render URL
4. Deploy

## 📁 Project Structure

```
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/               # Axios API layer
│   │   ├── components/        # AppShell, ProtectedRoute
│   │   ├── context/           # AuthContext
│   │   └── pages/             # All page components
│   ├── index.html
│   └── vite.config.js
├── server/                    # Express backend
│   ├── src/
│   │   ├── ai/                # Gemini client, prompts, schemas, grounding
│   │   ├── config/            # Zod env validation
│   │   ├── db/                # Supabase client
│   │   ├── engine/            # normalize, pii, ioc, rules, scoring, urlHeuristics
│   │   ├── middleware/        # auth, validate, rateLimit, errorHandler
│   │   ├── routes/            # All API routes
│   │   ├── schemas/           # Zod request schemas
│   │   ├── services/          # quota, radar
│   │   └── utils/             # logger, hash, verhoeff, luhn
│   └── scripts/               # migrate.js, seed.js
└── supabase/migrations/       # SQL schema
```

## ⚠️ Disclaimer

KavachAI provides heuristic risk assessments, not guarantees. Never rely solely on automated analysis. When in doubt, verify through official channels.
