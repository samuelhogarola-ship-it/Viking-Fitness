# Viking Fitness Multilingual Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build six independent Viking Fitness utility pages plus localized Sudoku entry pages in Spanish, English, Finnish, and Norwegian, with private local data, offline behavior, accessibility, and intensive multilingual SEO.

**Architecture:** Keep the site static and dependency-free. Put calculations and state transitions in small UMD modules that work in browsers and Node tests, keep DOM controllers tool-specific, and serve fully localized HTML on separate URLs. Share only the visual shell, safe storage/export helpers, navigation behavior, and per-tool data keys.

**Tech Stack:** Static HTML5, CSS, vanilla JavaScript, Web Audio API, Screen Wake Lock API, Service Worker, Web App Manifest, Node.js built-in `assert` tests.

**Spec:** `docs/superpowers/specs/2026-09-11-viking-fitness-tools-design.md`

## Global Constraints

- Remain static HTML, CSS, and JavaScript; add no framework, package manager, or runtime dependency.
- Spanish stays at root; English uses `/en/`, Finnish `/fi/`, and Norwegian `/no/`.
- Every localized page contains server-delivered primary content, a self-canonical, reciprocal `hreflang` for `es`, `en`, `fi`, `no`, and `x-default`, and truthful JSON-LD.
- All tools work without an account or backend.
- The calculator, timer, calorie counter, journal, current app, and Sudoku remain functionally independent.
- Never send health inputs, calculated results, food entries, exercise entries, body weight, or notes to analytics or another tool.
- Remove the rejected collective label from all user-visible copy, metadata, accessibility labels, and translation dictionaries.
- Keep the historical visual tone restrained; do not introduce fantasy role-playing mechanics.
- Preserve the untracked `.claude/` directory and unrelated user changes.
- Use versioned local-storage keys exactly as defined in the specification.
- Core functions require Node tests before their browser controllers are written.
- Each completed task ends with its focused tests and a commit.

---

### Task 1: Shared tools foundation and directory

**Files:**
- Create: `assets/css/tools.css`
- Create: `assets/js/tools-common.js`
- Create: `tests/tools-common.test.js`
- Create: `herramientas.html`
- Create: `en/tools.html`
- Create: `fi/tyokalut.html`
- Create: `no/verktoy.html`
- Modify: `index.html`
- Modify: `assets/js/i18n.js`
- Modify: `README.md`
- Modify: `metodo.html`
- Modify: `nutricion.html`
- Modify: `ciencia.html`
- Modify: `blog/index.html`
- Modify: `blog/4-tipos-de-cuerpo-alimentacion.html`
- Modify: `blog/5-desayunos-nordicos.html`
- Modify: `blog/5-almuerzos-nordicos.html`
- Modify: `blog/5-cenas-nordicas.html`
- Modify: `blog/creatina-fuerza.html`
- Modify: `blog/cafeina-preentreno.html`
- Modify: `blog/proteina-whey-comida-real.html`
- Modify: `blog/hidratacion-electrolitos-calor.html`
- Modify: `blog/rutina-fuerza-hipertrofia.html`
- Modify: `blog/recuperacion-sueno-descarga.html`
- Modify: `blog/menu-nordico-lunes.html`
- Modify: `blog/menu-nordico-martes.html`
- Modify: `blog/menu-nordico-miercoles.html`
- Modify: `blog/menu-nordico-jueves.html`
- Modify: `blog/menu-nordico-viernes.html`
- Modify: `blog/menu-nordico-sabado.html`
- Modify: `blog/menu-nordico-domingo.html`

**Interfaces:**
- Produces: `VFTools.safeStore(namespace)`, `VFTools.downloadBlob(filename, mime, text)`, `VFTools.readJsonFile(file)`, `VFTools.formatNumber(value, locale, digits)`, and `VFTools.setFieldError(input, message)`.
- Produces: shared classes `.tools-body`, `.tool-shell`, `.tool-card`, `.tool-form`, `.tool-result`, `.tool-guide`, `.tool-status`, `.related-tools`, and `.tool-actions`.
- Consumes: existing design variables and components from `assets/css/styles.css`.

- [ ] **Step 1: Write shared-helper tests**

Create `tests/tools-common.test.js` with fake storage and Blob-free helper checks:

```js
const assert = require('assert');
const tools = require('../assets/js/tools-common.js');

const memory = new Map();
const storage = {
  getItem: key => memory.has(key) ? memory.get(key) : null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: key => memory.delete(key),
};

const store = tools.safeStore('vf_test_v1', storage);
assert.deepStrictEqual(store.read({ entries: [] }), { entries: [] });
assert.strictEqual(store.write({ entries: [1] }), true);
assert.deepStrictEqual(store.read({ entries: [] }), { entries: [1] });
memory.set('vf_test_v1', '{broken');
assert.deepStrictEqual(store.read({ entries: [] }), { entries: [] });
assert.strictEqual(tools.formatNumber(1234.56, 'es-ES', 1), '1234,6');
const blocked = tools.safeStore('vf_blocked_v1', { getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); }, removeItem(){ throw new Error('blocked'); } });
assert.strictEqual(blocked.write({value:1}), false);
console.log('tools-common tests passed');
```

