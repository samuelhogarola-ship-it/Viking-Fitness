/* Viking Fitness Sudoku engine: pure helpers plus deterministic puzzle bank. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.VFSudokuEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const BASE = '123456789456789123789123456234567891567891234891234567345678912678912345912345678';
  const LEVELS = {
    facil: { label: 'Facil', blanks: 34 },
    medio: { label: 'Medio', blanks: 44 },
    dificil: { label: 'Dificil', blanks: 54 },
  };

  function pattern(row, col) {
    return (row * 3 + Math.floor(row / 3) + col) % 9;
  }

  function shuffledUnits(seed) {
    const bands = rotate([0, 1, 2], seed % 3);
    const stacks = rotate([0, 1, 2], Math.floor(seed / 2) % 3);
    const rows = bands.flatMap((band, idx) => rotate([0, 1, 2], (seed + idx) % 3).map(row => band * 3 + row));
    const cols = stacks.flatMap((stack, idx) => rotate([0, 1, 2], (seed + idx + 1) % 3).map(col => stack * 3 + col));
    return { rows, cols };
  }

  function rotate(items, amount) {
    const n = amount % items.length;
    return items.slice(n).concat(items.slice(0, n));
  }

  function makeSolution(seed) {
    const { rows, cols } = shuffledUnits(seed);
    const digits = rotate([1, 2, 3, 4, 5, 6, 7, 8, 9], seed % 9);
    let out = '';
    for (const row of rows) {
      for (const col of cols) out += digits[pattern(row, col) % 9];
    }
    return out;
  }

  function makeGrid(solution, blanks, seed) {
    const chars = solution.split('');
    const hidden = new Set();
    let cursor = (seed * 17 + 11) % 81;
    let stride = 37 + (seed % 8) * 2;
    while (gcd(stride, 81) !== 1) stride += 2;
    while (hidden.size < blanks) {
      hidden.add(cursor);
      const mirror = 80 - cursor;
      if (hidden.size < blanks) hidden.add(mirror);
      cursor = (cursor + stride) % 81;
    }
    hidden.forEach(index => { chars[index] = '0'; });
    return chars.join('');
  }

  function gcd(a, b) {
    while (b) [a, b] = [b, a % b];
    return a;
  }

  function buildPuzzles() {
    const bank = {};
    Object.keys(LEVELS).forEach((level, levelIndex) => {
      bank[level] = Array.from({ length: 20 }, (_, index) => {
        const seed = levelIndex * 101 + index * 13 + 7;
        const solution = makeSolution(seed);
        return {
          id: `${level}-${String(index + 1).padStart(2, '0')}`,
          level,
          number: index + 1,
          grid: makeGrid(solution, LEVELS[level].blanks, seed),
          solution,
        };
      });
    });
    return bank;
  }

  const puzzles = buildPuzzles();

  function normalizeLevel(level) {
    return Object.prototype.hasOwnProperty.call(LEVELS, level) ? level : 'facil';
  }

  function getPuzzle(level, index) {
    const list = puzzles[normalizeLevel(level)];
    return list[Math.max(0, Math.min(list.length - 1, Number(index) || 0))];
  }

  function canEdit(puzzle, index) {
    return puzzle.grid[index] === '0';
  }

  function isMoveCorrect(puzzle, index, value) {
    return canEdit(puzzle, index) && String(value) === puzzle.solution[index];
  }

  function setValue(state, puzzle, index, value) {
    if (!canEdit(puzzle, index)) return state;
    const chars = state.split('');
    chars[index] = value ? String(value) : '0';
    return chars.join('');
  }

  function isSolved(state, puzzle) {
    return state === puzzle.solution;
  }

  function conflicts(state, index) {
    const value = state[index];
    if (!value || value === '0') return [];
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    const found = new Set();
    for (let i = 0; i < 9; i++) {
      addConflict(row * 9 + i);
      addConflict(i * 9 + col);
    }
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) addConflict(r * 9 + c);
    }
    found.delete(index);
    return [...found];

    function addConflict(other) {
      if (state[other] === value) found.add(other);
    }
  }

  function sameValueIndexes(state, index) {
    const value = state[index];
    if (!value || value === '0') return [];
    return [...state].reduce((matches, current, currentIndex) => {
      if (current === value) matches.push(currentIndex);
      return matches;
    }, []);
  }

  function isGameLost(mistakes) {
    return Number(mistakes) >= 3;
  }

  function summarizeProgress(progress) {
    const completed = progress && progress.completed && typeof progress.completed === 'object' ? progress.completed : {};
    const best = progress && progress.best && typeof progress.best === 'object' ? progress.best : {};
    const byLevel = {};
    Object.keys(LEVELS).forEach(level => {
      const ids = Object.keys(completed).filter(id => id.startsWith(`${level}-`) && completed[id]);
      byLevel[level] = {
        completed: ids.length,
        total: puzzles[level].length,
      };
    });
    const times = Object.values(best).filter(value => Number.isFinite(value));
    return {
      completedTotal: Object.keys(completed).filter(id => completed[id]).length,
      bestOverall: times.length ? Math.min(...times) : null,
      byLevel,
    };
  }

  function puzzleStatus(id, progress) {
    const completed = progress && progress.completed && typeof progress.completed === 'object' ? progress.completed : {};
    const best = progress && progress.best && typeof progress.best === 'object' ? progress.best : {};
    const bestTime = Number(best[id]);
    return {
      completed: Boolean(completed[id]),
      best: Number.isFinite(bestTime) ? bestTime : null,
    };
  }

  return {
    LEVELS,
    puzzles,
    normalizeLevel,
    getPuzzle,
    canEdit,
    isMoveCorrect,
    setValue,
    isSolved,
    conflicts,
    sameValueIndexes,
    isGameLost,
    summarizeProgress,
    puzzleStatus,
  };
});
