const assert = require('assert');
const timer = require('../assets/js/timer-engine.js');

let state = timer.create({ mode:'intervals', prep:3, work:30, rest:15, rounds:2 }, 0);
state = timer.start(state, 1000);
assert.strictEqual(timer.tick(state, 3000).remainingMs, 1000);
state = timer.tick(state, 4000);
assert.strictEqual(state.phase, 'work');
assert.strictEqual(state.round, 1);
assert.strictEqual(state.event, 'work-start');
state = timer.tick(state, 5000);
assert.strictEqual(state.event, null);
state = timer.pause(state, 14000);
assert.strictEqual(timer.tick(state, 24000).remainingMs, state.remainingMs);
state = timer.resume(state, 24000);
assert.strictEqual(timer.tick(state, 44000).phase, 'rest');

const rest = timer.start(timer.create({ mode:'rest', duration:60 }, 0), 0);
assert.strictEqual(timer.tick(rest, 60000).status, 'complete');
assert.strictEqual(timer.tick(rest, 60000).event, 'complete');

const emom = timer.start(timer.create({ mode:'emom', duration:60, rounds:3 }, 0), 0);
assert.strictEqual(timer.tick(emom, 60000).round, 2);
assert.strictEqual(timer.tick(emom, 180000).status, 'complete');

const skipped = timer.tick(timer.start(timer.create({ mode:'intervals', prep:0, work:10, rest:5, rounds:3 }, 0), 0), 31000);
assert.strictEqual(skipped.phase, 'work');
assert.strictEqual(skipped.round, 3);
assert.strictEqual(skipped.remainingMs, 9000);
assert.strictEqual(skipped.event, 'work-start');

assert.deepStrictEqual(timer.validate({ mode:'intervals', prep:3, work:30, rest:15, rounds:0 }).errors, { rounds:'range' });
assert.strictEqual(timer.reset(state).status, 'idle');
console.log('timer engine tests passed');
