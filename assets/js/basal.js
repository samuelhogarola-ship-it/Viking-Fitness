/* Viking Fitness — basal metabolism calculator UI */
(function () {
  'use strict';
  const form = document.getElementById('basalForm');
  if (!form || !window.VFBasal || !window.VFTools) return;

  const copy = window.VFPageCopy;
  const ids = ['basalSex','basalAge','basalUnit','basalWeight','basalHeight','basalFeet','basalInches','basalActivity','basalGoal'];
  const fields = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const metricFields = document.getElementById('metricFields');
  const imperialFields = document.getElementById('imperialFields');
  const result = document.getElementById('basalResult');
  const status = document.getElementById('basalStatus');

  function showUnits() {
    const imperial = fields.basalUnit.value === 'imperial';
    metricFields.hidden = imperial;
    imperialFields.hidden = !imperial;
    fields.basalHeight.disabled = imperial;
    fields.basalFeet.disabled = !imperial;
    fields.basalInches.disabled = !imperial;
    fields.basalWeight.min = imperial ? '66' : '30';
    fields.basalWeight.max = imperial ? '882' : '400';
    fields.basalWeight.step = imperial ? '1' : '0.1';
    document.getElementById('weightUnit').textContent = imperial ? copy.lb : copy.kg;
  }

  function clearErrors() {
    ids.forEach(id => VFTools.setFieldError(fields[id], '', form));
  }

  function showStatus(message, error) {
    status.textContent = message;
    status.hidden = !message;
    status.classList.toggle('tool-status--error', Boolean(error));
  }

  fields.basalUnit.addEventListener('change', showUnits);
  showUnits();

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const input = {
      sex:fields.basalSex.value,
      age:Number(fields.basalAge.value),
      unit:fields.basalUnit.value,
      weight:Number(fields.basalWeight.value),
      height:Number(fields.basalHeight.value),
      feet:Number(fields.basalFeet.value),
      inches:Number(fields.basalInches.value),
      activity:fields.basalActivity.value,
      goal:fields.basalGoal.value,
    };
    const validation = VFBasal.validate(input);
    clearErrors();
    Object.keys(validation.errors).forEach(name => {
      const inputId = `basal${name.charAt(0).toUpperCase()}${name.slice(1)}`;
      if (fields[inputId]) VFTools.setFieldError(fields[inputId], copy.errors[name] || copy.errors.form, form);
    });
    if (!validation.ok) {
      result.hidden = true;
      showStatus(copy.errors.form, true);
      return;
    }

    const metric = VFBasal.toMetric(input);
    const basalValue = Math.round(VFBasal.bmr({ sex:input.sex, age:input.age, kg:metric.kg, cm:metric.cm }));
    const maintenance = VFBasal.tdee(basalValue, VFBasal.ACTIVITY[input.activity]);
    const range = VFBasal.goalRange(maintenance, input.goal);
    document.getElementById('basalValue').textContent = `${VFTools.formatNumber(basalValue, copy.locale, 0)} ${copy.kcalDay}`;
    document.getElementById('maintenanceValue').textContent = `${VFTools.formatNumber(maintenance, copy.locale, 0)} ${copy.kcalDay}`;
    document.getElementById('goalLabel').textContent = copy.goals[input.goal];
    document.getElementById('goalValue').textContent = range.min === range.max
      ? `${VFTools.formatNumber(range.min, copy.locale, 0)} ${copy.kcalDay}`
      : `${VFTools.formatNumber(range.min, copy.locale, 0)}–${VFTools.formatNumber(range.max, copy.locale, 0)} ${copy.kcalDay}`;
    result.hidden = false;
    showStatus(copy.ready, false);
    document.getElementById('basalResultTitle').focus();
  });
})();
