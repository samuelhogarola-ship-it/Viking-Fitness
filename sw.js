const CACHE_VERSION = 'viking-fitness-pwa-v12';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/herramientas.html',
  '/calculadora-1rm.html',
  '/calculadora-metabolismo-basal.html',
  '/temporizador-vikingo.html',
  '/contador-calorias.html',
  '/diario-guerrero.html',
  '/sudoku.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/css/styles.css?v=12',
  '/assets/css/tools.css?v=12',
  '/assets/css/sudoku.css?v=12',
  '/assets/js/i18n.js?v=12',
  '/assets/js/audio.js?v=12',
  '/assets/js/main.js?v=12',
  '/assets/js/tools-common.js?v=12',
  '/assets/js/one-rm-engine.js?v=12',
  '/assets/js/one-rm.js?v=12',
  '/assets/js/basal-engine.js?v=12',
  '/assets/js/basal.js?v=12',
  '/assets/js/timer-engine.js?v=12',
  '/assets/js/timer-audio.js?v=12',
  '/assets/js/timer.js?v=12',
  '/assets/js/calorie-engine.js?v=12',
  '/assets/js/calorie-counter.js?v=12',
  '/assets/js/journal-engine.js?v=12',
  '/assets/js/warrior-journal.js?v=12',
  '/assets/js/sudoku-engine.js?v=12',
  '/assets/js/sudoku-copy.js?v=12',
  '/assets/js/sudoku.js?v=12',
  '/assets/js/pwa.js?v=12',
  '/assets/img/favicon-32.png',
  '/assets/img/apple-touch-icon.png',
  '/assets/img/logo.webp',
  '/assets/img/hero.webp',
  '/assets/img/sudoku-viking-fitness.webp',
  '/assets/img/portal-valhalla.webp',
  '/assets/img/portal-torch-left.webp',
  '/assets/img/portal-torch-right.webp',
  '/assets/img/gildehallen.webp',
  '/assets/img/tienda-hachas-vikingas-decorativas.webp',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(OFFLINE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({
      ok: false,
      message: 'Sin conexión. El juego sigue guardando progreso local.',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })));
    return;
  }

  if (request.mode === 'navigate') {
    const localizedDirectory = url.pathname.startsWith('/en/')
      ? '/en/tools.html'
      : url.pathname.startsWith('/fi/')
        ? '/fi/tyokalut.html'
        : url.pathname.startsWith('/no/')
          ? '/no/verktoy.html'
          : '/herramientas.html';
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => (
          await caches.match(request)
          || await caches.match(localizedDirectory)
          || await caches.match('/herramientas.html')
          || caches.match('/sudoku.html')
        ))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (!response || response.status !== 200) return response;
      const copy = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});
