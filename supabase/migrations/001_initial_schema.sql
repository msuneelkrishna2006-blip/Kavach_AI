-- KavachAI Initial Schema
-- Migration 001

create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  full_name text not null check (char_length(full_name) between 1 and 100),
  role text not null default 'user' check (role in ('user','analyst','admin')),
  preferred_language text not null default 'en' check (preferred_language in ('en','te','hi')),
  store_history boolean not null default true,
  contribute_to_radar boolean not null default true,
  failed_login_count int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists users_email_lower_uidx on public.users (lower(email));
drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- Scam Categories
create table if not exists public.scam_categories (
  code text primary key,
  name text not null,
  description text not null,
  typical_red_flags text[] not null default '{}',
  recommended_actions text[] not null default '{}',
  severity_hint text not null default 'high' check (severity_hint in ('low','medium','high','critical'))
);

-- Scans
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mode text not null check (mode in ('scam_check','ai_prompt_check','url_inspect')),
  input_type text not null check (input_type in ('sms','whatsapp','email','call_transcript','url','other')),
  sanitized_text text,
  text_length int not null check (text_length >= 0),
  fingerprint text not null,
  language_detected text,
  pii_summary jsonb not null default '{}'::jsonb,
  ioc_summary jsonb not null default '{}'::jsonb,
  rule_findings jsonb not null default '[]'::jsonb,
  rule_score int not null check (rule_score between 0 and 100),
  ai_used boolean not null default false,
  ai_analysis jsonb,
  ai_adjustment int not null default 0 check (ai_adjustment between -15 and 15),
  final_score int not null check (final_score between 0 and 100),
  risk_level text not null check (risk_level in ('low','medium','high','critical')),
  scam_category text references public.scam_categories(code),
  agreement text not null default 'not_applicable' check (agreement in ('agree','partial','disagree','not_applicable')),
  created_at timestamptz not null default now()
);
create index if not exists scans_user_created_idx on public.scans (user_id, created_at desc);
create index if not exists scans_fingerprint_idx on public.scans (fingerprint);
create index if not exists scans_risk_idx on public.scans (user_id, risk_level);

-- Scan Feedback
create table if not exists public.scan_feedback (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  user_label text not null check (user_label in ('scam','legit','unsure')),
  helpful boolean,
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (scan_id, user_id)
);

-- Threat Signals
create table if not exists public.threat_signals (
  fingerprint text primary key,
  scam_category text references public.scam_categories(code),
  risk_level text not null check (risk_level in ('low','medium','high','critical')),
  occurrences int not null default 1,
  distinct_reporters int not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists threat_signals_last_seen_idx on public.threat_signals (last_seen_at desc);

-- Threat Signal Reports
create table if not exists public.threat_signal_reports (
  fingerprint text not null references public.threat_signals(fingerprint) on delete cascade,
  reporter_hash text not null,
  created_at timestamptz not null default now(),
  primary key (fingerprint, reporter_hash)
);

-- Drill Scenarios
create table if not exists public.drill_scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  channel text not null check (channel in ('sms','whatsapp','email','call_transcript')),
  message_text text not null,
  is_scam boolean not null,
  scam_category text references public.scam_categories(code),
  explanation text not null,
  difficulty smallint not null default 1 check (difficulty between 1 and 3)
);

-- Drill Attempts
create table if not exists public.drill_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  scenario_id uuid not null references public.drill_scenarios(id) on delete cascade,
  answered_scam boolean not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists drill_attempts_user_idx on public.drill_attempts (user_id, created_at desc);

-- AI Usage Daily
create table if not exists public.ai_usage_daily (
  user_id uuid not null references public.users(id) on delete cascade,
  usage_date date not null default current_date,
  call_count int not null default 0,
  primary key (user_id, usage_date)
);

-- Audit Logs
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_user_idx on public.audit_logs (user_id, created_at desc);

