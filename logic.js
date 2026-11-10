/* flood-preparedness-bd -- pure logic engine (no DOM, no network).
 * Works in Node (require) and in the browser (window.FP).
 * All quantities are PLANNING ESTIMATES, labelled as such in the UI.
 * Sources for facts: see DATA_NOTES.md.
 */
"use strict";

const FP = {};

// ---- constants (planning basis, see DATA_NOTES.md) ----
FP.DRINKING_LITRES_PER_PERSON_PER_DAY = 3;   // WHO emergency planning figure
FP.TOTAL_LITRES_PER_PERSON_PER_DAY = 4;      // drinking + basic hygiene
FP.RICE_KG_PER_PERSON_PER_DAY = 0.5;
FP.DAL_KG_PER_PERSON_PER_DAY = 0.1;
FP.CHIRA_KG_PER_PERSON_PER_DAY = 0.15;
FP.SALT_KG_PER_PERSON_PER_DAY = 0.02;
FP.BISCUIT_PACKETS_PER_PERSON_PER_DAY = 1;
FP.ORS_PACKETS_PER_PERSON_PER_DAY = 1;
FP.MAX_PEOPLE = 30;
FP.MAX_DAYS = 14;

// ---- validation ----
FP.validateCalc = function (people, days) {
  const errors = [];
  if (!Number.isInteger(people) || people < 1) errors.push("people");
  if (people > FP.MAX_PEOPLE) errors.push("peopleMax");
  if (!Number.isInteger(days) || days < 1) errors.push("days");
  if (days > FP.MAX_DAYS) errors.push("daysMax");
  return errors;
};

// ---- water & food calculator ----
FP.waterNeeds = function (people, days) {
  const drinking = people * days * FP.DRINKING_LITRES_PER_PERSON_PER_DAY;
  const total = people * days * FP.TOTAL_LITRES_PER_PERSON_PER_DAY;
  return { drinkingLitres: drinking, hygieneLitres: total - drinking, totalLitres: total };
};

FP.foodNeeds = function (people, days) {
  const round1 = (n) => Math.round(n * 10) / 10;
  const round2 = (n) => Math.round(n * 100) / 100;
  return [
    { id: "rice", qty: round1(people * days * FP.RICE_KG_PER_PERSON_PER_DAY), unit: "kg" },
    { id: "dal", qty: round1(people * days * FP.DAL_KG_PER_PERSON_PER_DAY), unit: "kg" },
    { id: "chira", qty: round1(people * days * FP.CHIRA_KG_PER_PERSON_PER_DAY), unit: "kg" },
    { id: "salt", qty: round2(people * days * FP.SALT_KG_PER_PERSON_PER_DAY), unit: "kg" },
    { id: "biscuits", qty: people * days * FP.BISCUIT_PACKETS_PER_PERSON_PER_DAY, unit: "packets" },
    { id: "ors", qty: people * days * FP.ORS_PACKETS_PER_PERSON_PER_DAY, unit: "packets" },
  ];
};

// ---- go-bag (24 items, 5 categories) ----
FP.GO_BAG = [
  { id: "documents", items: [
    { id: "nid-copies", qtyEn: "1 set per person", qtyBn: "প্রতিজনে ১ সেট" },
    { id: "cash-pouch", qtyEn: "Small notes", qtyBn: "ছোট নোট" },
    { id: "house-papers", qtyEn: "1 set", qtyBn: "১ সেট" },
    { id: "medical-papers", qtyEn: "1 set", qtyBn: "১ সেট" },
  ]},
  { id: "water-food", items: [
    { id: "water-bottles", qtyEn: "3 L per person", qtyBn: "প্রতিজনে ৩ লিটার" },
    { id: "dry-food", qtyEn: "3 days' worth", qtyBn: "৩ দিনের মতো" },
    { id: "ors-packets", qtyEn: "1 per person per day", qtyBn: "প্রতিজনে প্রতিদিন ১টি" },
    { id: "salt", qtyEn: "1 small pack", qtyBn: "১ ছোট প্যাকেট" },
    { id: "milk-powder", qtyEn: "1 pack", qtyBn: "১ প্যাকেট" },
  ]},
  { id: "health", items: [
    { id: "first-aid", qtyEn: "1 kit", qtyBn: "১টি কিট" },
    { id: "medicines", qtyEn: "7 days' supply", qtyBn: "৭ দিনের ওষুধ" },
    { id: "mosquito", qtyEn: "1 coil / repellent", qtyBn: "১টি কয়েল / রিপেলেন্ট" },
    { id: "sanitary", qtyEn: "As needed", qtyBn: "প্রয়োজন মতো" },
    { id: "soap", qtyEn: "2 bars", qtyBn: "২টি" },
  ]},
  { id: "tools", items: [
    { id: "torch", qtyEn: "1 + spare batteries", qtyBn: "১টি + বাড়তি ব্যাটারি" },
    { id: "power-bank", qtyEn: "1, fully charged", qtyBn: "১টি, পুরো চার্জ" },
    { id: "whistle", qtyEn: "1 per person", qtyBn: "প্রতিজনে ১টি" },
    { id: "rope", qtyEn: "1 length", qtyBn: "১টি" },
    { id: "matches", qtyEn: "1 waterproof pack", qtyBn: "১টি জলরোধী প্যাকেট" },
  ]},
  { id: "family", items: [
    { id: "baby-items", qtyEn: "As needed", qtyBn: "প্রয়োজন মতো" },
    { id: "clothes", qtyEn: "1 set per person", qtyBn: "প্রতিজনে ১ সেট" },
    { id: "blanket", qtyEn: "1 per person", qtyBn: "প্রতিজনে ১টি" },
    { id: "phone-numbers", qtyEn: "1 written list", qtyBn: "১টি লিখিত তালিকা" },
    { id: "spare-keys", qtyEn: "1 set", qtyBn: "১ সেট" },
  ]},
];

