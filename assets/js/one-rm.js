/* Viking Fitness — one-repetition maximum calculator UI */
(function () {
  'use strict';
  const form = document.getElementById('rmForm');
  if (!form || !window.VFOneRM || !window.VFTools) return;

  const copy = window.VFPageCopy;
  const weightInput = document.getElementById('rmWeight');
  const repsInput = document.getElementById('rmReps');
  const unitInput = document.getElementById('rmUnit');
  const exerciseInput = document.getElementById('rmExercise');
  const result = document.getElementById('rmResult');
  const resultValue = document.getElementById('rmValue');
  const resultTitle = document.getElementById('rmResultTitle');
  const tableBody = document.getElementById('rmTableBody');
  const status = document.getElementById('rmStatus');
  const copyButton = document.getElementById('rmCopy');
  const printButton = document.getElementById('rmPrint');
  let summary = '';

  function fieldMessage(code, field) {
    return code ? copy.errors[field] : '';
  }

  function zoneFor(percent) {
    if (percent <= 60) return copy.zones.power;
    if (percent <= 80) return copy.zones.volume;
    if (percent <= 95) return copy.zones.strength;
    return copy.zones.max;
  }

  function format(value, digits) {
    return VFTools.formatNumber(value, copy.locale, digits);
  }

  function showStatus(message, error) {
    status.textContent = message;
    status.hidden = !message;
    status.classList.toggle('tool-status--error', Boolean(error));
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const input = { weight:Number(weightInput.value), reps:Number(repsInput.value), unit:unitInput.value };
    const validation = VFOneRM.validate(input);
    VFTools.setFieldError(weightInput, fieldMessage(validation.errors.weight, 'weight'), form);
    VFTools.setFieldError(repsInput, fieldMessage(validation.errors.reps, 'reps'), form);
    VFTools.setFieldError(unitInput, fieldMessage(validation.errors.unit, 'unit'), form);
    if (!validation.ok) {
      result.hidden = true;
      showStatus(copy.errors.form, true);
      return;
    }

    const raw = VFOneRM.estimate(input.weight, input.reps);
    const estimated = VFOneRM.roundLoad(raw, input.unit);
    const exercise = exerciseInput.value.trim();
    resultValue.textContent = `${format(estimated, input.unit === 'kg' ? 1 : 0)} ${input.unit}`;
    resultTitle.textContent = exercise ? `${copy.resultFor} ${exercise}` : copy.result;
    tableBody.innerHTML = VFOneRM.percentages(raw, input.unit).map(row =>
      `<tr><td>${row.percent}%</td><td>${format(row.load, input.unit === 'kg' ? 1 : 0)} ${input.unit}</td><td>${zoneFor(row.percent)}</td></tr>`
    ).join('');
    summary = `${resultTitle.textContent}: ${resultValue.textContent}`;
    result.hidden = false;
    showStatus(copy.ready, false);
    resultTitle.focus();
  });

  unitInput.addEventListener('change', function () {
    weightInput.step = unitInput.value === 'kg' ? '0.5' : '1';
  });

  copyButton.addEventListener('click', async function () {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      showStatus(copy.copied, false);
    } catch {
      const area = document.createElement('textarea');
      area.value = summary;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      showStatus(copy.copied, false);
    }
  });

  printButton.addEventListener('click', function () {
    window.print();
  });
})();
