/* ============================================================
   VIKING FITNESS — App de seguimiento (localStorage)
   ============================================================ */
(function () {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const KEY = 'vf_saga_v1';
  const today = () => new Date().toISOString().slice(0, 10);

  /* ---------- Base de alimentos nórdicos (por 100 g) ---------- */
  const FOODS = [
    { n: 'Avena / Kaura / Havre',            kcal: 379, p: 13.2, c: 67.7, f: 6.5 },
    { n: 'Pan de centeno / Ruisleipä',       kcal: 259, p: 8.5,  c: 48.3, f: 3.3 },
    { n: 'Cebada perlada / Ohra / Bygg',     kcal: 352, p: 9.9,  c: 77.7, f: 1.2 },
    { n: 'Salmón / Lohi / Laks',             kcal: 208, p: 20.4, c: 0,    f: 13.4 },
    { n: 'Arenque / Silli / Sild',           kcal: 158, p: 18.0, c: 0,    f: 9.0 },
    { n: 'Bacalao / Turska / Torsk',         kcal: 82,  p: 18.0, c: 0,    f: 0.7 },
    { n: 'Skyr / Yogur griego 0 %',          kcal: 63,  p: 11.0, c: 4.0,  f: 0.2 },
    { n: 'Requesón / Rahka / Kesam',         kcal: 98,  p: 11.1, c: 3.4,  f: 4.3 },
    { n: 'Huevo / Kananmuna / Egg',          kcal: 143, p: 12.6, c: 0.7,  f: 9.5 },
    { n: 'Reno / Poro / Reinsdyr',           kcal: 127, p: 22.0, c: 0,    f: 4.0 },
    { n: 'Pollo pechuga / Broileri',         kcal: 120, p: 23.0, c: 0,    f: 2.6 },
    { n: 'Patata / Peruna / Potet',          kcal: 77,  p: 2.0,  c: 17.5, f: 0.1 },
    { n: 'Remolacha / Punajuuri / Rødbete',  kcal: 43,  p: 1.6,  c: 9.6,  f: 0.2 },
    { n: 'Zanahoria / Porkkana / Gulrot',    kcal: 41,  p: 0.9,  c: 9.6,  f: 0.2 },
    { n: 'Nabo / Nauris / Kålrot',           kcal: 38,  p: 1.1,  c: 8.6,  f: 0.1 },
    { n: 'Col rizada / Lehtikaali / Grønnkål', kcal: 49, p: 4.3, c: 8.8,  f: 0.9 },
    { n: 'Arándano / Mustikka / Blåbær',     kcal: 57,  p: 0.7,  c: 14.5, f: 0.3 },
    { n: 'Arándano rojo / Puolukka / Tyttebær', kcal: 46, p: 0.4, c: 12.2, f: 0.1 },
    { n: 'Aceite de colza / Rypsiöljy',      kcal: 884, p: 0,    c: 0,    f: 100 },
    { n: 'Almendra / Manteli / Mandel',      kcal: 579, p: 21.2, c: 21.6, f: 49.9 },
    { n: 'Lentejas cocidas / Linssit',       kcal: 116, p: 9.0,  c: 20.1, f: 0.4 },
    { n: 'Guisantes / Herneet / Erter',      kcal: 81,  p: 5.4,  c: 14.5, f: 0.4 }
  ];

  /* ---------- Estado ---------- */
  const blank = { workouts: [], meals: [], weights: [] };
  let db;
  try { db = Object.assign({}, blank, JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch { db = { ...blank }; }
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));

  /* ---------- Utilidades ---------- */
  const nf = n => Math.round(n).toLocaleString('es-ES');
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const volOf = w => w.sets * w.reps * w.kg;
  const toast = msg => {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2800);
  };

  /* ---------- Rangos ---------- */
  const THRESHOLDS = [0, 2000, 8000, 20000, 45000];   // XP acumulada
  function xp() {
    const vol = db.workouts.reduce((a, w) => a + volOf(w), 0);
    const days = new Set(db.workouts.map(w => w.date)).size;
    return Math.round(vol / 100) + days * 25 + db.meals.length * 2 + db.weights.length * 5;
  }
  function rank() {
    const names = VF.t('a.ranks').split('|');
    const x = xp();
    let i = 0;
    while (i < THRESHOLDS.length - 1 && x >= THRESHOLDS[i + 1]) i++;
    const lo = THRESHOLDS[i], hi = THRESHOLDS[i + 1];
    return {
      name: names[i], x,
      pct: hi ? Math.min(100, ((x - lo) / (hi - lo)) * 100) : 100,
      left: hi ? hi - x : 0
    };
  }

  /* ---------- Racha ---------- */
  function streak() {
    const days = new Set([...db.workouts.map(w => w.date), ...db.meals.map(m => m.date)]);
    let n = 0;
    const d = new Date();
    // Si hoy no hay nada, la racha aún puede venir de ayer
    if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (days.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---------- Render ---------- */
  function render() {
    const t = today();

    // Rango
    const r = rank();
    $('#rankName').textContent = r.name.toUpperCase();
    $('#rankBar').style.width = r.pct + '%';
    $('#rankXp').textContent = nf(r.x) + ' XP';
    $('#rankNext').innerHTML = r.left
      ? nf(r.left) + ' XP <span>' + VF.t('a.xpNext') + '</span>'
      : '★';

    // Stats
    const todayW = db.workouts.filter(w => w.date === t);
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const weekW = db.workouts.filter(w => w.date >= weekAgo);
    const todayM = db.meals.filter(m => m.date === t);

    $('#s-vol').innerHTML   = nf(todayW.reduce((a, w) => a + volOf(w), 0)) + ' <em>kg</em>';
    $('#s-week').innerHTML  = nf(weekW.reduce((a, w) => a + volOf(w), 0)) + ' <em>kg</em>';
    $('#s-cal').innerHTML   = nf(todayM.reduce((a, m) => a + m.kcal, 0)) + ' <em>kcal</em>';
    $('#s-prot').innerHTML  = nf(todayM.reduce((a, m) => a + m.p, 0)) + ' <em>g</em>';
    $('#s-streak').innerHTML= streak() + ' <em>' + VF.t('a.st.days') + '</em>';
    $('#s-sess').textContent = new Set(db.workouts.map(w => w.date)).size;

    // Tablas de entreno
    const trainHtml = todayW.length ? `
      <table>
        <thead><tr>
          <th>${VF.t('a.w.ex')}</th><th>${VF.t('a.w.sets')}</th><th>${VF.t('a.w.reps')}</th>
          <th>${VF.t('a.w.kg')}</th><th>${VF.t('a.w.vol')}</th><th></th>
        </tr></thead>
        <tbody>${todayW.map(w => `
          <tr>
            <td>${esc(w.ex)}</td>
            <td class="num">${w.sets}</td>
            <td class="num">${w.reps}</td>
            <td class="num">${w.kg}</td>
            <td class="num">${nf(volOf(w))} kg</td>
            <td style="text-align:right"><button class="del" data-del="workouts" data-id="${w.id}" aria-label="×">✕</button></td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<p class="empty">${VF.t('a.w.none')}</p>`;
    $('#listTrain').innerHTML = trainHtml;
    $('#dashTrain').innerHTML = trainHtml;

    // Comida
    $('#f-tot-cal').innerHTML = nf(todayM.reduce((a, m) => a + m.kcal, 0)) + ' <em>kcal</em>';
    $('#f-tot-p').innerHTML   = nf(todayM.reduce((a, m) => a + m.p, 0)) + ' <em>g</em>';
    $('#f-tot-c').innerHTML   = nf(todayM.reduce((a, m) => a + m.c, 0)) + ' <em>g</em>';
    $('#f-tot-f').innerHTML   = nf(todayM.reduce((a, m) => a + m.f, 0)) + ' <em>g</em>';

    $('#listFood').innerHTML = todayM.length ? `
      <table>
        <thead><tr>
          <th>${VF.t('a.f.food')}</th><th>${VF.t('a.f.grams')}</th><th>kcal</th>
          <th>P</th><th>C</th><th>G</th><th></th>
        </tr></thead>
        <tbody>${todayM.map(m => `
          <tr>
            <td>${esc(m.name)}</td>
            <td class="num">${m.g} g</td>
            <td class="num">${nf(m.kcal)}</td>
            <td class="num">${m.p.toFixed(1)}</td>
            <td class="num">${m.c.toFixed(1)}</td>
            <td class="num">${m.f.toFixed(1)}</td>
            <td style="text-align:right"><button class="del" data-del="meals" data-id="${m.id}" aria-label="×">✕</button></td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<p class="empty">${VF.t('a.f.none')}</p>`;

    // Peso
    const ws = [...db.weights].sort((a, b) => a.date.localeCompare(b.date));
    $('#listWeight').innerHTML = ws.length ? `
      <table>
        <thead><tr><th>${VF.t('a.date')}</th><th>${VF.t('a.p.kg')}</th><th></th></tr></thead>
        <tbody>${[...ws].reverse().map(w => `
          <tr>
            <td>${w.date}</td>
            <td class="num">${w.kg} kg</td>
            <td style="text-align:right"><button class="del" data-del="weights" data-id="${w.id}" aria-label="×">✕</button></td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<p class="empty">${VF.t('a.p.none')}</p>`;

    drawChart($('#chartProg'), $('#chartProgEmpty'), ws);
    drawChart($('#chartDash'), $('#chartDashEmpty'), ws);
  }

  /* ---------- Gráfico de peso ---------- */
  function drawChart(svg, emptyEl, data) {
    if (!svg) return;
    if (data.length < 2) { svg.style.display = 'none'; emptyEl.style.display = 'block'; return; }
    svg.style.display = 'block'; emptyEl.style.display = 'none';

    const W = 600, H = 220, pad = 26;
    const kgs = data.map(d => d.kg);
    const min = Math.min(...kgs), max = Math.max(...kgs);
    const span = (max - min) || 1;
    const x = i => pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = v => H - pad - ((v - min) / span) * (H - pad * 2);

    const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.kg).toFixed(1)}`).join(' ');
    const area = `${line} L${x(data.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;

    svg.innerHTML = `
      <defs>
        <linearGradient id="vfArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#c9a227" stop-opacity=".38"/>
          <stop offset="1" stop-color="#c9a227" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${[0, .5, 1].map(f => `<line x1="${pad}" x2="${W - pad}" y1="${pad + f * (H - pad * 2)}" y2="${pad + f * (H - pad * 2)}" stroke="rgba(255,255,255,.07)"/>`).join('')}
      <path d="${area}" fill="url(#vfArea)"/>
      <path d="${line}" fill="none" stroke="#c9a227" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${data.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(d.kg).toFixed(1)}" r="3.5" fill="#0b0e11" stroke="#f0d888" stroke-width="2"><title>${d.date} · ${d.kg} kg</title></circle>`).join('')}
      <text x="${pad}" y="16" fill="#7b858e" font-size="11">${max} kg</text>
      <text x="${pad}" y="${H - 6}" fill="#7b858e" font-size="11">${min} kg</text>`;
  }

  /* ---------- Formularios ---------- */
  $('#formTrain').addEventListener('submit', e => {
    e.preventDefault();
    db.workouts.push({
      id: crypto.randomUUID(), date: today(),
      ex: $('#t-ex').value.trim(),
      sets: +$('#t-sets').value, reps: +$('#t-reps').value, kg: +$('#t-kg').value
    });
    save(); render(); VFAudio.strike(); toast(VF.t('a.saved'));
    $('#t-ex').value = '';
  });

  $('#formFood').addEventListener('submit', e => {
    e.preventDefault();
    const g = +$('#f-g').value, k = g / 100;
    db.meals.push({
      id: crypto.randomUUID(), date: today(),
      name: $('#f-name').value.trim(), g,
      kcal: +$('#f-kcal').value * k,
      p: +$('#f-p').value * k, c: +$('#f-c').value * k, f: +$('#f-f').value * k
    });
    save(); render(); toast(VF.t('a.saved'));
    $('#f-name').value = '';
  });

  $('#formWeight').addEventListener('submit', e => {
    e.preventDefault();
    const kg = +$('#w-kg').value;
    const existing = db.weights.find(w => w.date === today());
    if (existing) existing.kg = kg;
    else db.weights.push({ id: crypto.randomUUID(), date: today(), kg });
    save(); render(); toast(VF.t('a.saved'));
    $('#w-kg').value = '';
  });

  /* ---------- Borrado de filas ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    const coll = b.dataset.del;
    db[coll] = db[coll].filter(x => x.id !== b.dataset.id);
    save(); render(); toast(VF.t('a.deleted'));
  });

  $('#resetAll').addEventListener('click', () => {
    if (!confirm(VF.t('a.confirmReset'))) return;
    db = { ...blank, workouts: [], meals: [], weights: [] };
    save(); render(); toast(VF.t('a.resetOk'));
  });

  /* ---------- Selector de alimentos ---------- */
  function buildFoodPicker() {
    const sel = $('#f-pick');
    sel.innerHTML = `<option value="">— ${VF.t('a.f.custom')} —</option>` +
      FOODS.map((f, i) => `<option value="${i}">${esc(f.n)} · ${f.kcal} kcal</option>`).join('');
  }
  $('#f-pick').addEventListener('change', e => {
    const f = FOODS[e.target.value];
    if (!f) return;
    $('#f-name').value = f.n; $('#f-kcal').value = f.kcal;
    $('#f-p').value = f.p; $('#f-c').value = f.c; $('#f-f').value = f.f;
  });

  /* ---------- Ejercicios rápidos ---------- */
  const PRESETS = [
    ['Sentadilla', 100], ['Peso muerto', 120], ['Press banca', 70],
    ['Remo con barra', 65], ['Press militar', 45], ['Cargada', 60],
    ['Salto al cajón', 0], ['Kettlebell swing', 24]
  ];
  function buildChips() {
    $('#exChips').innerHTML = PRESETS.map(([n, kg]) =>
      `<button type="button" class="chip" data-ex="${esc(n)}" data-kg="${kg}">${esc(n)}</button>`).join(' ');
  }
  $('#exChips').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $('#t-ex').value = c.dataset.ex;
    if (+c.dataset.kg) $('#t-kg').value = c.dataset.kg;
    $('#t-ex').focus();
  });

  /* ---------- Pestañas ---------- */
  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    $('#p-' + tab.dataset.panel).classList.add('active');
  }));

  /* ---------- Sonido ---------- */
  const soundBtn = $('#soundToggle');
  const storedMute = localStorage.getItem('vf_muted');
  let muted = storedMute === '1';
  if (storedMute === null) localStorage.setItem('vf_muted', '0');

  function startDefaultSound() {
    if (!muted && !VFAudio.running) VFAudio.start(false);
  }

  function syncSound() {
    const on = !muted;
    soundBtn.classList.toggle('is-off', !on);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.title = on ? VF.t('sound.off') : VF.t('sound.on');
    soundBtn.setAttribute('aria-label', soundBtn.title);
  }
  soundBtn.addEventListener('click', () => {
    if (!VFAudio.running) { muted = false; VFAudio.start(false); }
    else { muted = !muted; muted ? VFAudio.mute() : VFAudio.unmute(); }
    localStorage.setItem('vf_muted', muted ? '1' : '0');
    syncSound();
  });
  ['click', 'keydown'].forEach(type => {
    document.addEventListener(type, startDefaultSound, { once: true, passive: true });
  });
  document.addEventListener('vf:audio', syncSound);
  document.addEventListener('vf:lang', syncSound);
  syncSound();

  /* ---------- Idioma ---------- */
  const lang = $('#lang'), langBtn = $('#langBtn');
  langBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = lang.classList.toggle('open');
    langBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', () => lang.classList.remove('open'));
  $$('[data-lang]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault(); VF.apply(b.dataset.lang); lang.classList.remove('open');
  }));
  document.addEventListener('vf:lang', () => { buildFoodPicker(); buildChips(); render(); syncSound(); });

  /* ---------- Arranque ---------- */
  VF.apply();
  buildFoodPicker();
  buildChips();
  render();
  syncSound();
})();
