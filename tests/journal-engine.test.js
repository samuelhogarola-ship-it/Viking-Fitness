const assert = require('assert');
const journal = require('../assets/js/journal-engine.js');

const day = { id:'d1', date:'2026-09-11', exercises:[{ id:'e1', name:'Squat', sets:3, reps:5, kg:100 }], meals:'Salmon', weight:80, notes:'' };
assert.strictEqual(journal.exerciseVolume(day.exercises[0]), 1500);
assert.strictEqual(journal.dayVolume(day), 1500);
const backup = { version:1, days:[day] };
assert.strictEqual(journal.validateBackup(backup).ok, true);
assert.deepStrictEqual(journal.merge({ version:1, days:[] }, backup).days, [day]);
assert.throws(() => journal.merge(backup, backup), /duplicate/i);
assert.deepStrictEqual(journal.replace({ version:1, days:[] }, backup), backup);
assert.deepStrictEqual(JSON.parse(journal.exportBackup(backup)), backup);
assert.strictEqual(journal.validateBackup({ version:1, days:[day,Object.assign({},day,{id:'d2'})] }).ok, false);
assert.strictEqual(journal.validateBackup({ version:1, days:[Object.assign({},day,{weight:10})] }).ok, false);
assert.strictEqual(journal.validateBackup({ version:2, days:[] }).ok, false);

console.log('journal engine tests passed');
