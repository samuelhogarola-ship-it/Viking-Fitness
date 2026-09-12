const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const origin = 'https://www.vikingfitness.es';

const clusters = [
  [['es', 'herramientas.html'], ['en', 'en/tools.html'], ['fi', 'fi/tyokalut.html'], ['no', 'no/verktoy.html']],
  [['es', 'calculadora-1rm.html'], ['en', 'en/one-rep-max-calculator.html'], ['fi', 'fi/1rm-laskuri.html'], ['no', 'no/1rm-kalkulator.html']],
  [['es', 'calculadora-metabolismo-basal.html'], ['en', 'en/basal-metabolic-rate-calculator.html'], ['fi', 'fi/perusaineenvaihduntalaskuri.html'], ['no', 'no/basalstoffskifte-kalkulator.html']],
  [['es', 'temporizador-vikingo.html'], ['en', 'en/viking-workout-timer.html'], ['fi', 'fi/viikinki-treeniajastin.html'], ['no', 'no/viking-treningstimer.html']],
  [['es', 'contador-calorias.html'], ['en', 'en/calorie-counter.html'], ['fi', 'fi/kalorilaskuri.html'], ['no', 'no/kaloriteller.html']],
  [['es', 'diario-guerrero.html'], ['en', 'en/warrior-journal.html'], ['fi', 'fi/soturin-paivakirja.html'], ['no', 'no/krigerens-dagbok.html']],
  [['es', 'sudoku.html'], ['en', 'en/viking-sudoku.html'], ['fi', 'fi/viikinki-sudoku.html'], ['no', 'no/viking-sudoku.html']],
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function absolute(file) {
  return `${origin}/${file}`;
}

function tagAttributes(tag) {
  return Object.fromEntries(Array.from(tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g), match => [match[1].toLowerCase(), match[3]]));
}

function tags(html, name) {
  return Array.from(html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi')), match => tagAttributes(match[0]));
}

function metaContent(html, name) {
  return tags(html, 'meta').find(tag => tag.name === name)?.content || '';
}

test('all 28 localized pages expose complete, reciprocal and parseable SEO metadata', () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const cluster of clusters) {
    const expectedAlternates = Object.fromEntries(cluster.map(([lang, file]) => [lang, absolute(file)]));
    expectedAlternates['x-default'] = absolute(cluster[0][1]);

    for (const [lang, file] of cluster) {
      const html = read(file);
      const title = html.match(/<title>([^<]+)<\/title>/i)?.[1].trim() || '';
      const links = tags(html, 'link');
      const canonical = links.find(link => link.rel === 'canonical');
      const alternates = Object.fromEntries(links.filter(link => link.rel === 'alternate' && link.hreflang).map(link => [link.hreflang, link.href]));
      const jsonLd = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi), match => match[1]);

      assert.match(html, new RegExp(`<html\\b[^>]*\\blang=["']${lang}["']`, 'i'), `${file}: html lang`);
      assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${file}: exactly one h1`);
      assert.ok(title, `${file}: non-empty title`);
      assert.ok(metaContent(html, 'description'), `${file}: non-empty description`);
      assert.equal(canonical?.href, absolute(file), `${file}: self canonical`);
      assert.deepEqual(alternates, expectedAlternates, `${file}: reciprocal hreflang set`);
      assert.ok(jsonLd.length, `${file}: JSON-LD present`);
      for (const value of jsonLd) assert.doesNotThrow(() => JSON.parse(value), `${file}: valid JSON-LD`);
      assert.doesNotMatch(metaContent(html, 'robots'), /noindex/i, `${file}: indexable`);
      assert.match(html, /<script\b[^>]*src=["']\/assets\/js\/pwa\.js\?v=12["'][^>]*><\/script>/i, `${file}: service worker registration`);
      assert.ok(!titles.has(title), `${file}: duplicate title`);
      assert.ok(!descriptions.has(metaContent(html, 'description')), `${file}: duplicate description`);
      titles.add(title);
      descriptions.add(metaContent(html, 'description'));
    }
  }

  assert.equal(titles.size, 28);
  assert.equal(descriptions.size, 28);
});

test('multilingual sitemap contains each canonical with all five alternates', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /xmlns:xhtml=["']http:\/\/www\.w3\.org\/1999\/xhtml["']/);

  for (const cluster of clusters) {
    const expectedAlternates = [...cluster.map(([lang, file]) => [lang, absolute(file)]), ['x-default', absolute(cluster[0][1])]];
    for (const [, file] of cluster) {
      const url = absolute(file);
      const block = Array.from(sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g), match => match[1]).find(value => value.includes(`<loc>${url}</loc>`));
      assert.ok(block, `${file}: sitemap canonical entry`);
      for (const [lang, href] of expectedAlternates) {
        assert.ok(tags(block, 'xhtml:link').some(link => link.rel === 'alternate' && link.hreflang === lang && link.href === href), `${file}: sitemap ${lang} alternate`);
      }
    }
  }
});

test('robots, manifest, service worker and privacy page cover the new tools', () => {
  assert.match(read('robots.txt'), /^Sitemap: https:\/\/www\.vikingfitness\.es\/sitemap\.xml$/m);

  const manifest = JSON.parse(read('manifest.json'));
  const shortcuts = new Set(manifest.shortcuts.map(shortcut => shortcut.url));
  for (const url of ['/', '/sudoku.html', '/herramientas.html', '/temporizador-vikingo.html']) {
    assert.ok(shortcuts.has(url), `manifest shortcut ${url}`);
  }

  const worker = read('sw.js');
  assert.match(worker, /viking-fitness-pwa-v(?:1[2-9]|[2-9]\d)/, 'cache version is v12 or newer');
  for (const asset of ['/assets/css/tools.css?v=12', '/assets/js/tools-common.js?v=12', '/herramientas.html', '/temporizador-vikingo.html', '/sudoku.html']) {
    assert.ok(worker.includes(`'${asset}'`), `service worker precaches ${asset}`);
  }
  assert.match(read('assets/js/pwa.js'), /register\(["']\/sw\.js\?v=12["']\)/, 'pages request the v12 worker');

  const privacy = read('privacidad.html');
  for (const phrase of ['vf_viking_timer_v1', 'vf_calorie_counter_v1', 'vf_warrior_journal_v1', 'exportar', 'eliminar']) {
    assert.match(privacy, new RegExp(phrase, 'i'), `privacy describes ${phrase}`);
  }
});

test('user-visible sources do not contain the rejected terminology', () => {
  const rejected = new RegExp(`\\b${String.fromCharCode(99, 108, 97, 110)}\\b|klaan|\\bklan`, 'i');
  const files = clusters.flat().map(([, file]) => file).concat(['README.md']);
  for (const file of files) assert.doesNotMatch(read(file), rejected, file);
});
