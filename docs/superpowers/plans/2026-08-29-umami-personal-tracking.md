# Viking Fitness Personal Umami Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure all 26 Viking Fitness HTML entries in the personal Umami instance without cookies.

**Architecture:** Every HTML entry loads one same-origin bootstrap. The bootstrap fetches a public JSON configuration and injects the personal Umami script only when the deployment provides a valid website ID.

**Tech Stack:** Static HTML, browser JavaScript, JSON, Node.js built-in test runner.

**Spec:** https://github.com/samuelhogarola-ship-it/webfuengirola/blob/main/docs/superpowers/specs/2026-08-29-umami-all-panels-design.md

## Global Constraints

- Use only `https://analytics.187.124.55.36.sslip.io` for Viking Fitness.
- Umami is anonymous and cookieless; it must not wait for cookie consent.
- A missing or malformed website ID must fail closed and send no request.
- Every current HTML entry, including blog, legal, app, and Sudoku pages, must load the local bootstrap.
- The public website ID is configuration, never a credential or API token.

---

### Task 1: Complete static-entry tracking coverage

**Files:**
- Create: `assets/js/umami-analytics.js`
- Create: `umami-config.json`
- Create: `tests/umami-analytics.test.js`
- Modify: all 26 tracked `*.html` files

**Interfaces:**
- Consumes: same-origin `GET /umami-config.json` returning `{ "hostUrl": string, "websiteId": string }`.
- Produces: one script with `data-website-id`, `data-host-url`, `data-domains`, and `data-umami-tracker="true"`.

- [x] **Step 1: Write the failing test**

```js
test("every HTML entry loads the local Umami bootstrap", () => {
  const missing = htmlFiles.filter((file) =>
    !readFileSync(file, "utf8").includes('/assets/js/umami-analytics.js')
  );
  assert.deepEqual(missing, []);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/umami-analytics.test.js`

Expected: FAIL listing all HTML entries that do not yet load the bootstrap.

- [x] **Step 3: Implement the bootstrap and add it to every HTML head**

```js
(function () {
  "use strict";
  var PERSONAL_HOST = "https://analytics.187.124.55.36.sslip.io";
  fetch("/umami-config.json", { cache: "no-store", credentials: "same-origin" })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (config) {
      if (!config || config.hostUrl !== PERSONAL_HOST || !config.websiteId) return;
      var tracker = document.createElement("script");
      tracker.defer = true;
      tracker.src = PERSONAL_HOST + "/script.js";
      tracker.dataset.hostUrl = PERSONAL_HOST;
      tracker.dataset.websiteId = config.websiteId;
      document.head.appendChild(tracker);
    });
})();
```

Insert `<script defer src="/assets/js/umami-analytics.js"></script>` before `</head>` in each tracked HTML file.

- [x] **Step 4: Run verification**

Run: `node --test tests/umami-analytics.test.js`

Run: `test "$(rg -l 'assets/js/umami-analytics\\.js' -g '*.html' | wc -l | tr -d ' ')" = "26"`

Expected: tests PASS and all 26 HTML entries are covered.

- [x] **Step 5: Commit**

```bash
git add assets/js/umami-analytics.js umami-config.json tests/umami-analytics.test.js docs/superpowers/plans/2026-08-29-umami-personal-tracking.md '*.html' blog/*.html
git commit -m "feat: add personal Umami tracking"
```
