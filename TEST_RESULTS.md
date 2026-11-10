# TEST_RESULTS.md — flood-preparedness-bd (run #294, 17:00 slot, 2026-11-10)

## Suites run (real, not invented)

| Suite | Command | Result |
|---|---|---|
| Node logic tests | `node --test tests/logic.test.js` | **15/15 pass** |
| Headless-Chrome smoke | `node tests/smoke.js` (raw CDP, headless_shell-1187) | **70/70 checks pass** |

## Hand-verified values

- 4 people × 3 days → drinking 36 L, hygiene 12 L, total 48 L.
  Food: rice 6 kg, dal 1.2 kg, chira 1.8 kg, salt 0.24 kg, biscuits 12 packets, ORS 12 packets.
- 1 person × 1 day → 3 L drinking / 4 L total; rice 0.5 kg, dal 0.1 kg, chira 0.2 kg
  (0.15 rounds to 0.2 at 1 decimal), salt 0.02 kg (2-decimal rounding keeps it visible).
- 5 people × 14 days → 35 kg rice, 70 biscuit packets.
- Validation: people 0 / 31 / 2.5 / NaN and days 0 / 15 / NaN all rejected with the
  right inline error; results hidden while invalid.
- Go-bag: 24 items, 5 categories, no duplicate ids. Progress 0/24 = 0%,
  12/24 = 50%, 24/24 = 100%; unknown ids ignored.
- Quiz: 0 yes = 0 at-risk (10 missing); 5 yes = 50 getting-there; 8 yes = 80 ready;
  10 yes = 100 ready, no fix list. One "no" on shelter → 90 + shelter recommendation.
- Guides: 21 steps total (7 per phase). Before phase complete → 7/21 = 33% overall.
- FFWC levels: Normal / Warning / Flood / Severe flood; severe = more than 1 m
  above danger level.
- Contacts: 1090, 999, 333, 16263 — tel: links verified.
- Districts: 19 (July 2024, TBS). Search "pur" → Rangpur, Jamalpur, Sherpur;
  "sylhet" → Sylhet; "xyz" → 0; case/space-insensitive ("  SUNAMGANJ " works).
- Bengali digits: 123 → ১২৩; 999 → ৯৯৯; 48 → ৪৮. BN toggle renders Bengali title
  and digits, persists across reload.
- Smoke: save plan → list 1 item → persists across reload → load restores inputs;
  go-bag 12/24 persists; quiz best 100 persists; export/erase/import round-trip
  restores data; wrong-app and malformed-JSON imports rejected with data intact;
  typed-DELETE erase works, wrong word rejected with data intact; 390px has zero
  horizontal overflow on all six tabs; zero non-file network requests;
  zero console/page errors.

## Repairs made (1 repair cycle)

- First smoke run: 62/70. Failures: 7 test-side (JSON.stringify has no spaces
  after colons, so payload assertions used the wrong strings; one `const s`
  redeclaration across two Runtime.evaluate calls threw) and 1 real app bug —
  the FFWC levels table inherited `white-space: nowrap` on its value column and
  overflowed 73px at 390px. Fixed with a `.wrap` table variant (normal wrapping,
  left-aligned). Re-ran both suites: 15/15 + 70/70, 0 errors.
- One unit-test expectation corrected first run: filterDistricts("pur") also
  matches "Sherpur" — the test was wrong, the code was right.
