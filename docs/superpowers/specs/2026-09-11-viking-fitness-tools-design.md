# Viking Fitness Multilingual Tools — Design

**Date:** 2026-09-11
**Status:** Approved in conversation; pending review of this written specification

## Goal

Add a collection of simple, useful, entertaining Viking Fitness tools that work independently, load quickly, preserve user privacy, and attract organic search traffic in Spanish, English, Finnish, and Norwegian.

The collection consists of:

1. Tools directory
2. One-repetition maximum calculator
3. Basal metabolic rate calculator
4. Viking workout timer with a war-horn start signal
5. Calorie counter
6. Warrior journal
7. The existing Viking Sudoku, localized and connected to the directory

The existing `app.html` remains available during this phase. The new calorie counter and journal do not depend on it and do not share its records.

## Product principles

- Every tool works on its own URL and without an account.
- Every language has a crawlable, server-delivered HTML page rather than relying on JavaScript to replace the primary content.
- Functional controls appear before the long-form SEO material.
- Personal data stays in the browser in the first version.
- The experience remains historically inspired and restrained rather than becoming a fantasy role-playing interface.
- The rejected collective label currently present in parts of the site must be removed from all visible copy, accessibility labels, metadata, and translation dictionaries. New directory copy uses “Viking Fitness Tools” or its natural localized equivalent.
- Health and performance outputs are estimates, never diagnoses, prescriptions, or guarantees.

## Information architecture

Spanish keeps the existing root URL structure to avoid an unnecessary migration. Other languages use subdirectories.

| Purpose | Spanish | English | Finnish | Norwegian |
|---|---|---|---|---|
| Directory | `/herramientas.html` | `/en/tools.html` | `/fi/tyokalut.html` | `/no/verktoy.html` |
| 1RM | `/calculadora-1rm.html` | `/en/one-rep-max-calculator.html` | `/fi/1rm-laskuri.html` | `/no/1rm-kalkulator.html` |
| Basal metabolism | `/calculadora-metabolismo-basal.html` | `/en/basal-metabolic-rate-calculator.html` | `/fi/perusaineenvaihduntalaskuri.html` | `/no/basalstoffskifte-kalkulator.html` |
| Timer | `/temporizador-vikingo.html` | `/en/viking-workout-timer.html` | `/fi/viikinki-treeniajastin.html` | `/no/viking-treningstimer.html` |
| Calories | `/contador-calorias.html` | `/en/calorie-counter.html` | `/fi/kalorilaskuri.html` | `/no/kaloriteller.html` |
| Journal | `/diario-guerrero.html` | `/en/warrior-journal.html` | `/fi/soturin-paivakirja.html` | `/no/krigerens-dagbok.html` |
| Sudoku | `/sudoku.html` | `/en/viking-sudoku.html` | `/fi/viikinki-sudoku.html` | `/no/viking-sudoku.html` |

Localized slugs use ASCII characters for compatibility, while headings and visible text retain the correct native characters.

The main navigation gains a visible “Tools” destination in each language. Each tool links back to the directory and displays a compact related-tools block. The existing hidden resources section on the homepage is replaced or unhidden with the approved terminology and links to the new directory.

## Shared page structure

Each tool page follows the same order:

1. Compact global header with logo, home, tools directory, language selector, and contact link.
2. Breadcrumbs.
3. Unique localized `h1`, short explanation, and the interactive tool.
4. Result or current-state panel with a persistent text status.
5. Privacy note and limitations immediately beside the relevant output.
6. Long-form localized guide: definition, instructions, formula or method, worked example, interpretation, common mistakes, and limitations.
7. Short questions-and-answers section written for users, without promising a search rich result.
8. Related Viking Fitness tools and relevant method, nutrition, science, or blog links.
9. Existing legal and contact footer, using the approved terminology.

Shared visual styles live in `assets/css/tools.css`. Shared non-content behavior—navigation, unit formatting, safe storage wrappers, exports, and accessibility helpers—lives in `assets/js/tools-common.js`. Each feature keeps its calculation or state logic in a focused file so it can be tested independently.

## Tool designs

### Tools directory

