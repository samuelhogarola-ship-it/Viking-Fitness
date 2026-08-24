const assert = require('assert');
const engine = require('../assets/js/sudoku-engine.js');

const levels = ['facil', 'medio', 'dificil'];

for (const level of levels) {
  assert.strictEqual(engine.puzzles[level].length, 20, `${level} should have 20 puzzles`);
  for (const puzzle of engine.puzzles[level]) {
    assert.match(puzzle.id, new RegExp(`^${level}-\\d{2}$`));
    assert.strictEqual(puzzle.grid.length, 81, `${puzzle.id} grid length`);
    assert.strictEqual(puzzle.solution.length, 81, `${puzzle.id} solution length`);
    assert.ok(/^[0-9]{81}$/.test(puzzle.grid), `${puzzle.id} grid chars`);
    assert.ok(/^[1-9]{81}$/.test(puzzle.solution), `${puzzle.id} solution chars`);
    assert.ok(engine.isSolved(puzzle.solution, puzzle), `${puzzle.id} solution should solve`);
  }
}

const uniqueGrids = new Set(levels.flatMap(level => engine.puzzles[level].map(puzzle => puzzle.grid)));
assert.strictEqual(uniqueGrids.size, 60, 'all 60 puzzles should be unique');

const puzzle = engine.getPuzzle('facil', 0);
const firstBlank = puzzle.grid.indexOf('0');
const correct = Number(puzzle.solution[firstBlank]);
const wrong = correct === 9 ? 1 : correct + 1;

assert.strictEqual(engine.canEdit(puzzle, firstBlank), true, 'blank cells are editable');
assert.strictEqual(engine.canEdit(puzzle, 0), puzzle.grid[0] === '0', 'clues are not editable');
assert.strictEqual(engine.isMoveCorrect(puzzle, firstBlank, correct), true, 'correct move is accepted');
assert.strictEqual(engine.isMoveCorrect(puzzle, firstBlank, wrong), false, 'wrong move is rejected');
assert.strictEqual(engine.isSolved(puzzle.grid, puzzle), false, 'starting puzzle is not solved');
assert.deepStrictEqual(engine.sameValueIndexes('100200100', 0), [0, 6], 'same values are found across the board');
assert.deepStrictEqual(engine.sameValueIndexes('100200100', 1), [], 'blank values do not highlight matches');
assert.strictEqual(engine.isGameLost(2), false, 'two mistakes still allow play');
assert.strictEqual(engine.isGameLost(3), true, 'three mistakes lose the game');

const summary = engine.summarizeProgress({
  completed: { 'facil-01': true, 'facil-02': true, 'medio-01': true },
  best: { 'facil-01': 300, 'facil-02': 240, 'medio-01': 600 },
});
assert.strictEqual(summary.completedTotal, 3, 'summary counts completed puzzles');
assert.strictEqual(summary.byLevel.facil.completed, 2, 'summary counts easy records');
assert.strictEqual(summary.byLevel.medio.completed, 1, 'summary counts medium records');
assert.strictEqual(summary.byLevel.dificil.completed, 0, 'summary counts hard records');
assert.strictEqual(summary.bestOverall, 240, 'summary exposes best global time');

console.log('sudoku-engine tests passed');
