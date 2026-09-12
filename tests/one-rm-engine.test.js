const assert = require('assert');
const oneRM = require('../assets/js/one-rm-engine.js');

assert.strictEqual(oneRM.estimate(100, 1), 100, 'one repetition returns the lifted weight');
assert.ok(Math.abs(oneRM.estimate(100, 5) - 116.6667) < 0.001, 'Epley estimate uses repetitions above one');
assert.strictEqual(oneRM.roundLoad(83.26, 'kg'), 83.5, 'kilograms round to half-kilo increments');
assert.strictEqual(oneRM.roundLoad(183.2, 'lb'), 183, 'pounds round to whole-pound increments');

const percentages = oneRM.percentages(100, 'kg');
assert.strictEqual(percentages.length, 13, 'percentage table covers 40 through 100 in five-point steps');
assert.deepStrictEqual(percentages[0], { percent:40, load:40 }, 'percentage table starts at 40 percent');
assert.deepStrictEqual(percentages[12], { percent:100, load:100 }, 'percentage table ends at 100 percent');

assert.deepStrictEqual(oneRM.validate({ weight:100, reps:5, unit:'kg' }), { ok:true, errors:{} }, 'valid metric input passes');
assert.deepStrictEqual(oneRM.validate({ weight:100, reps:13, unit:'kg' }).errors, { reps:'range' }, 'repetitions above twelve fail');
assert.deepStrictEqual(oneRM.validate({ weight:0, reps:5, unit:'kg' }).errors, { weight:'range' }, 'zero weight fails');
assert.deepStrictEqual(oneRM.validate({ weight:100, reps:2.5, unit:'kg' }).errors, { reps:'range' }, 'fractional repetitions fail');
assert.deepStrictEqual(oneRM.validate({ weight:100, reps:5, unit:'stone' }).errors, { unit:'unsupported' }, 'unsupported units fail');

console.log('one-rm engine tests passed');
