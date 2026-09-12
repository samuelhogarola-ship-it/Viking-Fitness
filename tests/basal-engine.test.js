const assert = require('assert');
const basal = require('../assets/js/basal-engine.js');

assert.strictEqual(basal.bmr({ sex:'male', age:30, kg:80, cm:180 }), 1780);
assert.strictEqual(basal.bmr({ sex:'female', age:30, kg:60, cm:165 }), 1320.25);
assert.strictEqual(basal.tdee(1780, 1.55), 2759);
assert.deepStrictEqual(basal.goalRange(2500, 'loss'), { min:2000, max:2200 });
assert.deepStrictEqual(basal.goalRange(2500, 'gain'), { min:2700, max:2800 });
assert.deepStrictEqual(basal.goalRange(2500, 'maintain'), { min:2500, max:2500 });
assert.ok(Math.abs(basal.toMetric({ unit:'imperial', weight:176.3698, feet:5, inches:10 }).kg - 80) < 0.01);
assert.ok(Math.abs(basal.toMetric({ unit:'imperial', weight:176.3698, feet:5, inches:10 }).cm - 177.8) < 0.01);
assert.deepStrictEqual(basal.toMetric({ unit:'metric', weight:80, height:180 }), { kg:80, cm:180 });
assert.strictEqual(basal.ACTIVITY.moderate, 1.55);
assert.strictEqual(basal.validate({ sex:'male', age:17, unit:'metric', weight:80, height:180, activity:'moderate', goal:'maintain' }).errors.age, 'range');
assert.strictEqual(basal.validate({ sex:'female', age:30, unit:'imperial', weight:132, feet:5, inches:12, activity:'light', goal:'gain' }).errors.inches, 'range');
assert.strictEqual(basal.validate({ sex:'other', age:30, unit:'metric', weight:60, height:165, activity:'light', goal:'maintain' }).errors.sex, 'unsupported');
assert.strictEqual(basal.validate({ sex:'female', age:30, unit:'metric', weight:60, height:165, activity:'unknown', goal:'maintain' }).errors.activity, 'unsupported');
assert.strictEqual(basal.validate({ sex:'female', age:30, unit:'metric', weight:60, height:165, activity:'light', goal:'cut' }).errors.goal, 'unsupported');

console.log('basal engine tests passed');
