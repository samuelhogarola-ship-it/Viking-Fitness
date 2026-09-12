/* Viking Fitness — one-repetition maximum calculation engine */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VFOneRM = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function estimate(weight, reps) {
    return reps === 1 ? weight : weight * (1 + reps / 30);
  }

  function roundLoad(value, unit) {
    const increment = unit === 'lb' ? 1 : 0.5;
    return Math.round(value / increment) * increment;
  }

  function percentages(oneRM, unit) {
    return Array.from({ length:13 }, (_, index) => {
      const percent = 40 + index * 5;
      return { percent, load:roundLoad(oneRM * percent / 100, unit) };
    });
  }

  function validate(input) {
    const errors = {};
    const weight = Number(input && input.weight);
    const reps = Number(input && input.reps);
    const unit = input && input.unit;
    if (!Number.isFinite(weight) || weight <= 0 || weight > 2000) errors.weight = 'range';
    if (!Number.isInteger(reps) || reps < 1 || reps > 12) errors.reps = 'range';
    if (unit !== 'kg' && unit !== 'lb') errors.unit = 'unsupported';
    return { ok:Object.keys(errors).length === 0, errors };
  }

  return { estimate, roundLoad, percentages, validate };
});