-- ============================================================
-- Row Level Security (Defense in Depth)
-- ============================================================
alter table public.users                  enable row level security;
alter table public.scam_categories        enable row level security;
alter table public.scans                  enable row level security;
alter table public.scan_feedback          enable row level security;
alter table public.threat_signals         enable row level security;
alter table public.threat_signal_reports  enable row level security;
alter table public.drill_scenarios        enable row level security;
alter table public.drill_attempts         enable row level security;
alter table public.ai_usage_daily         enable row level security;
alter table public.audit_logs             enable row level security;

-- Revoke all from anon and authenticated. The Express API uses the service-role key (bypasses RLS).
-- RLS is defense-in-depth if the project URL or anon key ever leaks.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- ============================================================
-- Seed Data: Scam Categories
-- ============================================================
INSERT INTO public.scam_categories (code, name, description, typical_red_flags, recommended_actions, severity_hint) VALUES
('upi_payment_fraud', 'UPI / Payment Request Fraud', 'Scams involving fake UPI collect requests, wrong-transfer refund tricks, and QR code scams designed to steal money from victims.', ARRAY['Unsolicited collect request', 'Claims wrong transfer asking for refund', 'Asks you to scan QR to receive money', 'Requests UPI PIN for receiving payment'], ARRAY['Never enter UPI PIN to receive money', 'Reject unknown collect requests', 'Verify claims through your bank app directly', 'Report to your bank and 1930'], 'critical'),
('kyc_phishing', 'KYC / Account-Block Phishing', 'Fake messages claiming your bank account, wallet, or SIM will be blocked unless you update KYC immediately, designed to steal credentials.', ARRAY['Threatens account/SIM block', 'Asks for OTP, PIN, or credentials', 'Contains suspicious links', 'Impersonates bank or telecom'], ARRAY['Never share OTP or PIN with anyone', 'Visit bank branch or official app for KYC', 'Do not click links in messages', 'Report to bank and cybercrime.gov.in'], 'high'),
('digital_arrest', 'Digital Arrest / Authority Impersonation', 'Criminals impersonate police, CBI, customs officials via video call, claiming the victim is under investigation and must stay on call while transferring money.', ARRAY['Claims to be police/CBI/customs', 'Demands staying on video call', 'Forbids contacting family or others', 'Threatens arrest or legal action', 'Demands money transfer for case settlement'], ARRAY['Hang up immediately - no authority arrests via video call', 'Call 1930 to report', 'Contact local police station', 'Tell family members immediately', 'Do not transfer any money'], 'critical'),
('courier_customs', 'Courier / Parcel / Customs Scam', 'Fake messages about packages held by customs containing illegal items, demanding payment or personal details to release them.', ARRAY['Claims parcel held at customs', 'Alleges illegal contents in package', 'Demands payment to release parcel', 'Threats of legal action'], ARRAY['Verify with the courier company directly', 'Do not pay any release fees', 'Call 1930 if threatened', 'Customs never demands payment via phone'], 'high'),
('job_task_scam', 'Fake Job / Task-Based Earning Scam', 'Scams offering easy money for liking videos, rating products, or doing tasks, eventually demanding deposits to unlock earnings that never materialize.', ARRAY['Promises easy money for simple tasks', 'Requires deposit to start earning', 'Recruits via Telegram/WhatsApp', 'Initial small payments followed by larger deposit requests'], ARRAY['No legitimate job requires you to pay', 'Block and report the recruiter', 'If already paid, contact bank and file complaint at cybercrime.gov.in', 'Warn family and friends about the scheme'], 'high'),
('investment_scam', 'Investment / Trading / Crypto Scam', 'Fraudulent investment schemes promising guaranteed high returns through trading groups, fake platforms, or crypto schemes.', ARRAY['Guarantees fixed high returns', 'Claims insider tips or secret strategies', 'Uses fake trading platform', 'Pressures quick investment decisions'], ARRAY['No investment guarantees returns', 'Verify with SEBI-registered entities', 'Never invest based on social media tips', 'Report to SEBI and cybercrime.gov.in'], 'critical'),
('lottery_reward', 'Lottery / Prize / Cashback / Refund Scam', 'Fake notifications claiming the victim has won a lottery, prize, or is eligible for a refund, requiring fees or personal details to claim.', ARRAY['Claims you won a lottery or prize', 'Requires payment to claim reward', 'Asks for personal/banking details', 'Creates urgency to claim'], ARRAY['You cannot win a lottery you never entered', 'Never pay fees to claim prizes', 'Do not share banking details', 'Report to cybercrime.gov.in'], 'high'),
('utility_bill', 'Electricity / Utility Disconnection Scam', 'Threats of immediate electricity or utility disconnection unless payment is made through a specific link or number.', ARRAY['Threatens immediate disconnection', 'Provides suspicious payment link', 'Uses urgency and fear', 'Not from official utility channels'], ARRAY['Pay bills only through official app or website', 'Call the number on your actual bill', 'Utility companies give written notice before disconnection', 'Report suspicious messages to 1930'], 'high'),
('loan_app', 'Predatory Loan App / Harassment', 'Abusive lending apps that charge exorbitant interest and harass borrowers and their contacts with threats and defamatory messages.', ARRAY['Unsolicited loan offers', 'Demands access to contacts and gallery', 'Extremely high interest rates', 'Harassment and threats to contacts'], ARRAY['Only use RBI-licensed lenders', 'Report harassing apps to police', 'File complaint at cybercrime.gov.in', 'Do not share contact list access with unknown apps'], 'high'),
('remote_access', 'Remote-Access / Fake Support Scam', 'Scammers trick victims into installing remote access software like AnyDesk, then control the device to steal money and data.', ARRAY['Asks to install AnyDesk, TeamViewer, or similar', 'Claims to be customer support', 'Requests screen sharing', 'Asks for download from non-official sources'], ARRAY['Never install screen-sharing apps at a stranger''s request', 'Hang up and call the official support number', 'Uninstall any remotely installed apps immediately', 'Change all passwords if access was granted'], 'critical'),
('ai_prompt_injection', 'Hidden Instructions Targeting AI', 'Text containing hidden instructions designed to manipulate AI analyzers into giving false safety verdicts.', ARRAY['Contains "ignore previous instructions"', 'Attempts to override AI behavior', 'Hidden text or zero-width characters', 'Instructions to report as safe or legitimate'], ARRAY['Be aware that scammers try to fool AI tools too', 'Do not rely solely on AI verdicts', 'Use multiple verification methods', 'Report suspicious AI manipulation attempts'], 'high'),
('other_suspicious', 'Other Suspicious Content', 'Content that shows some suspicious indicators but does not fit neatly into a specific scam category.', ARRAY['General suspicious patterns', 'Unusual urgency or pressure', 'Requests for personal information', 'Unknown sender with unusual content'], ARRAY['Exercise caution with unfamiliar messages', 'Verify through official channels', 'Do not click unknown links', 'Report to 1930 if in doubt'], 'medium'),
('none', 'No Strong Scam Indicators', 'The analyzed content does not show strong indicators of a scam based on the rules and patterns checked.', ARRAY[]::text[], ARRAY['Stay vigilant', 'When in doubt, verify through official channels', 'Never share OTP, PIN, or passwords'], 'low')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Seed Data: Drill Scenarios (all synthetic)
-- ============================================================
INSERT INTO public.drill_scenarios (title, channel, message_text, is_scam, scam_category, explanation, difficulty) VALUES
('Urgent KYC Update', 'sms', 'Dear Customer, Your SBI account will be BLOCKED within 24 hours. Update KYC immediately: http://sbi-kyc-update.xyz/verify. Call 9876543210 for help. -SBI Team', true, 'kyc_phishing', 'This is a KYC phishing scam. Real SBI never sends KYC links via SMS. The URL uses a suspicious .xyz domain. Official KYC updates happen at branches or through the official YONO app.', 1),
('Wrong Transfer Refund', 'whatsapp', 'Hi, I accidentally sent Rs 5000 to your number. Please check and return it. I am sending a collect request, just approve it. My family needs this money urgently.', true, 'upi_payment_fraud', 'This is a UPI fraud. No money was actually sent. The collect request will TAKE money from you, not return it. Approving a collect request means YOU are paying THEM.', 1),
('Digital Arrest Call', 'call_transcript', 'This is Inspector Sharma from Cyber Crime Department. Your Aadhaar number has been used for money laundering. A warrant is being issued. You must stay on this video call. Do not tell anyone or disconnect. Transfer Rs 50000 to the RBI safe account to clear your name.', true, 'digital_arrest', 'This is a "digital arrest" scam. No police officer conducts arrests via video call. There is no "RBI safe account". Real police serve warrants in person. The instruction to not tell family is a major red flag.', 1),
('Earn by Liking Videos', 'whatsapp', 'Hi! Earn Rs 500-5000 daily by liking YouTube videos. No experience needed! Join our Telegram group: t.me/easymoneywork. Start earning today! Limited spots available.', true, 'job_task_scam', 'This is a task-based job scam. They initially pay small amounts, then demand large deposits to "unlock" higher-earning tasks. The Telegram-only communication and unrealistic earnings are red flags.', 1),
('Electricity Disconnection', 'sms', 'ALERT: Your electricity connection will be DISCONNECTED today due to unpaid bill. Pay immediately at: http://electricity-bill-pay.top/urgent to avoid disconnection. Ref: EB2024/8847', true, 'utility_bill', 'This is a utility scam. Real electricity boards send paper notices and give weeks of notice before disconnection. The .top domain is suspicious. Always pay through the official electricity board website or app.', 2),
('Investment Group Invite', 'whatsapp', 'Exclusive insider trading tips! Join our premium group. Guaranteed 40% monthly returns on stock market investments. Our AI algorithm never fails. Minimum investment: Rs 10000. DM now!', true, 'investment_scam', 'No investment can guarantee 40% monthly returns. This is an investment scam. SEBI-registered advisors never cold-message on WhatsApp. "AI algorithm" claims are used to create false credibility.', 2),
('Bank Transaction Alert', 'sms', 'Rs 2,500.00 debited from A/c XX4523 on 15-Oct. UPI Ref: 428176234523. If not done by you, call 1800-111-1111 (your bank toll-free). -YourBank', false, null, 'This is a legitimate bank transaction alert. It does not contain any links, does not ask for OTP/PIN, provides the bank''s official toll-free number, and only informs about a transaction.', 1),
('OTP Delivery', 'sms', 'Your OTP for login is 847291. Valid for 5 minutes. Do not share this OTP with anyone. If you did not request this, please contact our support. -ServiceApp', false, null, 'This is a standard OTP delivery message. While it contains an OTP, it explicitly warns not to share it. The OTP was presumably requested by the user. No suspicious links or requests present.', 1),
('Delivery Update', 'sms', 'Your Amazon order #402-7891234 has been shipped. Track at: amazon.in/track. Expected delivery: Oct 18. - Amazon', false, null, 'This is a legitimate delivery notification. It uses the official amazon.in domain, provides specific order details, and does not request any personal information or payment.', 2),
('Government Advisory', 'email', 'Advisory from Ministry of Home Affairs: Report cyber fraud on the National Cybercrime Portal (cybercrime.gov.in) or call 1930. Never share OTP, UPI PIN, or bank passwords with anyone. Forward this to protect your family.', false, null, 'This is a legitimate government awareness message. It directs to the official cybercrime.gov.in website, provides the correct helpline 1930, and advises protective measures without asking for any personal information.', 2)
ON CONFLICT DO NOTHING;