The directory is a fast, indexable catalogue rather than an application dashboard. It presents one card per tool with a one-sentence purpose, whether it stores data locally, and a direct action. Cards are grouped into Strength, Nutrition, Training, Tracking, and Mental Training.

The directory contains enough original localized copy to explain how the tools fit the Viking Fitness method, but it does not repeat whole articles from individual pages.

### One-repetition maximum calculator

**Inputs**

- Exercise name, optional and never persisted
- Lifted weight
- Repetitions from 1 through 12
- Kilograms or pounds

**Calculation**

- One repetition returns the entered weight.
- Two through twelve repetitions use the Epley estimate: `1RM = weight × (1 + repetitions / 30)`.
- The page names the formula and explains that estimates become less reliable at higher repetitions.
- The output keeps the selected unit and rounds to a practical increment: 0.5 kg or 1 lb.

**Outputs**

- Estimated 1RM
- Percentage table from 40% through 100% in 5% increments
- Plain-language zones for power, strength, and hypertrophy, clearly described as general orientation rather than a personal program
- Copy/print action

The calculator does not save lift data. A direct-max warning discourages inexperienced users from treating the estimate as an instruction to attempt a dangerous maximal lift.

### Basal metabolic rate calculator

**Inputs**

- Age: 18–100
- Height in centimetres or feet/inches
- Weight in kilograms or pounds
- Formula sex variable, labelled transparently as required by the equation
- Activity level
- Optional goal: maintain, gradual loss, or gradual gain

**Calculation**

- Use the Mifflin–St Jeor equations: `10 × kg + 6.25 × cm − 5 × age + 5` for the male formula and `10 × kg + 6.25 × cm − 5 × age − 161` for the female formula.
- Multiply by one of five visible activity factors to estimate total daily energy expenditure: sedentary `1.2`, light `1.375`, moderate `1.55`, high `1.725`, or very high `1.9`.
- Optional gradual-loss orientation is maintenance minus 300–500 kcal/day. Optional gradual-gain orientation is maintenance plus 200–300 kcal/day. These are displayed as broad starting ranges, not exact prescriptions, and the interface never silently chooses a goal.

**Outputs**

- Estimated basal metabolic rate
- Estimated maintenance calories
- Optional gradual-goal range
- Explanation of why real needs can differ

Sensitive inputs and results are held only in page memory and are not written to storage. The page includes a visible adult-use, pregnancy, eating-disorder, and medical-condition limitation directing users to an appropriate professional when relevant.

### Viking workout timer

**Modes**

- Simple rest timer
- Work/rest intervals with configurable rounds
- EMOM with configurable duration

**Interaction**

- Large start, pause, resume, reset, and add-time controls
- Optional three-second visual preparation countdown
- Pressing Start is the user gesture that unlocks Web Audio and plays the original synthesized war horn at the work phase
- A short, clearly different shield-like strike marks completion
- Sound, vibration, and screen-wake behavior are individually optional
- The current phase, next phase, round, and remaining time are always visible as text

The horn is generated locally with Web Audio and has no external media or copyright dependency. Audio generation is isolated from the current YouTube ambience logic so starting a timer never starts background music. If Web Audio, vibration, or Screen Wake Lock is unavailable, timing still works and the interface explains only the unavailable enhancement.

Stored preferences are limited to mode, durations, round count, volume, and enabled enhancements. Session history is not stored.

### Calorie counter

The counter is a daily nutrition utility, not a duplicate view of the current app.

**Entry fields**

- Food name
- Serving grams
- Calories per 100 g
- Protein, carbohydrate, and fat per 100 g
- Optional meal label

It includes the existing Nordic-oriented starter foods, translated without changing their numeric values, plus custom foods. Users can add, edit, duplicate, and delete entries.

**Views and outputs**

- Daily calories and macronutrient totals
- Previous/next day navigation
- Compact seven-day summary
- Export to CSV and JSON
- Clear-one-day and clear-all actions with confirmation

Records use a dedicated versioned storage key, `vf_calorie_counter_v1`. No record is sent to the journal or current app. Storage failure produces a persistent warning before the user invests time entering more records.

### Warrior journal

