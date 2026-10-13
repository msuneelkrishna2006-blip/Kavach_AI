# KavachAI Design Notes

## Color Tokens

| Name         | Hex       | Role                                    |
|------------- |---------- |---------------------------------------- |
| `midnight`   | `#0d1321` | App background — deep navy-indigo       |
| `surface`    | `#151d30` | Cards, panels — lighter navy            |
| `surface-2`  | `#1b2640` | Hover states, secondary panels          |
| `border`     | `#243049` | Borders — slate-indigo                  |
| `emerald`    | `#34d399` | "Protected" state, primary actions      |
| `saffron`    | `#f5a623` | Attention / highlight / PII chips       |
| `amber`      | `#f59e0b` | Medium risk                             |
| `red`        | `#ef4444` | High/critical risk, destructive         |
| `text`       | `#e8ecf4` | Primary body text — warm off-white      |
| `text-muted` | `#8896b3` | Secondary text — muted slate            |

Rejected: plain `#0a0e1a` (too black, no hue). The midnight-indigo
has visible blue undertone in dark rooms and next to white text.

Light theme: not shipping in v1 — would require a full audit.
Prep: all colors defined as CSS custom properties so a
`[data-theme="light"]` block can override later.

## Typography

| Role      | Family           | Weight    | Size scale          |
|---------- |----------------- |---------- |-------------------- |
| Display   | Sora             | 600, 700  | 40 / 32 / 24 px     |
| Body      | Noto Sans        | 400, 500  | 16 / 14 / 13 px     |
| Telugu    | Noto Sans Telugu | 400, 500  | inherits body scale  |
| Hindi     | Noto Sans Devanagari | 400, 500 | inherits body scale |
| Mono      | system monospace | 400       | 13 px                |

Why Sora: geometric, distinctive, reads "tech" without being
overused. Pairs well with Noto Sans' neutral humanist shapes.

Fallback stack: `'Sora', 'Noto Sans', system-ui, sans-serif`.

## Hero Layout (ASCII wireframe)

```
┌──────────────────────────────────────────────┐
│ nav: [shield] KavachAI          [Sign In] [→]│
├──────────────────────────────────────────────┤
│                                              │
│  Check before you         ┌──────────┐      │
│  click, share,            │ ┌──────┐ │      │
│  or pay.                  │ │ SMS  │ │      │
│                           │ │ scam │ │      │
│  Paste a suspicious       │ │ msg  │ │      │
│  message and get an       │ │      │ │      │
│  explainable verdict      │ │ ──── │ │      │
│  in seconds.              │ │gauge │ │      │
│                           │ │chips │ │      │
│  [Check a message]        │ └──────┘ │      │
│  See how it works ↓       └──────────┘      │
│                                              │
├──────────────────────────────────────────────┤
│  story sections below...                     │
```

On mobile (<768px): stack vertically, phone below copy.

## Animation Sequence (hero phone)

1. `0.0s` — Phone frame visible, message area empty.
2. `0.5s` — SMS text types/fades in (the synthetic scam).
3. `1.5s` — Risky phrases underline in saffron; OTP becomes
   `[OTP_REDACTED]` chip; phone number becomes `[PHONE_REDACTED]`.
4. `2.5s` — Risk gauge sweeps from 0 to score (e.g. 72).
5. `3.0s` — Verdict text: "⚠ Likely scam — do not engage".
6. `3.5s` — 3 red-flag chips slide in: Urgency, Impersonation,
   Asks for OTP.

`prefers-reduced-motion`: show final frame, no transitions.

Data: call `/api/demo/analyze` on mount with the labeled sample.
If fetch fails or takes >4s, use a static precomputed result
and show "(Demo data)" label.

## Self-Review: Anti-Template Checklist

Things I removed or avoided:

1. ~~Pill badge above headline ("AI Security & Trust")~~ — deleted.
   Headline stands alone.
2. ~~Gradient text on headline~~ — single color (off-white).
3. ~~Identical rounded cards for features~~ — story sections use
   distinct layouts: side-by-side, numbered steps, tabbed card.
4. ~~Scattered `animate-fade-in` on every section~~ — only the hero
   phone gets an orchestrated sequence. Sections below are static.
5. ~~"X users protected" counter~~ — no fake stats. Privacy promise
   uses 3 concrete verifiable claims only.
6. ~~Glass morphism / blur everywhere~~ — glass only on nav bar
   (functional: scroll overlay). Panels are solid.
7. ~~Uniform card border-radius~~ — hero phone has 32px radius
   (premium), report cards 12px, list rows 8px. Hierarchy.

## Principles

- **One bold moment**: the hero demo. Everything else is quiet.
- **Earned trust**: show real redaction, real analysis, real limits.
- **No theater**: no fake data, no lorem, no stock photos.
- **Typography does the work**: size + weight hierarchy instead of
  decorative borders and gradients.
