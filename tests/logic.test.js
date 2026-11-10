// flood-preparedness-bd -- node unit tests for logic.js (pure engine).
// Run: node --test tests/logic.test.js
// All expected values were hand-computed; see TEST_RESULTS.md.
const test = require("node:test");
const assert = require("node:assert/strict");
const FP = require("../logic.js");

const allBagIds = () => FP.GO_BAG.flatMap((c) => c.items.map((i) => i.id));

test("waterNeeds: 4 people x 3 days = 36 L drinking, 12 L hygiene, 48 L total", () => {
  assert.deepEqual(FP.waterNeeds(4, 3), { drinkingLitres: 36, hygieneLitres: 12, totalLitres: 48 });
});

test("waterNeeds: 1 person x 1 day = 3 / 1 / 4", () => {
  assert.deepEqual(FP.waterNeeds(1, 1), { drinkingLitres: 3, hygieneLitres: 1, totalLitres: 4 });
});

test("waterNeeds: 2 people x 7 days = 42 drinking, 56 total", () => {
  const w = FP.waterNeeds(2, 7);
  assert.equal(w.drinkingLitres, 42);
  assert.equal(w.totalLitres, 56);
  assert.equal(w.hygieneLitres, 14);
});

test("foodNeeds: 4 people x 3 days", () => {
  const byId = {};
  FP.foodNeeds(4, 3).forEach((f) => { byId[f.id] = f.qty; });
  assert.equal(byId.rice, 6);
  assert.equal(byId.dal, 1.2);
  assert.equal(byId.chira, 1.8);
  assert.equal(byId.salt, 0.24);
  assert.equal(byId.biscuits, 12);
  assert.equal(byId.ors, 12);
});

test("foodNeeds: 1 person x 1 day keeps salt visible (0.02 kg)", () => {
  const byId = {};
  FP.foodNeeds(1, 1).forEach((f) => { byId[f.id] = f.qty; });
  assert.equal(byId.rice, 0.5);
  assert.equal(byId.dal, 0.1);
  assert.equal(byId.chira, 0.2); // 0.15 rounds to 0.2 at 1 decimal
  assert.equal(byId.salt, 0.02);
  assert.equal(byId.biscuits, 1);
  assert.equal(byId.ors, 1);
});

test("foodNeeds: 5 people x 14 days = 35 kg rice", () => {
  const byId = {};
  FP.foodNeeds(5, 14).forEach((f) => { byId[f.id] = f.qty; });
  assert.equal(byId.rice, 35);
  assert.equal(byId.biscuits, 70);
});

test("validateCalc: valid, zero, over-max, non-integer", () => {
  assert.deepEqual(FP.validateCalc(4, 3), []);
  assert.deepEqual(FP.validateCalc(0, 3), ["people"]);
  assert.deepEqual(FP.validateCalc(31, 3), ["peopleMax"]);
  assert.deepEqual(FP.validateCalc(4, 0), ["days"]);
  assert.deepEqual(FP.validateCalc(4, 15), ["daysMax"]);
  assert.deepEqual(FP.validateCalc(2.5, 3), ["people"]);
  assert.deepEqual(FP.validateCalc(NaN, 3), ["people"]);
  assert.deepEqual(FP.validateCalc(4, NaN), ["days"]);
});

test("go-bag has 24 items across 5 categories", () => {
  assert.equal(FP.GO_BAG.length, 5);
  assert.equal(FP.goBagTotal(), 24);
  assert.equal(allBagIds().length, 24);
  assert.equal(new Set(allBagIds()).size, 24); // no duplicate ids
});

test("goBagProgress: 0, half, full", () => {
  assert.deepEqual(FP.goBagProgress([]), { done: 0, total: 24, pct: 0 });
  assert.deepEqual(FP.goBagProgress(allBagIds().slice(0, 12)), { done: 12, total: 24, pct: 50 });
  assert.deepEqual(FP.goBagProgress(allBagIds()), { done: 24, total: 24, pct: 100 });
  assert.deepEqual(FP.goBagProgress(["no-such-item"]), { done: 0, total: 24, pct: 0 });
});

test("quizScore: empty = 0 at-risk; 5 yes = 50 getting-there; 8 yes = 80 ready; all = 100", () => {
  assert.deepEqual(FP.quizScore({}), { score: 0, yes: 0, total: 10, level: "at-risk", missing: FP.QUIZ.map((q) => q.id) });
  const five = {};
  FP.QUIZ.slice(0, 5).forEach((q) => { five[q.id] = true; });
  const r5 = FP.quizScore(five);
  assert.equal(r5.score, 50);
  assert.equal(r5.level, "getting-there");
  assert.equal(r5.missing.length, 5);
  const eight = {};
  FP.QUIZ.slice(0, 8).forEach((q) => { eight[q.id] = true; });
  assert.equal(FP.quizScore(eight).score, 80);
  assert.equal(FP.quizScore(eight).level, "ready");
  const all = {};
  FP.QUIZ.forEach((q) => { all[q.id] = true; });
  assert.deepEqual(FP.quizScore(all), { score: 100, yes: 10, total: 10, level: "ready", missing: [] });
});

test("guideProgress: empty, one phase complete, overall 7/21 = 33%", () => {
  const empty = FP.guideProgress([]);
  assert.equal(empty.all.done, 0);
  assert.equal(empty.all.total, 21);
  assert.equal(empty.all.pct, 0);
  const before = FP.GUIDES.before.map((s) => "before:" + s);
  const p = FP.guideProgress(before);
  assert.deepEqual(p.before, { done: 7, total: 7, pct: 100 });
  assert.equal(p.during.done, 0);
  assert.equal(p.all.done, 7);
  assert.equal(p.all.pct, 33);
});

test("warning levels: 4 levels, severe is >1 m above danger level", () => {
  assert.equal(FP.WARNING_LEVELS.length, 4);
  assert.deepEqual(FP.WARNING_LEVELS.map((l) => l.id), ["normal", "warning", "flood", "severe"]);
  assert.match(FP.WARNING_LEVELS[3].ruleEn, /1 m above danger level/);
});

test("contacts: 1090, 999, 333, 16263", () => {
  assert.deepEqual(FP.CONTACTS.map((c) => c.number), ["1090", "999", "333", "16263"]);
});

test("districts 2024: 19 districts, filter works", () => {
  assert.equal(FP.DISTRICTS_2024.length, 19);
  assert.deepEqual(FP.filterDistricts(""), FP.DISTRICTS_2024);
  assert.deepEqual(FP.filterDistricts("sylhet"), ["Sylhet"]);
  assert.deepEqual(FP.filterDistricts("pur"), ["Rangpur", "Jamalpur", "Sherpur"]);
  assert.deepEqual(FP.filterDistricts("xyz"), []);
  assert.deepEqual(FP.filterDistricts("  SUNAMGANJ "), ["Sunamganj"]);
});

test("Bengali digits: toBn and fmtNum", () => {
  assert.equal(FP.toBn(123), "১২৩");
  assert.equal(FP.toBn("999"), "৯৯৯");
  assert.equal(FP.toBn("48 L"), "৪৮ L");
  assert.equal(FP.fmtNum(48, "bn"), "৪৮");
  assert.equal(FP.fmtNum(48, "en"), "48");
});
