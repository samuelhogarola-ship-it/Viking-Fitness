/* ============================================================
   VIKING FITNESS — Interacción de la landing
   ============================================================ */
(function () {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) requestAnimationFrame(() => scrollTo(0, 0));

  /* ---------- Idioma ---------- */
  VF.apply();

  const lang = $('#lang'), langBtn = $('#langBtn');
  if (langBtn) {
    langBtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = lang.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', () => lang.classList.remove('open'));
  }
  $$('[data-lang]').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      VF.apply(b.dataset.lang);
      lang && lang.classList.remove('open');
    });
  });

  /* ---------- Portal de entrada ---------- */
  const portal = $('#portal');
  const portalBg = portal ? $('.portal-bg', portal) : null;
  const soundBtn = $('#soundToggle');
  let muted = localStorage.getItem('vf_muted') === '1';
  if (portalBg) {
    const showPortalBg = () => setTimeout(() => {
      portal.classList.add('is-bg-ready');
      if (!muted) VFAudio.startPreview(true);
    }, 650);
    portalBg.complete ? showPortalBg() : portalBg.addEventListener('load', showPortalBg, { once: true });
  }

  // Prepage y main usan fuentes distintas: el portal intenta arrancar su
  // ambiente sintetico al revelarse, y la main activa YouTube solo al entrar.
  function startMainSoundWhenTitleIsReady() {
    const heroTitle = $('.hero h1');
    if (!heroTitle || muted) return;
    requestAnimationFrame(() => {
      heroTitle.scrollIntoView({ block: 'center' });
      setTimeout(() => VFAudio.startMain(), 420);
    });
  }

  function openGates(withSound) {
    if (!portal) return;
    muted = !withSound;
    localStorage.setItem('vf_muted', muted ? '1' : '0');
    if (muted) VFAudio.mute();
    portal.classList.add('is-open');
    document.body.classList.remove('is-locked');
    if (!muted) startMainSoundWhenTitleIsReady();
    syncSoundIcon();
  }
  $('#enterSound') && $('#enterSound').addEventListener('click', () => openGates(true));
  $('#enterSilent') && $('#enterSilent').addEventListener('click', () => openGates(false));
  // Si ya entró antes en esta sesión, no repetimos el portal
  if (sessionStorage.getItem('vf_entered') && portal) {
    portal.classList.add('is-open');
    document.body.classList.remove('is-locked');
    if (!location.hash) requestAnimationFrame(() => scrollTo(0, 0));
    if (!muted) VFAudio.startMain();
  }
  portal && portal.addEventListener('transitionend', () => sessionStorage.setItem('vf_entered', '1'));

  /* ---------- Sonido ---------- */
  function syncSoundIcon() {
    if (!soundBtn) return;
    const on = !muted;
    soundBtn.classList.toggle('is-off', !on);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.title = on ? VF.t('sound.off') : VF.t('sound.on');
    soundBtn.setAttribute('aria-label', soundBtn.title);
  }

  soundBtn && soundBtn.addEventListener('click', () => {
    if (!VFAudio.running) { muted = false; VFAudio.startMain(); }
    else { muted = !muted; muted ? VFAudio.mute() : VFAudio.unmute(); }
    localStorage.setItem('vf_muted', muted ? '1' : '0');
    syncSoundIcon();
  });
  document.addEventListener('vf:audio', syncSoundIcon);
  document.addEventListener('vf:lang', syncSoundIcon);
  syncSoundIcon();

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 40);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger'), navLinks = $('#navLinks');
  burger && burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  /* ---------- Enlaces "próximamente" (app aún no disponible) ---------- */
  $$('[data-coming-soon]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      vfToast(VF.t('soon.msg'));
    });
  });

  /* ---------- Reveal al hacer scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px' });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 70 + 'ms'; io.observe(el); });

  /* ---------- Acordeón: Entrenamientos / Nutrición ---------- */
  const accItems = $$('.acc-item');
  function openAcc(item, { scroll = false } = {}) {
    accItems.forEach(other => {
      if (other !== item) {
        other.classList.remove('open');
        $('.acc-trigger', other).setAttribute('aria-expanded', 'false');
      }
    });
    item.classList.add('open');
    $('.acc-trigger', item).setAttribute('aria-expanded', 'true');
    if (scroll) item.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  accItems.forEach(item => {
    const trigger = $('.acc-trigger', item);
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      accItems.forEach(other => {
        other.classList.remove('open');
        $('.acc-trigger', other).setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) { item.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
    });
  });
  // Enlaces del menú (#entreno / #nutricion) abren el bloque correspondiente
  function openFromHash(hash) {
    const id = hash.replace('#', '');
    const item = document.getElementById(id);
    if (item && item.classList.contains('acc-item')) openAcc(item, { scroll: true });
  }
  $$('a[href^="#entreno"], a[href^="#nutricion"]').forEach(a => {
    a.addEventListener('click', e => {
      const hash = a.getAttribute('href');
      if (document.getElementById(hash.slice(1))) {
        e.preventDefault();
        openFromHash(hash);
      }
    });
  });
  if (location.hash === '#entreno' || location.hash === '#nutricion') openFromHash(location.hash);

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  window.vfToast = msg => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 3200);
  };

  /* ---------- Formulario ---------- */
  const form = $('#contactForm');
  form && form.addEventListener('submit', e => {
    if (!form.reportValidity()) { e.preventDefault(); return; }
    VFAudio.strike();
    vfToast(VF.t('cta.sent'));
  });

  /* ---------- Año ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
