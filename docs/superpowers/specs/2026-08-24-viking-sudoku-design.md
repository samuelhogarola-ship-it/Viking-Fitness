# Viking Sudoku Design

**Goal:** Add a Viking-themed Sudoku game to the static Viking Fitness site with three levels, 20 puzzles per level, timer, and email login through Resend.

**Architecture:** Keep the public experience static where possible and add small PHP endpoints for authentication because Resend API keys must never be exposed in browser JavaScript. The Sudoku game runs client-side; login and progress sync use same-origin PHP endpoints on Hostinger.

**Constraints:**
- Hostinger/Git deployment remains the delivery path.
- No Resend API key in committed files or client-side code.
- Resend sends a one-time 6-digit login code by single-email API.
- The game must work as a normal Sudoku interface: 9x9 board, fixed clues, selectable cells, number pad, timer, completion state.
- Levels: facil, medio, dificil; 20 puzzles per level.
- If PHP storage is unavailable, local play must still work without blocking the Sudoku.

**Files:**
- `sudoku.html`: standalone game screen with normal site nav styling.
- `assets/js/sudoku-engine.js`: pure Sudoku helpers and puzzle bank.
- `assets/js/sudoku.js`: UI controller, timer, login calls, local progress.
- `assets/css/sudoku.css`: Viking game styling.
- `api/bootstrap.php`: shared PHP helpers for auth, JSON responses, Resend config.
- `api/request-login.php`: request email code.
- `api/verify-login.php`: verify code and set cookie session.
- `api/me.php`: read current login state.
- `api/logout.php`: clear session.
- `api/progress.php`: optional progress read/write.
- `data/.htaccess`: deny browser access to stored auth/progress data.
- `tests/sudoku-engine.test.js`: Node assertions for puzzle bank and validation.

**Resend Setup:**
- Production should define `RESEND_API_KEY` outside Git.
- Production sender should be `Viking Fitness <login@vikingfitness.es>` once the domain is verified.
- Optional local/private fallback config file: `api/config.local.php`, ignored by Git.
