# ReceiptSync Signup Page — Design Brainstorm

## Reference
The user explicitly requested to mirror the YNAB signup page (ynab.com/signup) as the ground-truth layout spec, adapted to ReceiptSync's brand colors and identity. Fidelity to the YNAB layout OVERRIDES creative divergence.

## YNAB Layout Spec (ground truth)
- Full viewport, no scroll
- LEFT half: dark deep-navy/indigo background, large white headline, witty social-proof subtext, decorative SVG accents in corners
- RIGHT half: centered floating white card with rounded corners and shadow, containing the form
- Top-left: "← Back to receiptsync.net" escape link
- Form card: heading + "No credit card required" trust signal + email + password + checkbox + green CTA button + divider + social login options
- OTP step: replaces form content inside the same card (screen 2)
- Success step: confirmation inside same card (screen 3)

## Chosen Design Direction: "ReceiptSync Indigo"

**Design Movement:** Confident SaaS — clean, trustworthy, conversion-optimized

**Core Principles:**
1. Mirror YNAB's split-screen layout exactly — dark left, white card right
2. ReceiptSync brand colors: deep indigo/navy background (`hsl(240,30%,10%)`), purple primary (`hsl(262,83%,58%)`), green secondary/CTA (`hsl(160,84%,39%)`)
3. Witty, human copy on the left — mirrors YNAB's tone
4. Minimal form friction — email + password only on step 1

**Color Philosophy:**
- Background: deep navy `oklch(0.13 0.04 280)` — matches ReceiptSync hero
- Card: pure white
- CTA button: ReceiptSync green `oklch(0.6 0.17 155)` — high contrast on white card
- Accent/highlight text: ReceiptSync purple `oklch(0.55 0.22 290)`

**Typography System:**
- Font: Inter (matches receiptsync.net)
- Left headline: 3.5rem, weight 800, white
- Card heading: 1.5rem, weight 700, dark
- Body: 0.9rem, weight 400, muted

**Signature Brand Color:** ReceiptSync green `hsl(160,84%,39%)`

**Brand Essence:** Effortless receipt management for people who value their time.
