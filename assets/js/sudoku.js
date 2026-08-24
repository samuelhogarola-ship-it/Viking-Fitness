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

  let level = localStorage.getItem('vf_sudoku_level') || 'facil';
  let puzzleIndex = Number(localStorage.getItem('vf_sudoku_index') || 0);
  let puzzle = engine.getPuzzle(level, puzzleIndex);
  let state = loadState() || puzzle.grid;
  let selected = -1;
  let mistakes = 0;
  let elapsed = Number(localStorage.getItem(timeKey()) || 0);
  let timerId = null;
  let pendingEmail = '';
  let user = null;

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
    Object.entries(engine.LEVELS).forEach(([key, config]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = config.label;
      button.className = key === level ? 'is-active' : '';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(key === level));
      button.addEventListener('click', () => switchPuzzle(key, 0));
      levelTabs.appendChild(button);
    });
  }

  function renderPuzzleSelect() {
    puzzleSelect.innerHTML = '';
    engine.puzzles[level].forEach((item, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `#${String(index + 1).padStart(2, '0')}`;
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
      button.addEventListener('click', () => placeValue(n));
      numberPad.appendChild(button);
    }
  }

  function renderBoard() {
    board.innerHTML = '';
    const peerIndexes = selected >= 0 ? peers(selected) : new Set();
    for (let index = 0; index < 81; index++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = cellClass(index, peerIndexes);
      cell.textContent = state[index] === '0' ? '' : state[index];
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Fila ${Math.floor(index / 9) + 1}, columna ${index % 9 + 1}`);
      cell.addEventListener('click', () => {
        selected = index;
        renderBoard();
      });
      board.appendChild(cell);
    }
  }

  function cellClass(index, peerIndexes) {
    const classes = ['cell'];
    if (!engine.canEdit(puzzle, index)) classes.push('is-clue');
    if (index === selected) classes.push('is-selected');
    if (peerIndexes.has(index)) classes.push('is-peer');
    if (engine.conflicts(state, index).length) classes.push('is-wrong');
    return classes.join(' ');
  }

  function bindActions() {
    puzzleSelect.addEventListener('change', () => switchPuzzle(level, Number(puzzleSelect.value)));
    $('#eraseBtn').addEventListener('click', () => placeValue(0));
    $('#resetBtn').addEventListener('click', resetPuzzle);
    $('#hintBtn').addEventListener('click', hint);
    $('#checkBtn').addEventListener('click', checkBoard);
    document.addEventListener('keydown', event => {
      if (event.key >= '1' && event.key <= '9') placeValue(Number(event.key));
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') placeValue(0);
    });
    loginForm.addEventListener('submit', requestLogin);
    codeForm.addEventListener('submit', verifyLogin);
    logoutBtn.addEventListener('click', logout);
  }

  function switchPuzzle(nextLevel, nextIndex) {
    saveCurrent();
    level = nextLevel;
    puzzleIndex = nextIndex;
    puzzle = engine.getPuzzle(level, puzzleIndex);
    state = loadState() || puzzle.grid;
    selected = -1;
    mistakes = 0;
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
    if (selected < 0) return setMessage('Elige una casilla vacía.');
    if (!engine.canEdit(puzzle, selected)) return setMessage('Esa casilla pertenece al tablero.');
    if (value && !engine.isMoveCorrect(puzzle, selected, value)) mistakes += 1;
    state = engine.setValue(state, puzzle, selected, value);
    saveCurrent();
    renderBoard();
    updateStats();
    if (engine.isSolved(state, puzzle)) completePuzzle();
  }

  function resetPuzzle() {
    state = puzzle.grid;
    selected = -1;
    mistakes = 0;
    elapsed = 0;
    saveCurrent();
    renderBoard();
    updateStats();
    setMessage('Tablero reiniciado.');
  }

  function hint() {
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
    updateStats();
  }

  function syncLoginUi() {
    const logged = Boolean(user && user.email);
    loginStatus.textContent = logged ? `Online: ${user.email}` : 'Invitado: guardado local';
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
      return { ok: false, message: 'Login no disponible todavía. Puedes jugar como invitado.' };
    }
  }
})();
