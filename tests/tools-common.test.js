const assert = require('assert');
const tools = require('../assets/js/tools-common.js');

const memory = new Map();
const storage = {
  getItem(key) {
    return memory.has(key) ? memory.get(key) : null;
  },
  setItem(key, value) {
    memory.set(key, String(value));
  },
  removeItem(key) {
    memory.delete(key);
  },
};

(async function run() {
  const store = tools.safeStore('vf_test_v1', storage);
  assert.deepStrictEqual(store.read({ entries: [] }), { entries: [] }, 'missing state returns fallback');
  assert.strictEqual(store.write({ entries: [1] }), true, 'valid state is persisted');
  assert.deepStrictEqual(store.read({ entries: [] }), { entries: [1] }, 'stored state is parsed');

  memory.set('vf_test_v1', '{broken');
  assert.deepStrictEqual(store.read({ entries: [] }), { entries: [] }, 'malformed state returns fallback');
  assert.strictEqual(store.clear(), true, 'stored state can be cleared');
  assert.strictEqual(memory.has('vf_test_v1'), false, 'clear removes the namespaced value');

  const blockedStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  const blocked = tools.safeStore('vf_blocked_v1', blockedStorage);
  assert.deepStrictEqual(blocked.read({ ok: false }), { ok: false }, 'blocked reads return fallback');
  assert.strictEqual(blocked.write({ ok: true }), false, 'blocked writes report failure');
  assert.strictEqual(blocked.clear(), false, 'blocked clears report failure');

  assert.strictEqual(tools.formatNumber(1234.56, 'es-ES', 1), '1.234,6', 'Spanish decimal format is localized');
  assert.strictEqual(tools.formatNumber(1234.56, 'en-US', 0), '1,235', 'English integer format is localized');
  assert.deepStrictEqual(await tools.readJsonFile({ text:async () => '{"ok":true}' }), { ok:true }, 'JSON files are parsed');

  const attributes = new Map();
  const error = { textContent:'' };
  const input = {
    id:'weight',
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
  };
  const root = { querySelector:selector => selector === '[data-error-for="weight"]' ? error : null };
  tools.setFieldError(input, 'Required', root);
  assert.strictEqual(attributes.get('aria-invalid'), 'true', 'invalid fields are exposed to assistive technology');
  assert.strictEqual(error.textContent, 'Required', 'field error text is rendered');
  tools.setFieldError(input, '', root);
  assert.strictEqual(attributes.has('aria-invalid'), false, 'valid fields remove invalid state');

  const events = [];
  const anchor = { click:() => events.push('click'), remove:() => events.push('remove') };
  const env = {
    Blob,
    URL:{ createObjectURL:() => 'blob:test', revokeObjectURL:url => events.push(`revoke:${url}`) },
    document:{
      createElement:() => anchor,
      body:{ appendChild:node => events.push(node === anchor ? 'append' : 'other') },
    },
  };
  tools.downloadBlob('data.json', 'application/json', '{}', env);
  assert.strictEqual(anchor.download, 'data.json', 'download filename is assigned');
  assert.strictEqual(anchor.href, 'blob:test', 'download URL is assigned');
  assert.deepStrictEqual(events, ['append', 'click', 'remove', 'revoke:blob:test'], 'download resource is released');

  console.log('tools-common tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