The journal is a flexible day-by-day record and remains independent from the calorie counter and current app.

**Daily record**

- Date
- Exercises with name, sets, repetitions, and weight
- Meals as free-text notes
- Optional body weight
- General notes

**Views and actions**

- Today view
- Calendar/date navigation
- Reverse chronological history
- Edit and delete
- Simple volume calculation per exercise and day
- Export/import a versioned JSON backup
- Printable day view

The journal uses `vf_warrior_journal_v1`. Import validates the schema and previews the number and date range of records before replacing or merging anything. Replace and clear-all operations require explicit confirmation. Duplicate IDs and invalid records are rejected with a useful message.

### Localized Viking Sudoku

The existing engine, puzzle bank, timer, and progress behavior remain shared. Each language receives a fully rendered HTML entry page with localized interface copy, metadata, explanatory content, and its own URL. All versions use the existing Sudoku progress keys so changing language preserves completion and records.

Authentication and optional online synchronization remain unchanged. API errors must be localized client-side without blocking offline play.

## Data ownership and privacy

- Calculations run entirely on the device.
- Basal calculator inputs and results are never persisted.
- Timer stores preferences only.
- Calorie counter, journal, current app, and Sudoku each retain separate versioned stores.
- Language variants share the appropriate store for the same tool, so changing language does not create parallel histories.
- No analytics event may include health inputs, food entries, exercise entries, notes, or calculated results.
- Every tool contains a complete localized privacy notice that names browser storage and explains deletion/export behavior. The existing Spanish privacy page also gains a tools section; translating the entire legal site is outside this release.
- When local storage is unavailable or full, persistent tools warn immediately and continue only in clearly labelled temporary mode where possible.

## Multilingual SEO

Every localized page has:

- Server-delivered visible content in exactly one primary language
- Correct `<html lang>`
- Unique, concise localized `<title>` and meta description
- Self-referencing canonical URL
- Reciprocal `hreflang` links for `es`, `en`, `fi`, `no`, and `x-default`
- Localized Open Graph and Twitter metadata
- A single clear `h1` aligned with title and intent
- Localized breadcrumbs and internal anchor text
- `WebPage`, `BreadcrumbList`, and truthful `WebApplication` JSON-LD; Sudoku retains an appropriate game/application type
- `inLanguage`, supported operating systems, the correct application category, and—where application rich-result eligibility is appropriate—a truthful free `Offer` with price `0` and currency `EUR`
- No fabricated ratings, review counts, testimonials, or claims

The root `sitemap.xml` becomes multilingual and lists every canonical tool URL with reciprocal `xhtml:link` alternates, including self-references. `robots.txt` continues to expose the sitemap. Navigation and related-tool links provide crawl paths in addition to the sitemap.

Keyword targeting is localized by user intent, not direct translation. Each page targets one primary intent and a small set of closely related terms. Spanish may include local brand context where natural, but calculators remain useful to visitors outside Fuengirola. English, Finnish, and Norwegian copy is written idiomatically and reviewed for sports terminology before publication.

SEO content must remain useful rather than padded. Worked examples are localized and numerically consistent. Formula pages cite primary or authoritative sources. Medical and nutrition pages avoid unsupported performance or health promises.

Reference implementation guidance:

- Google Search Central, multilingual sites: <https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites>
- Google Search Central, localized versions: <https://developers.google.com/search/docs/advanced/crawling/localized-versions>
- Google Search Central, software application structured data: <https://developers.google.com/search/docs/appearance/structured-data/software-app>

## Offline behavior and performance

- All tools work without a backend.
- The service worker precaches shared tool assets and uses network-first navigation with a language-appropriate offline fallback when already cached.
- The cache version changes whenever the app shell or tool assets change.
- No tool depends on YouTube, Google Fonts, or another third-party request to calculate or retrieve saved data.
- Font fallbacks preserve layout if web fonts are unavailable.
- Initial JavaScript is split by tool; pages do not download the calorie or journal controllers when opening the 1RM calculator.
- Images are optional and compressed; the interface does not require a large hero image above the calculator.
- Target: no avoidable layout shift, responsive controls from 320 px upward, and usable core functions with JavaScript errors isolated to their own enhancement where feasible.

