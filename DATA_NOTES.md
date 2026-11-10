# DATA_NOTES.md — flood-preparedness-bd (run #294, 2026-11-10)

Every fact in the app is either a labelled planning estimate or a sourced fact
below. Nothing is fetched live; the app is fully offline.

## Sourced facts

### Emergency numbers
- **1090 — National Disaster Alert Hotline**, Ministry of Disaster Management
  and Relief. Source: The Daily Star, "Govt opens hotline for updates on Fani"
  (toll-free hotline 1090 for cyclone updates); The Business Standard,
  7 July 2024 ("call 1090 or 333" for relief complaints). Also named the
  "National Disaster Alert Hotline (1090)" alongside 333 and 999 in Dhaka
  Tribune coverage of Cyclone Mocha (13 May 2023).
- **999 — National Emergency Service** (Police, Fire Service & Ambulance).
  **333 — National Helpline** (government information & services).
  **16263 — Shastho Batayon** (DGHS telehealth, free doctor advice 24/7).
  Source: sibling factory project `emergency-helplines-bd`, whose dataset was
  verified from Bangladeshi press reports (Daily Star, Dhaka Tribune, TBS),
  October 2026. The app repeats that project's caution: 2026 news reports
  flagged funding-related disruptions to 16263, so the service may be
  intermittent.

### FFWC warning levels
From The Daily Star, "How to track floods online": the Flood Forecasting &
Warning Centre (Bangladesh Water Development Board) rates river water levels
as Normal (more than 50 cm below danger level), Warning (within 50 cm below
danger level), Flood (above danger level), Severe flood (more than 1 m above
danger level). Forecasts: www.ffwc.gov.bd. Google Flood Hub is an AI flood
forecasting initiative using BWDB data (same article).

### Districts hit by the July 2024 floods
19 districts, per The Business Standard, 7 July 2024 ("Fresh flood hits three
districts, govt ensures adequate relief"): Sylhet, Sunamganj, Moulvibazar,
Habiganj, Netrakona, Rangpur, Gaibandha, Jamalpur, Feni, Rangamati, Bogura,
Kurigram, Sirajganj, Lalmonirhat, Cox's Bazar, Khagrachhari, Sherpur,
Bandarban, Tangail. Presented in the app as a historical record, explicitly
not a live risk map.

## Planning estimates (labelled as such in the app)

- **Drinking water: 3 L per person per day** — WHO emergency planning figure.
  Total water uses 4 L per person per day (drinking + basic hygiene).
- **Food per person per day:** rice 0.5 kg, dal 0.1 kg, chira 0.15 kg,
  salt 0.02 kg, biscuits 1 packet, ORS 1 packet. These are planning
  estimates for a typical adult diet, not nutritional requirements; the app
  says so.
- **"15 cm of moving water can knock you down"** — the widely published
  safety figure (US National Weather Service: 6 inches / ~15 cm of
  fast-moving water can knock a person down). Stated as general safety
  guidance in the During-flood guide.

## Go-bag, quiz, and guide content

Go-bag items, quiz questions, and Before/During/After steps are standard
emergency-preparedness guidance (Red Cross / FEMA-style household
preparedness), written for a Bangladeshi household. They are advice, not
official instructions; the app footer says it is an unofficial guide and to
follow official instructions in a real emergency.

## What was NOT used

- No live flood data, no river levels, no weather — the app cannot show them
  and does not pretend to. It links out to FFWC and Google Flood Hub instead.
- No district risk ranking: the 2024 list is historical only.