- [ ] **Step 2: Run the helper test and verify failure**

Run: `node tests/tools-common.test.js`

Expected: FAIL because `assets/js/tools-common.js` does not exist.

- [ ] **Step 3: Implement the shared helper module**

Use a UMD wrapper and dependency injection for storage:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VFTools = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function safeStore(namespace, storage) {
    const target = storage || window.localStorage;
    return {
      read(fallback) {
        try { return JSON.parse(target.getItem(namespace)) || fallback; }
        catch { return fallback; }
      },
      write(value) {
        try { target.setItem(namespace, JSON.stringify(value)); return true; }
        catch { return false; }
      },
      clear() {
        try { target.removeItem(namespace); return true; }
        catch { return false; }
      },
    };
  }
  return { safeStore, downloadBlob, readJsonFile, formatNumber, setFieldError };
});
```

Implement `downloadBlob` with `URL.createObjectURL`, a temporary `<a download>`, and `URL.revokeObjectURL`; implement `readJsonFile` with `file.text()` and `JSON.parse`; implement `setFieldError` with `aria-invalid` plus the field’s `[data-error-for]` element.

- [ ] **Step 4: Run the helper test and verify success**

Run: `node tests/tools-common.test.js`

Expected: `tools-common tests passed`.

- [ ] **Step 5: Build the shared responsive visual shell**

Create `assets/css/tools.css` using existing variables. The minimum grid and status behavior is:

```css
.tool-shell { width:min(1120px, calc(100% - 32px)); margin-inline:auto; padding:120px 0 72px; }
.tool-layout { display:grid; grid-template-columns:minmax(0, 1.1fr) minmax(280px, .9fr); gap:24px; align-items:start; }
.tool-card,.tool-guide { background:var(--stone); border:1px solid var(--line); border-radius:var(--radius); padding:clamp(20px,4vw,36px); }
.tool-status[hidden] { display:none; }
.tool-error { min-height:1.2em; color:#f0a6a6; font-size:.78rem; }
@media (max-width:760px) { .tool-layout { grid-template-columns:1fr; } .tool-shell { width:min(100% - 24px, 680px); } }
@media (prefers-reduced-motion:reduce) { .tools-body *, .tools-body *::before, .tools-body *::after { animation:none!important; transition:none!important; } }
```

Add large touch targets, visible `:focus-visible`, high-contrast results, responsive tables, print rules, breadcrumbs, directory cards, and related-tool cards.

- [ ] **Step 6: Create the four localized directory pages**

Create the exact URLs listed in the spec. Each page must include:

```html
<link rel="canonical" href="https://www.vikingfitness.es/herramientas.html">
<link rel="alternate" hreflang="es" href="https://www.vikingfitness.es/herramientas.html">
<link rel="alternate" hreflang="en" href="https://www.vikingfitness.es/en/tools.html">
<link rel="alternate" hreflang="fi" href="https://www.vikingfitness.es/fi/tyokalut.html">
<link rel="alternate" hreflang="no" href="https://www.vikingfitness.es/no/verktoy.html">
<link rel="alternate" hreflang="x-default" href="https://www.vikingfitness.es/herramientas.html">
```

Change canonical and visible language per file. Render seven cards in static HTML: 1RM, basal metabolism, timer, calories, journal, Sudoku, and the existing app. Add `CollectionPage`, `ItemList`, `BreadcrumbList`, and `WebSite` JSON-LD using only real URLs and no ratings.

- [ ] **Step 7: Expose the directory and perform the terminology cleanup**

Unhide or replace the existing resources section in `index.html`, link it to `/herramientas.html`, add the directory to the header/footer where space permits, and replace every user-visible occurrence returned by:

```bash
rg -ni '\x63\x6c\x61\x6e' --glob '*.html' --glob '*.js' --glob '*.md'
```

Use neutral alternatives such as “Viking Fitness”, “equipo”, “comunidad”, “seguimiento”, and their natural translations. Do not edit historical design documents solely to rewrite past decisions. Update `README.md` to describe the new directory and independent tools.

- [ ] **Step 8: Verify and commit Task 1**

Run:

```bash
node tests/tools-common.test.js
rg -ni '\x63\x6c\x61\x6e' --glob '*.html' --glob 'assets/js/*.js' --glob 'README.md'
git diff --check
```

Expected: helper test passes, the terminology scan returns no user-visible matches, and `git diff --check` is clean.

Commit:

```bash
git add assets/css/tools.css assets/js/tools-common.js tests/tools-common.test.js herramientas.html en/tools.html fi/tyokalut.html no/verktoy.html index.html assets/js/i18n.js README.md
git add '*.html' 'blog/*.html'
git commit -m "feat: add multilingual tools directory"
```

---

### Task 2: One-repetition maximum calculator

**Files:**
- Create: `assets/js/one-rm-engine.js`
- Create: `assets/js/one-rm.js`
- Create: `tests/one-rm-engine.test.js`
- Create: `calculadora-1rm.html`
- Create: `en/one-rep-max-calculator.html`
- Create: `fi/1rm-laskuri.html`
- Create: `no/1rm-kalkulator.html`

**Interfaces:**
- Produces: `VFOneRM.estimate(weight, reps) -> number`, `VFOneRM.roundLoad(value, unit) -> number`, `VFOneRM.percentages(oneRM, unit) -> Array<{percent, load}>`, and `VFOneRM.validate({weight,reps,unit}) -> {ok,errors}`.
- Consumes: `VFTools.formatNumber` and `VFTools.setFieldError`.

- [ ] **Step 1: Write failing engine tests**

```js
const assert = require('assert');
const oneRM = require('../assets/js/one-rm-engine.js');
assert.strictEqual(oneRM.estimate(100, 1), 100);
assert.ok(Math.abs(oneRM.estimate(100, 5) - 116.6667) < 0.001);
assert.strictEqual(oneRM.roundLoad(83.26, 'kg'), 83.5);
assert.strictEqual(oneRM.roundLoad(183.2, 'lb'), 183);
assert.strictEqual(oneRM.percentages(100, 'kg').length, 13);
assert.deepStrictEqual(oneRM.validate({ weight:100, reps:13, unit:'kg' }).errors, { reps:'range' });
console.log('one-rm engine tests passed');
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/one-rm-engine.test.js`

Expected: FAIL because the engine file does not exist.

- [ ] **Step 3: Implement the pure engine**

```js
function estimate(weight, reps) { return reps === 1 ? weight : weight * (1 + reps / 30); }
function roundLoad(value, unit) {
  const increment = unit === 'lb' ? 1 : 0.5;
  return Math.round(value / increment) * increment;
}
function percentages(oneRM, unit) {
  return Array.from({length:13}, (_, index) => {
    const percent = 40 + index * 5;
    return { percent, load:roundLoad(oneRM * percent / 100, unit) };
  });
}
```

Validate finite positive weight, integer repetitions 1–12, and `kg|lb` unit. Export with the same UMD pattern as the Sudoku engine.

- [ ] **Step 4: Run engine tests and verify success**

Run: `node tests/one-rm-engine.test.js`

Expected: `one-rm engine tests passed`.

- [ ] **Step 5: Create the controller and four localized pages**

Use identical IDs—`rmForm`, `rmWeight`, `rmReps`, `rmUnit`, `rmResult`, `rmTable`, `rmStatus`—and a localized inline `window.VFPageCopy` object for validation/status strings. On submit, validate, calculate, render the 1RM and 40–100% table, then focus the result heading. Do not persist lift data.

Each page includes localized explanatory content for the Epley formula, one worked example, limitations above 12 reps, a direct-max safety note, related links, and JSON-LD with `WebApplication`, `SportsApplication`, price `0`, and `EUR`.

- [ ] **Step 6: Smoke-test pages and commit Task 2**

Run:

```bash
node tests/one-rm-engine.test.js
for f in calculadora-1rm.html en/one-rep-max-calculator.html fi/1rm-laskuri.html no/1rm-kalkulator.html; do test -s "$f"; done
git diff --check
```

Commit:

```bash
git add assets/js/one-rm-engine.js assets/js/one-rm.js tests/one-rm-engine.test.js calculadora-1rm.html en/one-rep-max-calculator.html fi/1rm-laskuri.html no/1rm-kalkulator.html
git commit -m "feat: add multilingual 1RM calculator"
```

---

### Task 3: Basal metabolic rate calculator

**Files:**
- Create: `assets/js/basal-engine.js`
- Create: `assets/js/basal.js`
- Create: `tests/basal-engine.test.js`
- Create: `calculadora-metabolismo-basal.html`
- Create: `en/basal-metabolic-rate-calculator.html`
- Create: `fi/perusaineenvaihduntalaskuri.html`
- Create: `no/basalstoffskifte-kalkulator.html`

**Interfaces:**
- Produces: `VFBasal.toMetric(input)`, `VFBasal.bmr({sex,age,kg,cm})`, `VFBasal.tdee(bmr,factor)`, `VFBasal.goalRange(tdee,goal)`, and `VFBasal.validate(input)`.
- Consumes: shared formatting and error helpers; persists nothing.

- [ ] **Step 1: Write failing formula and validation tests**

```js
const assert = require('assert');
const basal = require('../assets/js/basal-engine.js');
assert.strictEqual(basal.bmr({ sex:'male', age:30, kg:80, cm:180 }), 1780);
assert.strictEqual(basal.bmr({ sex:'female', age:30, kg:60, cm:165 }), 1320.25);
assert.strictEqual(basal.tdee(1780, 1.55), 2759);
assert.deepStrictEqual(basal.goalRange(2500, 'loss'), { min:2000, max:2200 });
assert.deepStrictEqual(basal.goalRange(2500, 'gain'), { min:2700, max:2800 });
assert.ok(Math.abs(basal.toMetric({unit:'imperial', weight:176.3698, feet:5, inches:10}).kg - 80) < .01);
console.log('basal engine tests passed');
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/basal-engine.test.js`

Expected: FAIL because the engine file does not exist.

- [ ] **Step 3: Implement exact formulas and boundaries**

```js
const ACTIVITY = Object.freeze({ sedentary:1.2, light:1.375, moderate:1.55, high:1.725, veryHigh:1.9 });
function bmr({sex, age, kg, cm}) {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return base + (sex === 'male' ? 5 : -161);
}
function tdee(value, factor) { return Math.round(value * factor); }
function goalRange(value, goal) {
  if (goal === 'loss') return { min:value - 500, max:value - 300 };
  if (goal === 'gain') return { min:value + 200, max:value + 300 };
  return { min:value, max:value };
}
```

Validate age 18–100, metric/imperial dimensions, the explicit formula variable, supported activity values, and supported goals. Convert pounds with `0.45359237` and inches with `2.54`.

- [ ] **Step 4: Run engine tests and verify success**

Run: `node tests/basal-engine.test.js`

Expected: `basal engine tests passed`.

- [ ] **Step 5: Build controller and localized pages**

The controller swaps metric/imperial field groups without discarding current values, calculates only on submit, never writes inputs or results to storage, and renders BMR, maintenance, and the user-selected goal range. Use visible adult/medical limitations and do not preselect weight loss.

Each HTML page includes Mifflin–St Jeor equations, activity-factor table, worked example, uncertainty explanation, localized privacy notice, and authoritative source links. JSON-LD uses `WebApplication` plus `HealthApplication`, price `0`, and no medical claims.

- [ ] **Step 6: Verify and commit Task 3**

Run:

```bash
node tests/basal-engine.test.js
for f in calculadora-metabolismo-basal.html en/basal-metabolic-rate-calculator.html fi/perusaineenvaihduntalaskuri.html no/basalstoffskifte-kalkulator.html; do test -s "$f"; done
git diff --check
```

Commit all Task 3 files with `git commit -m "feat: add multilingual basal calculator"`.

---

### Task 4: Viking workout timer and isolated sound engine

**Files:**
- Create: `assets/js/timer-engine.js`
- Create: `assets/js/timer-audio.js`
- Create: `assets/js/timer.js`
- Create: `tests/timer-engine.test.js`
- Create: `temporizador-vikingo.html`
- Create: `en/viking-workout-timer.html`
- Create: `fi/viikinki-treeniajastin.html`
- Create: `no/viking-treningstimer.html`

**Interfaces:**
- Produces: `VFTimer.create(config, now)`, `VFTimer.start(state, now)`, `VFTimer.pause(state, now)`, `VFTimer.resume(state, now)`, `VFTimer.tick(state, now)`, and `VFTimer.reset(state)`.
- Produces browser-only `VFTimerAudio.horn()`, `VFTimerAudio.finish()`, and `VFTimerAudio.setVolume(value)`.
- Consumes `VFTools.safeStore('vf_viking_timer_v1')`; never consumes `VFAudio`.

- [ ] **Step 1: Write failing timestamp-based state tests**

```js
const assert = require('assert');
const timer = require('../assets/js/timer-engine.js');
let state = timer.create({ mode:'intervals', prep:3, work:30, rest:15, rounds:2 }, 0);
state = timer.start(state, 1000);
assert.strictEqual(timer.tick(state, 3000).remainingMs, 1000);
state = timer.tick(state, 4000);
assert.strictEqual(state.phase, 'work');
assert.strictEqual(state.round, 1);
state = timer.pause(state, 14000);
assert.strictEqual(timer.tick(state, 24000).remainingMs, state.remainingMs);
state = timer.resume(state, 24000);
assert.strictEqual(timer.tick(state, 44000).phase, 'rest');
const rest = timer.start(timer.create({mode:'rest',duration:60}, 0), 0);
assert.strictEqual(timer.tick(rest, 60000).status, 'complete');
const emom = timer.start(timer.create({mode:'emom',duration:60,rounds:3}, 0), 0);
assert.strictEqual(timer.tick(emom, 60000).round, 2);
assert.strictEqual(timer.tick(emom, 180000).status, 'complete');
console.log('timer engine tests passed');
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/timer-engine.test.js`

Expected: FAIL because the engine file does not exist.

- [ ] **Step 3: Implement immutable timer transitions**

Represent state with `{mode,status,phase,round,rounds,remainingMs,deadlineMs,pausedAtMs,config,event}`. `tick` derives remaining time from `deadlineMs - now`, advances through every elapsed phase in a loop, and returns `event:'work-start'|'rest-start'|'complete'|null` so the controller triggers sound exactly once.

Use these transitions:

```js
const nextPhase = {
  prep: state => enter(state, 'work', state.config.work * 1000),
  work: state => state.round >= state.rounds ? complete(state) : enter(state, 'rest', state.config.rest * 1000),
  rest: state => enter({...state, round:state.round + 1}, 'work', state.config.work * 1000),
};
```

Implement simple-rest and EMOM as explicit configurations rather than separate interval loops.

- [ ] **Step 4: Run state tests and verify success**

Run: `node tests/timer-engine.test.js`

Expected: `timer engine tests passed`.

- [ ] **Step 5: Implement isolated Web Audio signals**

Create an `AudioContext` only inside a Start-button call. Build the horn from a sawtooth fundamental, triangle sub-oscillator, low-pass filter, compressor, and gain envelope. Build completion from a short descending oscillator plus filtered-noise transient. Do not load YouTube or call any method on `window.VFAudio`.

- [ ] **Step 6: Build the controller and localized pages**

Use `requestAnimationFrame` while visible plus a 250 ms interval fallback. Recompute from timestamps on every tick and `visibilitychange`. Implement optional `navigator.vibrate`, Screen Wake Lock acquisition/release, persistent preferences, live phase announcements, and textual fallback when enhancements are unsupported.

Each localized page includes instructions for rest, intervals, and EMOM, safe volume guidance, an offline/privacy note, and `WebApplication` plus `SportsApplication` JSON-LD.

- [ ] **Step 7: Verify and commit Task 4**

Run `node tests/timer-engine.test.js`, serve locally, verify a 3-second prep followed by one horn and a distinct completion sound, switch tabs for at least one phase, then commit Task 4 files with `git commit -m "feat: add multilingual Viking workout timer"`.

---

### Task 5: Independent calorie counter

**Files:**
- Create: `assets/js/calorie-engine.js`
- Create: `assets/js/calorie-counter.js`
- Create: `tests/calorie-engine.test.js`
- Create: `contador-calorias.html`
- Create: `en/calorie-counter.html`
- Create: `fi/kalorilaskuri.html`
- Create: `no/kaloriteller.html`

**Interfaces:**
- Produces: `VFCalories.normalizeEntry(input)`, `VFCalories.entryTotals(entry)`, `VFCalories.dayTotals(entries,date)`, `VFCalories.weekSummary(entries,endDate)`, `VFCalories.toCsv(entries)`, and `VFCalories.validateState(value)`.
- Consumes: `VFTools.safeStore('vf_calorie_counter_v1')` and `VFTools.downloadBlob`.

- [ ] **Step 1: Write failing nutrition math and export tests**

```js
const assert = require('assert');
const calories = require('../assets/js/calorie-engine.js');
const entry = calories.normalizeEntry({id:'a',date:'2026-09-11',name:'Oats',grams:150,kcal100:379,p100:13.2,c100:67.7,f100:6.5});
assert.deepStrictEqual(calories.entryTotals(entry), {kcal:568.5,p:19.8,c:101.55,f:9.75});
assert.deepStrictEqual(calories.dayTotals([entry], '2026-09-11'), {kcal:568.5,p:19.8,c:101.55,f:9.75});
assert.match(calories.toCsv([entry]), /^date,name,grams,kcal,protein,carbohydrate,fat/m);
assert.strictEqual(calories.validateState({version:1,entries:[entry]}).ok, true);
console.log('calorie engine tests passed');
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/calorie-engine.test.js`

Expected: FAIL because the engine file does not exist.

- [ ] **Step 3: Implement immutable entries, totals, summaries, and exports**

Round stored nutrient inputs to two decimals and calculated totals to two decimals. Escape CSV fields by doubling quotes and quoting any value containing comma, quote, or newline:

```js
function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
```

Reject invalid dates, blank names, grams outside 1–3000, negative nutrient values, duplicate IDs, and incompatible state versions.

- [ ] **Step 4: Run engine tests and verify success**

Run: `node tests/calorie-engine.test.js`

Expected: `calorie engine tests passed`.

- [ ] **Step 5: Build the controller and localized pages**

Initialize state as `{version:1,entries:[]}`. Provide custom entry, localized starter-food selector, edit, duplicate, delete, date navigation, totals, seven-day summary, JSON/CSV export, clear-day, and clear-all. Before rendering the first form, test a write/remove probe; if it fails, show persistent temporary-mode status.

All destructive actions require confirmation. The controller writes only to `vf_calorie_counter_v1`. Localized pages explain per-100-g input, worked arithmetic, calorie limitations, and privacy. JSON-LD uses `WebApplication` plus `HealthApplication`.

- [ ] **Step 6: Verify and commit Task 5**

Run the engine test, manually add a 150 g food, reload, change language, verify the same record, export CSV/JSON, verify no record appears in `vf_saga_v1` or `vf_warrior_journal_v1`, then commit with `git commit -m "feat: add multilingual calorie counter"`.

---

### Task 6: Independent Warrior journal

**Files:**
- Create: `assets/js/journal-engine.js`
- Create: `assets/js/warrior-journal.js`
- Create: `tests/journal-engine.test.js`
- Create: `diario-guerrero.html`
- Create: `en/warrior-journal.html`
- Create: `fi/soturin-paivakirja.html`
- Create: `no/krigerens-dagbok.html`

**Interfaces:**
- Produces: `VFJournal.exerciseVolume(exercise)`, `VFJournal.dayVolume(day)`, `VFJournal.validateBackup(value)`, `VFJournal.merge(current,incoming)`, `VFJournal.replace(current,incoming)`, and `VFJournal.exportBackup(state)`.
- Consumes: `VFTools.safeStore('vf_warrior_journal_v1')`, `VFTools.readJsonFile`, and `VFTools.downloadBlob`.

- [ ] **Step 1: Write failing journal tests**

```js
const assert = require('assert');
const journal = require('../assets/js/journal-engine.js');
const day = {id:'d1',date:'2026-09-11',exercises:[{id:'e1',name:'Squat',sets:3,reps:5,kg:100}],meals:'Salmon',weight:80,notes:''};
assert.strictEqual(journal.exerciseVolume(day.exercises[0]), 1500);
assert.strictEqual(journal.dayVolume(day), 1500);
const backup = {version:1,days:[day]};
assert.strictEqual(journal.validateBackup(backup).ok, true);
assert.deepStrictEqual(journal.merge({version:1,days:[]}, backup).days, [day]);
assert.throws(() => journal.merge(backup, backup), /duplicate/i);
assert.deepStrictEqual(JSON.parse(journal.exportBackup(backup)), backup);
console.log('journal engine tests passed');
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/journal-engine.test.js`

Expected: FAIL because the engine file does not exist.

- [ ] **Step 3: Implement validation, volume, merge, replace, and backup**

State is `{version:1,days:Day[]}`. A `Day` has `id`, ISO `date`, `exercises`, `meals`, nullable `weight`, and `notes`. Validate unique day and exercise IDs, one day record per date, finite body weight from 20–350 kg, integer sets from 1–30, integer repetitions from 1–100, exercise load from 0–1000 kg, exercise names up to 120 characters, and meal/notes fields up to 5000 characters each. Sort days descending by date after every merge.

`merge` throws on duplicate IDs or duplicate dates. `replace` returns a deep validated clone. `exportBackup` emits pretty JSON with a trailing newline.

- [ ] **Step 4: Run engine tests and verify success**

Run: `node tests/journal-engine.test.js`

Expected: `journal engine tests passed`.

- [ ] **Step 5: Build controller and localized pages**

Implement today/date navigation, dynamic exercise rows, meal/weight/notes fields, save/edit/delete, history, daily volume, printable day, JSON export, and JSON import. Import first displays `{dayCount, firstDate, lastDate}` and asks Merge or Replace; no storage write occurs before the selection and confirmation.

Use only `vf_warrior_journal_v1`. Localized pages explain journaling, volume calculation, backups, local privacy, and the intentional separation from the calorie counter and current app. JSON-LD uses `WebApplication` plus `SportsApplication`.

- [ ] **Step 6: Verify and commit Task 6**

Run the engine test, create two dated records, edit one, export/import into a cleared store, verify round trip and language continuity, confirm no calorie/app keys change, test print preview, then commit with `git commit -m "feat: add multilingual Warrior journal"`.

---

### Task 7: Localize Viking Sudoku without splitting progress

**Files:**
- Create: `assets/js/sudoku-copy.js`
- Create: `en/viking-sudoku.html`
- Create: `fi/viikinki-sudoku.html`
- Create: `no/viking-sudoku.html`
- Modify: `sudoku.html`
- Modify: `assets/js/sudoku.js`
- Modify: `tests/sudoku-engine.test.js`
- Create: `tests/sudoku-locales.test.js`

**Interfaces:**
- Produces: `VFSudokuCopy[lang]` with every controller message and label required by `assets/js/sudoku.js`.
- Consumes: the unchanged puzzle engine and existing Sudoku storage/progress endpoints.

- [ ] **Step 1: Write failing locale-completeness tests**

```js
const assert = require('assert');
const copy = require('../assets/js/sudoku-copy.js');
const languages = ['es','en','fi','no'];
const required = ['easy','medium','hard','chooseCell','correct','incorrect','complete','lost','offline','loginPrompt','logout'];
for (const lang of languages) {
  for (const key of required) assert.ok(copy[lang][key], `${lang}.${key}`);
}
console.log('sudoku locale tests passed');
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/sudoku-locales.test.js`

Expected: FAIL because `sudoku-copy.js` does not exist.

- [ ] **Step 3: Implement locale data and refactor controller messages**

Export the four complete locale objects with UMD. In `sudoku.js`, select:

```js
const lang = document.documentElement.lang.split('-')[0];
const copy = VFSudokuCopy[lang] || VFSudokuCopy.es;
```

Replace hardcoded interface messages and generated option text with `copy` keys. Do not rename puzzle level IDs (`facil`, `medio`, `dificil`) or storage keys because they are internal stable identifiers.

- [ ] **Step 4: Run Sudoku tests and verify success**

Run:

```bash
node tests/sudoku-engine.test.js
node tests/sudoku-locales.test.js
```

Expected: both pass.

- [ ] **Step 5: Create localized entry pages**

Each page contains translated visible controls and long-form game guidance, correct `lang`, canonical, reciprocal alternates, Open Graph locale, and JSON-LD. Keep the same board/controller IDs and load `sudoku-copy.js` before `sudoku.js`.

- [ ] **Step 6: Verify progress continuity and commit Task 7**

Complete or seed one puzzle in Spanish, load each other language, verify the same completion and best time, test offline play and optional-login failure, then commit with `git commit -m "feat: localize Viking Sudoku pages"`.

---

### Task 8: Multilingual SEO, sitemap, privacy, PWA, and offline integration

**Files:**
- Create: `tests/tools-seo.test.js`
- Modify: `sitemap.xml`
- Modify: `robots.txt`
- Modify: `sw.js`
- Modify: `manifest.json`
- Modify: `privacidad.html`
- Modify: every new tool and localized Sudoku page if the audit finds a mismatch

**Interfaces:**
- Consumes: all canonical page clusters from Tasks 1–7.
- Produces: a sitemap that contains each canonical and all reciprocal alternates; cache version `viking-fitness-pwa-v12` or the next unused version.

- [ ] **Step 1: Write failing SEO coverage tests**

Create a Node test using `fs.readFileSync` and regex checks. Define the exact seven clusters from the spec, then assert for each file:

```js
assert.match(html, new RegExp(`<html[^>]+lang=["']${lang}`));
assert.strictEqual((html.match(/<h1\b/g) || []).length, 1);
assert.match(html, new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']${escape(url)}`));
for (const alternate of cluster) assert.match(html, new RegExp(`hreflang=["']${alternate.lang}["'][^>]+${escape(alternate.url)}`));
assert.doesNotThrow(() => JSON.parse(jsonLdText));
```

Also assert unique non-empty titles/descriptions per language, `x-default` to Spanish, every canonical in `sitemap.xml`, no `noindex`, and no rejected user-visible terminology.

- [ ] **Step 2: Run the SEO test and verify failure**

Run: `node tests/tools-seo.test.js`

Expected: FAIL because the sitemap, alternates, or metadata are not yet complete.

- [ ] **Step 3: Complete metadata and structured data**

Fix every reported page. Each JSON-LD block must parse and match visible facts. Use `WebApplication` with price `0`, currency `EUR`, `operatingSystem:"Any"`, correct category, and `inLanguage`. Do not add ratings. Add localized breadcrumbs and related links.

- [ ] **Step 4: Build the multilingual sitemap**

Add `xmlns:xhtml="http://www.w3.org/1999/xhtml"` to `<urlset>`. For each canonical in a cluster, add all five alternate links, including self and Spanish `x-default`:

```xml
<url>
  <loc>https://www.vikingfitness.es/calculadora-1rm.html</loc>
  <lastmod>2026-09-11</lastmod>
  <xhtml:link rel="alternate" hreflang="es" href="https://www.vikingfitness.es/calculadora-1rm.html"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://www.vikingfitness.es/en/one-rep-max-calculator.html"/>
  <xhtml:link rel="alternate" hreflang="fi" href="https://www.vikingfitness.es/fi/1rm-laskuri.html"/>
  <xhtml:link rel="alternate" hreflang="no" href="https://www.vikingfitness.es/no/1rm-kalkulator.html"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://www.vikingfitness.es/calculadora-1rm.html"/>
</url>
```

Repeat with exact URLs for all clusters. Keep existing site URLs. Confirm `robots.txt` names `https://www.vikingfitness.es/sitemap.xml`.

- [ ] **Step 5: Update privacy, manifest, and service worker**

Add a Spanish privacy section describing calculation-only pages, per-tool browser storage, exports, and deletion. Add manifest shortcuts for `/herramientas.html` and `/temporizador-vikingo.html` while retaining Home and Sudoku. Add all shared tool assets and Spanish tool entry pages to `OFFLINE_ASSETS`; allow visited localized navigations to populate the runtime cache. Use a neutral offline fallback chosen from cached request, localized directory, Spanish directory, then Sudoku.

- [ ] **Step 6: Run SEO and regression tests**

Run:

```bash
node tests/tools-common.test.js
node tests/one-rm-engine.test.js
node tests/basal-engine.test.js
node tests/timer-engine.test.js
node tests/calorie-engine.test.js
node tests/journal-engine.test.js
node tests/sudoku-engine.test.js
node tests/sudoku-locales.test.js
node tests/tools-seo.test.js
git diff --check
```

Expected: all tests pass and the diff check is clean.

- [ ] **Step 7: Commit Task 8**

```bash
git add tests/tools-seo.test.js sitemap.xml robots.txt sw.js manifest.json privacidad.html
git add herramientas.html calculadora-1rm.html calculadora-metabolismo-basal.html temporizador-vikingo.html contador-calorias.html diario-guerrero.html sudoku.html en fi no
git commit -m "feat: integrate multilingual tools SEO and offline support"
```

---

### Task 9: End-to-end verification and release readiness

**Files:**
- Modify only files proven defective by verification.
- Update: `README.md` if actual commands or behavior differ from its Task 1 documentation.

**Interfaces:**
- Consumes the complete site produced by Tasks 1–8.
- Produces evidence that every explicit requirement in the design spec is satisfied.

- [ ] **Step 1: Start a local HTTP server**

Run: `python3 -m http.server 8000`

Expected: server listens at `http://localhost:8000` with no startup error.

- [ ] **Step 2: Run the complete automated suite**

Run every Node command from Task 8 Step 6. Record exact failures, fix only proven defects, and rerun the failing test followed by the full suite.

- [ ] **Step 3: Crawl every new URL**

Request all 28 directory/tool/Sudoku URLs from the local server. Require HTTP 200, HTML content type, one title, one `h1`, self-canonical, and no broken local CSS/JS/image reference. Check all internal links resolve to a file or valid fragment.

- [ ] **Step 4: Verify user flows in a browser**

At desktop and mobile viewport sizes:

1. Calculate 100 kg × 5 and verify the result rounds to 116.5 kg plus a 13-row percentage table.
2. Calculate the reference male and female basal cases and verify 1780 and 1320.25 before display rounding.
3. Run a two-round 3/5/3 interval, background the tab, and verify timestamp correction, one start horn per work phase, and one distinct completion signal.
4. Add, edit, duplicate, delete, navigate dates, and export a calorie entry.
5. Create, edit, print, export, clear, and re-import two journal days.
6. Change language for each tool and verify state continuity only where the spec permits persistence.
7. Play Sudoku in every language and verify shared progress.
8. Turn off the network after first visits and reload each tool.

- [ ] **Step 5: Verify accessibility and reduced-motion behavior**

Complete every flow by keyboard, inspect visible focus, confirm labels and errors, verify live result/timer status, enable reduced motion, mute sound, and confirm text conveys every phase and result.

- [ ] **Step 6: Audit privacy and isolation**

Inspect local storage before and after each flow. Require only these relevant keys: `vf_viking_timer_v1`, `vf_calorie_counter_v1`, `vf_warrior_journal_v1`, existing `vf_saga_v1`, and existing Sudoku keys. Confirm calculator inputs are absent and each persistent tool changes only its own store.

- [ ] **Step 7: Audit terminology and Git scope**

Run the approved terminology scan across user-visible sources, `git diff --check`, and `git status --short`. Confirm `.claude/` remains untracked and untouched. Inspect the commit range to ensure no unrelated file was added.

- [ ] **Step 8: Commit verification fixes**

If verification required changes, stage only those files and commit with:

```bash
git commit -m "fix: complete multilingual tools verification"
```

If no files changed, do not create an empty commit.