The web app manifest adds shortcuts for Tools and Timer while retaining Home and Sudoku. The install experience opens the directory by default only if changing the current Sudoku-oriented `start_url` does not break existing installed behavior; otherwise the existing start URL remains and shortcuts provide access.

## Accessibility

- All fields have visible labels, instructions, units, and associated error text.
- Results and timer phase changes use polite or assertive live regions according to urgency.
- Color, sound, and vibration are never the only indicators.
- Full keyboard operation, logical focus movement, and visible focus styles are required.
- Timer controls meet large touch-target expectations.
- Reduced-motion preferences disable decorative motion and nonessential transitions.
- Audio is off until a direct user action and can be disabled permanently.
- Tables have captions and correct header relationships.
- Export, import, destructive, and reset actions have unambiguous accessible names.

## Error handling

- Numeric tools validate empty, negative, out-of-range, and non-finite values before calculation.
- Invalid inputs keep the previous valid result only if clearly marked as stale; otherwise results are cleared.
- Timer state is derived from timestamps rather than decrement-only intervals so background-tab throttling does not corrupt elapsed time.
- Persistent tools catch JSON parsing and storage quota failures.
- Journal imports never mutate existing data until the entire file passes validation and the user chooses merge or replace.
- Service worker or enhancement failures never prevent navigation or basic page rendering.
- Optional Sudoku synchronization failures preserve local progress.

## Testing and verification

### Automated unit tests

- 1RM: one-repetition identity, known Epley examples, rounding, kg/lb output, invalid limits
- Basal: reference Mifflin–St Jeor cases, unit conversion, activity factors, range boundaries
- Timer: state transitions, pause/resume, background-time correction, round completion, muted mode
- Calories: per-100-g calculations, daily totals, editing/deletion, date boundaries, export format
- Journal: volume totals, history ordering, import validation, merge collision handling, export round trip
- Localization: required key or visible-content checks for all supported languages
- SEO: canonical, `hreflang` reciprocity, `lang`, titles, descriptions, one `h1`, JSON-LD parseability, sitemap coverage

### Browser verification

- Mobile and desktop layouts
- Keyboard-only use and focus order
- Screen-reader status for results and timer phase
- Audio unlocked only after Start; horn and completion signals remain distinct
- Timer accuracy after switching tabs and locking/unlocking a mobile screen where supported
- Local records survive reload and language switching but never appear in another independent tool
- Offline reload after each page has been visited once
- No console errors, broken internal links, missing assets, or accidental external requests for calculations

### SEO validation

- Validate structured data with Google’s Rich Results Test where the selected type is supported
- Crawl all localized pages locally to check status, canonicals, alternates, headings, links, and duplicate metadata
- Validate sitemap XML and verify that every declared alternate URL exists
- Inspect representative pages in Search Console after deployment; rich results and rankings are possibilities, never acceptance criteria guaranteed by markup

## Implementation boundaries

This project remains static HTML, CSS, and JavaScript with no new framework or build system. Shared modules may be plain browser scripts or ES modules if existing browser support permits. PHP authentication endpoints remain limited to Sudoku’s current optional synchronization.

The first release does not include:

- Accounts or cloud synchronization for the new tools
- Communication between the calorie counter, journal, or current app
- A third-party nutrition database or barcode scanning
- Personalized training or diet prescriptions
- Social leaderboards, achievements, or public profiles
- Automatic translation at runtime
- New product sales or payment flows

## Rollout order

1. Shared tools shell, design system, storage helpers, terminology cleanup, directory, and SEO validation utilities
2. 1RM calculator
3. Basal metabolic rate calculator
4. Timer and isolated Web Audio signals
5. Calorie counter
6. Warrior journal
7. Localized Sudoku pages and messages
8. Multilingual sitemap, manifest/service-worker updates, cross-linking, full accessibility, SEO, offline, and regression verification

Each tool should be functional and testable before the next stateful tool is added. The site is not considered complete until all four languages, reciprocal alternates, offline behavior, terminology cleanup, and mobile verification pass.
