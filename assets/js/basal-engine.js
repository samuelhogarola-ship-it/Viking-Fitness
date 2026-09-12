/* Viking Fitness — basal metabolism calculation engine */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VFBasal = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ACTIVITY = Object.freeze({
    sedentary:1.2,
    light:1.375,
    moderate:1.55,
    high:1.725,
    veryHigh:1.9,
  });

  function toMetric(input) {
    if (input.unit === 'imperial') {
      return {
        kg:Number(input.weight) * 0.45359237,
        cm:(Number(input.feet) * 12 + Number(input.inches)) * 2.54,
      };
    }
    return { kg:Number(input.weight), cm:Number(input.height) };
  }

  function bmr(input) {
    const base = 10 * input.kg + 6.25 * input.cm - 5 * input.age;
    return base + (input.sex === 'male' ? 5 : -161);
  }

  function tdee(value, factor) {
    return Math.round(value * factor);
  }

  function goalRange(value, goal) {
    if (goal === 'loss') return { min:value - 500, max:value - 300 };
    if (goal === 'gain') return { min:value + 200, max:value + 300 };
    return { min:value, max:value };
  }

  function validate(input) {
    const errors = {};
    const sex = input && input.sex;
    const age = Number(input && input.age);
    const unit = input && input.unit;
    const weight = Number(input && input.weight);
    const activity = input && input.activity;
    const goal = input && input.goal;

    if (sex !== 'male' && sex !== 'female') errors.sex = 'unsupported';
    if (!Number.isInteger(age) || age < 18 || age > 100) errors.age = 'range';
    if (unit !== 'metric' && unit !== 'imperial') errors.unit = 'unsupported';
    if (!Object.prototype.hasOwnProperty.call(ACTIVITY, activity)) errors.activity = 'unsupported';
    if (!['maintain', 'loss', 'gain'].includes(goal)) errors.goal = 'unsupported';

    if (unit === 'imperial') {
      const feet = Number(input.feet);
      const inches = Number(input.inches);
      if (!Number.isFinite(weight) || weight < 66 || weight > 882) errors.weight = 'range';
      if (!Number.isInteger(feet) || feet < 3 || feet > 8) errors.feet = 'range';
      if (!Number.isFinite(inches) || inches < 0 || inches >= 12) errors.inches = 'range';
    } else if (unit === 'metric') {
      const height = Number(input.height);
      if (!Number.isFinite(weight) || weight < 30 || weight > 400) errors.weight = 'range';
      if (!Number.isFinite(height) || height < 100 || height > 250) errors.height = 'range';
    }

    return { ok:Object.keys(errors).length === 0, errors };
  }

  return { ACTIVITY, toMetric, bmr, tdee, goalRange, validate };
});
