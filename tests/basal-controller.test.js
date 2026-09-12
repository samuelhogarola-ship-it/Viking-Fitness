const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const basal = require('../assets/js/basal-engine.js');

function element(value = '') {
  const listeners = {};
  return {
    value,
    hidden:false,
    disabled:false,
    textContent:'',
    classList:{ toggle() {} },
    addEventListener(type, listener) { listeners[type] = listener; },
    dispatch(type, event = {}) { listeners[type]?.({ preventDefault() {}, ...event }); },
    focus() {},
  };
}

test('maintenance calories use the exact BMR and round only the displayed result', () => {
  const elements = {
    basalForm:element(),
    basalSex:element('female'),
    basalAge:element('31'),
    basalUnit:element('metric'),
    basalWeight:element('61'),
    basalHeight:element('166'),
    basalFeet:element('5'),
    basalInches:element('10'),
    basalActivity:element('high'),
    basalGoal:element('maintain'),
    metricFields:element(),
    imperialFields:element(),
    basalResult:element(),
    basalStatus:element(),
    weightUnit:element(),
    basalValue:element(),
    maintenanceValue:element(),
    goalLabel:element(),
    goalValue:element(),
    basalResultTitle:element(),
  };
  const context = {
    VFBasal:basal,
    VFTools:{
      setFieldError() {},
      formatNumber(value) { return String(Math.round(value)); },
    },
    window:{
      VFBasal:basal,
      VFTools:null,
      VFPageCopy:{locale:'es-ES',kg:'kg',lb:'lb',kcalDay:'kcal/día',ready:'ready',errors:{form:'error'},goals:{maintain:'Maintain'}},
    },
    document:{ getElementById(id) { return elements[id] || null; } },
  };
  context.window.VFTools = context.VFTools;

  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/basal.js'), 'utf8'), context);
  elements.basalForm.dispatch('submit');

  assert.equal(elements.basalValue.textContent, '1332 kcal/día');
  assert.equal(elements.maintenanceValue.textContent, '2297 kcal/día');
});
