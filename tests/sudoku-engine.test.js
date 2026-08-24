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

console.log('sudoku-engine tests passed');
