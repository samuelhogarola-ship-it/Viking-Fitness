/* ============================================================
   VIKING FITNESS — Shared helpers for independent tools
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VFTools = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function cloneFallback(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function safeStore(namespace, storage) {
    const target = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    return {
      read(fallback) {
        if (!target) return cloneFallback(fallback);
        try {
          const raw = target.getItem(namespace);
          return raw === null ? cloneFallback(fallback) : JSON.parse(raw);
        } catch {
          return cloneFallback(fallback);
        }
      },
      write(value) {
        if (!target) return false;
        try {
          target.setItem(namespace, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      },
      clear() {
        if (!target) return false;
        try {
          target.removeItem(namespace);
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  function formatNumber(value, locale, digits) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: Number.isInteger(digits) ? digits : 1,
      useGrouping: true,
    }).format(value);
  }

  async function readJsonFile(file) {
    return JSON.parse(await file.text());
  }

  function setFieldError(input, message, rootNode) {
    if (!input) return;
    const root = rootNode || input.form || (typeof document !== 'undefined' ? document : null);
    const error = root && input.id ? root.querySelector(`[data-error-for="${input.id}"]`) : null;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    if (error) error.textContent = message || '';
  }

  function downloadBlob(filename, mime, text, environment) {
    const env = environment || (typeof window !== 'undefined' ? window : null);
    if (!env || !env.document || !env.URL || !env.Blob) return false;
    const blob = new env.Blob([text], { type:mime });
    const url = env.URL.createObjectURL(blob);
    const anchor = env.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    env.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    env.URL.revokeObjectURL(url);
    return true;
  }

  return {
    safeStore,
    downloadBlob,
    readJsonFile,
    formatNumber,
    setFieldError,
  };
});
