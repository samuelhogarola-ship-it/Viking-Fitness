const assert = require('assert');
const calories = require('../assets/js/calorie-engine.js');

const entry = calories.normalizeEntry({ id:'a', date:'2026-09-11', name:'Oats', grams:150, kcal100:379, p100:13.2, c100:67.7, f100:6.5 });
assert.deepStrictEqual(calories.entryTotals(entry), { kcal:568.5, p:19.8, c:101.55, f:9.75 });
assert.deepStrictEqual(calories.dayTotals([entry], '2026-09-11'), { kcal:568.5, p:19.8, c:101.55, f:9.75 });
const second = calories.normalizeEntry({ id:'b', date:'2026-09-10', name:'Milk, whole', grams:100, kcal100:60, p100:3.2, c100:4.7, f100:3.3 });
assert.deepStrictEqual(calories.weekSummary([entry,second], '2026-09-11').totals, { kcal:628.5, p:23, c:106.25, f:13.05 });
assert.match(calories.toCsv([entry]), /^date,name,grams,kcal,protein,carbohydrate,fat/m);
assert.match(calories.toCsv([second]), /"Milk, whole"/);
assert.strictEqual(calories.validateState({ version:1, entries:[entry] }).ok, true);
assert.strictEqual(calories.validateState({ version:2, entries:[] }).ok, false);
assert.strictEqual(calories.validateState({ version:1, entries:[entry,entry] }).ok, false);
assert.throws(() => calories.normalizeEntry({ id:'x', date:'bad', name:'', grams:0, kcal100:-1, p100:0, c100:0, f100:0 }), /invalid/i);

console.log('calorie engine tests passed');
