# Viking Sudoku Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Viking-themed Sudoku game with email-code login through Resend.

**Architecture:** Client-side Sudoku gameplay backed by a pure JS engine and static puzzle bank. PHP endpoints handle login codes, sessions, Resend email sending, and optional progress storage on Hostinger.

**Tech Stack:** Static HTML/CSS/JS, PHP 8-compatible endpoints, Resend HTTP API, Node built-in `assert` for logic tests.

**Spec:** `docs/superpowers/specs/2026-08-24-viking-sudoku-design.md`

## Global Constraints

- Do not commit a Resend API key.
- Keep the Sudoku playable even when login API calls fail.
- Use same-origin API endpoints so current CSP `connect-src 'self'` remains valid.
- Keep Git as the deployment path.

---

### Task 1: Sudoku Engine

**Files:**
- Create: `tests/sudoku-engine.test.js`
- Create: `assets/js/sudoku-engine.js`

**Steps:**
- [ ] Write failing tests for level counts, puzzle shape, move validation, and completion.
- [ ] Run `node tests/sudoku-engine.test.js` and verify it fails because the engine does not exist.
- [ ] Implement puzzle bank and helpers in `assets/js/sudoku-engine.js`.
- [ ] Run `node tests/sudoku-engine.test.js` and verify it passes.

### Task 2: Game UI

**Files:**
- Create: `sudoku.html`
- Create: `assets/js/sudoku.js`
- Create: `assets/css/sudoku.css`
- Modify: `index.html`

**Steps:**
- [ ] Build the game screen with board, levels, puzzle selector, timer, actions, and login panel.
- [ ] Add Viking-themed styling consistent with the current visual system.
- [ ] Link the Sudoku from the main navigation/home surface.
- [ ] Manually verify keyboard/mouse play in a browser or static parse checks if no server is needed.

### Task 3: Resend Login API

**Files:**
- Create: `api/bootstrap.php`
- Create: `api/request-login.php`
- Create: `api/verify-login.php`
- Create: `api/me.php`
- Create: `api/logout.php`
- Create: `api/progress.php`
- Create: `data/.htaccess`
- Modify: `.gitignore`
- Modify: `.htaccess`

**Steps:**
- [ ] Implement JSON helpers, email validation, token hashing, file locks, and cookie session helpers.
- [ ] Implement one-time code email send via Resend HTTP API with idempotency key.
- [ ] Implement verification, logout, current user, and progress endpoints.
- [ ] Run PHP syntax checks if PHP is installed.

### Task 4: Verification and Git

**Steps:**
- [ ] Run JS tests.
- [ ] Run static checks for changed HTML/CSS/JS/PHP.
- [ ] Review `git diff`.
- [ ] Commit and push to Git.
