const assert = require('assert');
const copy = require('../assets/js/sudoku-copy.js');

const languages = ['es','en','fi','no'];
const required = [
  'easy','medium','hard','completedLabel','rowColumn','newBoard','lost','chooseCell','fixedCell',
  'threeMistakes','reset','progress','complete','sendingCode','sendCodeFailed','codeSent','wrongCode',
  'loginSuccess','logout','online','loginPrompt','offline','installReady','installUnavailable'
];

for (const lang of languages) {
  for (const key of required) assert.ok(copy[lang][key], `${lang}.${key}`);
  assert.ok(copy[lang].rowColumn.includes('{row}'), `${lang}.rowColumn includes row token`);
  assert.ok(copy[lang].rowColumn.includes('{column}'), `${lang}.rowColumn includes column token`);
  assert.ok(copy[lang].progress.includes('{filled}'), `${lang}.progress includes filled token`);
  assert.ok(copy[lang].complete.includes('{time}'), `${lang}.complete includes time token`);
}

assert.strictEqual(copy.es.easy, 'Fácil');
assert.strictEqual(copy.en.easy, 'Easy');
assert.strictEqual(copy.fi.hard, 'Vaikea');
assert.strictEqual(copy.no.medium, 'Middels');
console.log('sudoku locale tests passed');
