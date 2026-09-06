(function () {
  const engine = window.VFSudokuEngine;
  const $ = selector => document.querySelector(selector);
  const board = $('#sudokuBoard');
  const levelTabs = $('#levelTabs');
  const puzzleSelect = $('#puzzleSelect');
  const timerEl = $('#timer');
  const mistakesEl = $('#mistakes');
  const completedEl = $('#completed');
  const bestTimeEl = $('#bestTime');
  const recordFacilEl = $('#recordFacil');
  const recordMedioEl = $('#recordMedio');
  const recordDificilEl = $('#recordDificil');
  const gameMessage = $('#gameMessage');
  const numberPad = $('#numberPad');
  const loginForm = $('#loginForm');
  const codeForm = $('#codeForm');
  const loginStatus = $('#loginStatus');
  const loginMessage = $('#loginMessage');
  const logoutBtn = $('#logoutBtn');

  let level = engine.normalizeLevel(localStorage.getItem('vf_sudoku_level'));
  let puzzleIndex = Number(localStorage.getItem('vf_sudoku_index') || 0);
  let puzzle = engine.getPuzzle(level, puzzleIndex);
  let state = loadState() || puzzle.grid;
  let selected = -1;
  let activeNumber = normalizeActiveNumber(localStorage.getItem('vf_sudoku_active_number'));
  let mistakes = 0;
  let gameOver = false;
  let elapsed = Number(localStorage.getItem(timeKey()) || 0);
  let timerId = null;
  let pendingEmail = '';
  let user = null;
  let fullscreenRequested = false;

  init();

  function init() {
    renderLevels();
    renderPuzzleSelect();
    renderPad();
    renderBoard();
    updateStats();
    bindActions();
    tick();
    timerId = setInterval(tick, 1000);
    loadUser();
  }

  function renderLevels() {
    levelTabs.innerHTML = '';
    const summary = engine.summarizeProgress(getProgress());
    Object.entries(engine.LEVELS).forEach(([key, config]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${config.label} ${summary.byLevel[key].completed}/20`;
      button.className = key === level ? 'is-active' : '';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(key === level));
      button.addEventListener('click', () => switchPuzzle(key, 0));
      levelTabs.appendChild(button);
    });
  }

  function renderPuzzleSelect() {
    puzzleSelect.innerHTML = '';
    const progress = getProgress();
    engine.puzzles[level].forEach((item, index) => {
      const status = engine.puzzleStatus(item.id, progress);
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${status.completed ? '✓ ' : ''}#${String(index + 1).padStart(2, '0')}${status.completed ? ' completado' : ''}`;
      option.selected = index === puzzleIndex;
      puzzleSelect.appendChild(option);
    });
  }

  function renderPad() {
    numberPad.innerHTML = '';
    for (let n = 1; n <= 9; n++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(n);
      button.className = n === activeNumber ? 'is-active' : '';
      button.setAttribute('aria-pressed', String(n === activeNumber));
      button.addEventListener('click', () => {
        setActiveNumber(n);
        placeValue(n);
      });
      numberPad.appendChild(button);
    }
  }

  function renderBoard() {
    board.innerHTML = '';
    const peerIndexes = selected >= 0 ? peers(selected) : new Set();
    const sameIndexes = activeNumber ? valueIndexes(activeNumber) : selected >= 0 ? new Set(engine.sameValueIndexes(state, selected)) : new Set();
    for (let index = 0; index < 81; index++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = cellClass(index, peerIndexes, sameIndexes);
      cell.textContent = state[index] === '0' ? '' : state[index];
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Fila ${Math.floor(index / 9) + 1}, columna ${index % 9 + 1}`);
      cell.addEventListener('click', () => {
        selected = index;
        if (state[index] !== '0') setActiveNumber(Number(state[index]), false);
        renderBoard();
      });
      board.appendChild(cell);
    }
  }

  function cellClass(index, peerIndexes, sameIndexes) {
    const classes = ['cell'];
    if (!engine.canEdit(puzzle, index)) classes.push('is-clue');
    if (index === selected) classes.push('is-selected');
    if (sameIndexes.has(index)) classes.push('is-same');
    if (activeNumber && state[index] === String(activeNumber)) classes.push('is-number-active');
    if (peerIndexes.has(index)) classes.push('is-peer');
    if (engine.conflicts(state, index).length) classes.push('is-wrong');
    if (gameOver) classes.push('is-locked');
    return classes.join(' ');
  }

  function bindActions() {
    board.addEventListener('pointerdown', requestMobileFullscreen, { passive: true });
    numberPad.addEventListener('pointerdown', requestMobileFullscreen, { passive: true });
    puzzleSelect.addEventListener('change', () => switchPuzzle(level, Number(puzzleSelect.value)));
    $('#eraseBtn').addEventListener('click', () => placeValue(0));
    $('#resetBtn').addEventListener('click', resetPuzzle);
    $('#hintBtn').addEventListener('click', hint);
    $('#checkBtn').addEventListener('click', checkBoard);
    document.addEventListener('keydown', event => {
      if (event.key >= '1' && event.key <= '9') {
        setActiveNumber(Number(event.key));
        placeValue(Number(event.key));
      }
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') placeValue(0);
    });
    loginForm.addEventListener('submit', requestLogin);
    codeForm.addEventListener('submit', verifyLogin);
    logoutBtn.addEventListener('click', logout);
  }

  function switchPuzzle(nextLevel, nextIndex) {
    saveCurrent();
    level = engine.normalizeLevel(nextLevel);
    puzzleIndex = nextIndex;
    puzzle = engine.getPuzzle(level, puzzleIndex);
    state = loadState() || puzzle.grid;
    selected = -1;
    renderPad();
    mistakes = 0;
    gameOver = false;
    elapsed = Number(localStorage.getItem(timeKey()) || 0);
    localStorage.setItem('vf_sudoku_level', level);
    localStorage.setItem('vf_sudoku_index', String(puzzleIndex));
    renderLevels();
    renderPuzzleSelect();
    renderBoard();
    updateStats();
    setMessage('Nuevo tablero preparado.');
  }

  function placeValue(value) {
    if (gameOver) return setMessage('Partida perdida. Reinicia el tablero o elige otro.');
    if (selected < 0) return setMessage('Elige una casilla vacía.');
    if (!engine.canEdit(puzzle, selected)) return setMessage('Esa casilla pertenece al tablero.');
    if (value && !engine.isMoveCorrect(puzzle, selected, value)) {
      mistakes += 1;
      if (engine.isGameLost(mistakes)) gameOver = true;
    }
    state = engine.setValue(state, puzzle, selected, value);
    saveCurrent();
    renderBoard();
    updateStats();
    if (gameOver) return setMessage('Has hecho 3 fallos. Partida perdida.');
    if (engine.isSolved(state, puzzle)) completePuzzle();
  }

  function resetPuzzle() {
    state = puzzle.grid;
    selected = -1;
    activeNumber = 0;
    localStorage.removeItem('vf_sudoku_active_number');
    mistakes = 0;
    gameOver = false;
    elapsed = 0;
    saveCurrent();
    renderBoard();
    updateStats();
    renderPad();
    setMessage('Tablero reiniciado.');
  }

  function hint() {
    if (gameOver) return setMessage('Partida perdida. Reinicia el tablero o elige otro.');
    const index = selected >= 0 && engine.canEdit(puzzle, selected) ? selected : state.indexOf('0');
    if (index < 0) return;
    selected = index;
    state = engine.setValue(state, puzzle, index, puzzle.solution[index]);
    saveCurrent();
    renderBoard();
    updateStats();
    if (engine.isSolved(state, puzzle)) completePuzzle();
  }

  function checkBoard() {
    if (gameOver) return setMessage('Partida perdida. Reinicia para intentarlo otra vez.');
    if (engine.isSolved(state, puzzle)) return completePuzzle();
    const filled = [...state].filter(value => value !== '0').length;
    setMessage(`Vas por ${filled}/81. Sigue, que aun queda batalla.`);
  }

  function completePuzzle() {
    const progress = getProgress();
    const key = puzzle.id;
    const previous = progress.best[key];
    progress.completed[key] = true;
    progress.best[key] = previous ? Math.min(previous, elapsed) : elapsed;
    localStorage.setItem('vf_sudoku_progress', JSON.stringify(progress));
    syncProgress(progress);
    renderLevels();
    renderPuzzleSelect();
    updateStats();
    setMessage(`Completado en ${formatTime(elapsed)}.`);
  }

  function updateStats() {
    const progress = getProgress();
    const summary = engine.summarizeProgress(progress);
    mistakesEl.textContent = String(mistakes);
    completedEl.textContent = String(summary.completedTotal);
    bestTimeEl.textContent = progress.best[puzzle.id] ? formatTime(progress.best[puzzle.id]) : '--:--';
    recordFacilEl.textContent = `${summary.byLevel.facil.completed}/20`;
    recordMedioEl.textContent = `${summary.byLevel.medio.completed}/20`;
    recordDificilEl.textContent = `${summary.byLevel.dificil.completed}/20`;
  }

  function tick() {
    timerEl.textContent = formatTime(elapsed);
    elapsed += 1;
    localStorage.setItem(timeKey(), String(elapsed));
  }

  function saveCurrent() {
    localStorage.setItem(stateKey(), state);
    localStorage.setItem(timeKey(), String(elapsed));
  }

  function setActiveNumber(value, shouldRender = true) {
    activeNumber = normalizeActiveNumber(value);
    if (activeNumber) {
      localStorage.setItem('vf_sudoku_active_number', String(activeNumber));
    } else {
      localStorage.removeItem('vf_sudoku_active_number');
    }
    if (shouldRender) {
      renderPad();
      renderBoard();
    }
  }

  function valueIndexes(value) {
    return new Set([...state].reduce((indexes, current, index) => {
      if (current === String(value)) indexes.push(index);
      return indexes;
    }, []));
  }

  function normalizeActiveNumber(value) {
    const number = Number(value);
    return number >= 1 && number <= 9 ? number : 0;
  }

  function requestMobileFullscreen() {
    if (fullscreenRequested || !isMobileSudoku()) return;
    fullscreenRequested = true;
    const target = document.documentElement;
    const request = target.requestFullscreen || target.webkitRequestFullscreen;
    if (!request || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      Promise.resolve(request.call(target)).catch(() => {});
    } catch {}
  }

  function isMobileSudoku() {
    return window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(display-mode: standalone)').matches;
  }

  function loadState() {
    const saved = localStorage.getItem(stateKey());
    return saved && saved.length === 81 ? saved : '';
  }

  function stateKey() {
    return `vf_sudoku_state_${level}_${puzzleIndex}`;
  }

  function timeKey() {
    return `vf_sudoku_time_${level}_${puzzleIndex}`;
  }

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem('vf_sudoku_progress')) || { completed: {}, best: {} };
    } catch {
      return { completed: {}, best: {} };
    }
  }

  function peers(index) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    const set = new Set();
    for (let i = 0; i < 9; i++) {
      set.add(row * 9 + i);
      set.add(i * 9 + col);
    }
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) set.add(r * 9 + c);
    }
    return set;
  }

  function formatTime(total) {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function setMessage(message) {
    gameMessage.textContent = message;
  }

  async function requestLogin(event) {
    event.preventDefault();
    pendingEmail = new FormData(loginForm).get('email').trim();
    loginMessage.textContent = 'Enviando código...';
    const result = await api('/api/request-login.php', { email: pendingEmail });
    if (!result.ok) {
      loginMessage.textContent = result.message || 'No se pudo enviar el código.';
      return;
    }
    codeForm.classList.remove('is-hidden');
    loginMessage.textContent = 'Código enviado. Revisa tu email.';
  }

  async function verifyLogin(event) {
    event.preventDefault();
    const code = new FormData(codeForm).get('code').trim();
    const result = await api('/api/verify-login.php', { email: pendingEmail, code });
    if (!result.ok) {
      loginMessage.textContent = result.message || 'Código incorrecto.';
      return;
    }
    user = result.user;
    syncLoginUi();
    syncProgress(getProgress());
    loginMessage.textContent = 'Sesión iniciada.';
  }

  async function loadUser() {
    const result = await api('/api/me.php');
    if (result.ok && result.user) user = result.user;
    syncLoginUi();
    if (user) await loadRemoteProgress();
  }

  async function logout() {
    await api('/api/logout.php', {});
    user = null;
    syncLoginUi();
    loginMessage.textContent = 'Sesión cerrada.';
  }

  async function syncProgress(progress) {
    if (!user) return;
    await api('/api/progress.php', { progress });
  }

  async function loadRemoteProgress() {
    const result = await api('/api/progress.php');
    if (!result.ok || !result.progress) return;
    const local = getProgress();
    const remote = result.progress;
    const merged = {
      completed: { ...(remote.completed || {}), ...(local.completed || {}) },
      best: { ...(remote.best || {}) },
    };
    Object.entries(local.best || {}).forEach(([key, value]) => {
      merged.best[key] = merged.best[key] ? Math.min(merged.best[key], value) : value;
    });
    localStorage.setItem('vf_sudoku_progress', JSON.stringify(merged));
    renderLevels();
    renderPuzzleSelect();
    updateStats();
  }

  function syncLoginUi() {
    const logged = Boolean(user && user.email);
    loginStatus.textContent = logged ? `Online: ${user.email}` : 'Regístrate para guardar online';
    loginForm.classList.toggle('is-hidden', logged);
    codeForm.classList.add('is-hidden');
    logoutBtn.classList.toggle('is-hidden', !logged);
  }

  async function api(url, body) {
    try {
      const options = body === undefined ? {} : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      };
      const response = await fetch(url, options);
      return await response.json();
    } catch {
      return { ok: false, message: 'El registro no está disponible todavía. Tu progreso seguirá guardado en este navegador.' };
    }
  }
})();
