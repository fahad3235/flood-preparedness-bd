# Flood Preparedness BD — বন্যা প্রস্তুতি বিডি

An offline, bilingual (English / বাংলা) flood-preparedness guide for families in
Bangladesh. Plan drinking water and dry food, pack a go-bag, test your readiness,
and learn what to do before, during, and after a flood — with verified emergency
numbers and the official FFWC warning levels. No account, no network, no tracking:
everything is stored on your device.

## Features

- **Water & food calculator** — enter family size and days; get litres of drinking
  water (3 L per person per day, WHO emergency planning figure) plus dry-food
  quantities (rice, dal, chira, salt, biscuits, ORS). Save plans and reload them.
- **Go-bag checklist** — 24 items in 5 categories (documents, water & food, health,
  tools & light, family) with suggested quantities, progress bar, and persistence.
- **Readiness quiz** — 10 questions, score out of 100, level (Ready / Getting there /
  At risk), tailored fix-first recommendations, best score saved.
- **Guides** — 21 checkable steps across Before / During / After the flood, with
  per-phase and overall progress.
- **Contacts & warnings** — tap-to-call 1090 (National Disaster Alert Hotline), 999
  (National Emergency Service), 333 (National Helpline), 16263 (Shastho Batayon),
  plus the four FFWC water-level warning bands and links to live forecasts.
- **Districts** — the 19 districts reported flood-affected in July 2024, with search.
- **Bilingual** — full English / বাংলা toggle (persisted), Bengali digits in বাংলা mode.
- **Data tools** — JSON export / import and typed-DELETE erase-all.
- **Offline & mobile** — zero network requests; verified at 390px with no overflow.

## Stack

Vanilla HTML / CSS / JavaScript. No build step, no dependencies, no framework.
`logic.js` is a pure engine (usable from Node and the browser); `i18n.js` holds the
UI strings; `app.js` is the DOM + localStorage layer.

## Prerequisites

Any modern browser. For tests: Node.js 20+ and a headless Chromium (the smoke test
uses the Playwright `headless_shell` binary if present).

## Install & run

```sh
# No install step. Open the app:
open index.html
# or serve it locally:
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Development commands

```sh
node --test tests/logic.test.js   # unit tests (pure engine)
node tests/smoke.js              # headless-Chrome smoke test (raw CDP)
```

## Testing

- `node --test tests/logic.test.js` — **15/15 pass**: water/food math, validation
  boundaries, go-bag progress, quiz scoring/levels, guide progress, FFWC levels,
  contacts, district filter, Bengali digits.
- `node tests/smoke.js` — **70/70 checks pass** in headless Chrome: defaults,
  calculator exact values (4×3 → 36 L drinking / 48 L total), validation errors,
  save + reload persistence, go-bag 12/24 = 50% + persistence, quiz 100/100 and
  90/100 with recommendations, guides 7/21 = 33%, contacts + warning levels,
  district search, export/erase/import round-trip, typed-DELETE erase, বাংলা
  toggle + persistence, 390px no-overflow on all 6 tabs, zero non-file network
  requests, zero console/page errors.

## Data & sources

See [DATA_NOTES.md](DATA_NOTES.md). Key facts are sourced, not invented:

- 1090 = National Disaster Alert Hotline (Ministry of Disaster Management and
  Relief) — Daily Star (Cyclone Fani, 2019) and TBS (July 2024 floods).
- 999 / 333 / 16263 — verified in the sibling factory project
  `emergency-helplines-bd` from Bangladeshi press reports, October 2026.
- FFWC warning bands (Normal / Warning / Flood / Severe flood) — Daily Star,
  "How to track floods online"; forecasts at www.ffwc.gov.bd.
- 19 flood-affected districts, July 2024 — The Business Standard, 7 July 2024.
- Water: 3 L drinking per person per day (WHO emergency planning figure).
  Food quantities are planning estimates, labelled as such in the app.

## Limitations

- This is an **unofficial preparedness guide**, not a government publication.
  It shows **no live data** — check ffwc.gov.bd or Google Flood Hub for today's
  forecast. In an emergency, call **999**.
- Water/food quantities are planning estimates for a typical family; adjust for
  children, elderly people, illness, and local conditions.
- The district list is a historical record of July 2024, not a live risk map.
- All data lives in the browser's localStorage on one device; clearing browser
  data erases it (export first).

## Status

Complete MVP — factory run #294, 17:00 slot, 2026-11-10. Published and verified:
live GitHub Pages site, HTTP 200.