FP.goBagTotal = function () {
  return FP.GO_BAG.reduce((n, c) => n + c.items.length, 0);
};

FP.goBagProgress = function (checkedIds) {
  const total = FP.goBagTotal();
  const set = new Set(checkedIds || []);
  let done = 0;
  FP.GO_BAG.forEach((c) => c.items.forEach((it) => { if (set.has(it.id)) done++; }));
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
};

// ---- readiness quiz (10 questions) ----
FP.QUIZ = [
  { id: "shelter" }, { id: "gobag" }, { id: "documents" }, { id: "hotline" },
  { id: "water" }, { id: "meeting-point" }, { id: "utilities" }, { id: "phone" },
  { id: "levels" }, { id: "first-aid" },
];

FP.quizScore = function (answers) {
  // answers: { questionId: true/false } — true = yes
  let yes = 0;
  FP.QUIZ.forEach((q) => { if (answers && answers[q.id] === true) yes++; });
  const score = yes * 10;
  const level = score >= 80 ? "ready" : score >= 50 ? "getting-there" : "at-risk";
  const missing = FP.QUIZ.filter((q) => !(answers && answers[q.id] === true)).map((q) => q.id);
  return { score, yes, total: FP.QUIZ.length, level, missing };
};

// ---- guides: Before / During / After (7 steps each) ----
FP.GUIDES = {
  before: ["monitor", "documents-up", "store-water", "charge", "shelter-route", "family-plan", "valuables"],
  during: ["higher-ground", "no-wading", "no-drink", "electricity", "children", "boil", "stay-informed"],
  after: ["all-clear", "inspect", "clean", "boil-after", "snakes", "medical", "report"],
};

FP.guideProgress = function (checkedIds) {
  const set = new Set(checkedIds || []);
  const out = {};
  let doneAll = 0, totalAll = 0;
  Object.keys(FP.GUIDES).forEach((phase) => {
    const steps = FP.GUIDES[phase];
    const done = steps.filter((s) => set.has(phase + ":" + s)).length;
    out[phase] = { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
    doneAll += done; totalAll += steps.length;
  });
  out.all = { done: doneAll, total: totalAll, pct: Math.round((doneAll / totalAll) * 100) };
  return out;
};

// ---- FFWC warning levels (Daily Star: "How to track floods online") ----
FP.WARNING_LEVELS = [
  { id: "normal", ruleEn: "Water more than 50 cm below danger level", ruleBn: "পানি বিপৎসীমার ৫০ সেমি নিচে" },
  { id: "warning", ruleEn: "Water within 50 cm below danger level", ruleBn: "পানি বিপৎসীমার ৫০ সেমির মধ্যে" },
  { id: "flood", ruleEn: "Water above danger level", ruleBn: "পানি বিপৎসীমার উপরে" },
  { id: "severe", ruleEn: "Water more than 1 m above danger level", ruleBn: "পানি বিপৎসীমার ১ মিটারের বেশি উপরে" },
];

// ---- emergency contacts (verified: see DATA_NOTES.md) ----
FP.CONTACTS = [
  { id: "1090", number: "1090", tel: "1090" },
  { id: "999", number: "999", tel: "999" },
  { id: "333", number: "333", tel: "333" },
  { id: "16263", number: "16263", tel: "16263" },
];

// ---- districts hit by the July 2024 floods (TBS, 2024-07-07) ----
FP.DISTRICTS_2024 = [
  "Sylhet", "Sunamganj", "Moulvibazar", "Habiganj", "Netrakona",
  "Rangpur", "Gaibandha", "Jamalpur", "Feni", "Rangamati",
  "Bogura", "Kurigram", "Sirajganj", "Lalmonirhat", "Cox's Bazar",
  "Khagrachhari", "Sherpur", "Bandarban", "Tangail",
];

FP.filterDistricts = function (query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return FP.DISTRICTS_2024.slice();
  return FP.DISTRICTS_2024.filter((d) => d.toLowerCase().includes(q));
};

// ---- number formatting (Bengali digits) ----
FP.BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
FP.toBn = function (value) {
  return String(value).replace(/[0-9]/g, (d) => FP.BN_DIGITS[Number(d)]);
};
FP.fmt = function (value, lang) {
  return lang === "bn" ? FP.toBn(value) : String(value);
};
// Lakh-style grouping for litres/kg display: plain en-US grouping is fine for
// small numbers; keep it simple and exact.
FP.fmtNum = function (value, lang) {
  const s = String(value);
  return lang === "bn" ? FP.toBn(s) : s;
};

if (typeof module !== "undefined" && module.exports) module.exports = FP;
if (typeof window !== "undefined") window.FP = FP;
