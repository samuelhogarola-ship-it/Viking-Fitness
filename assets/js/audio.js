/* ============================================================
   VIKING FITNESS — Ambiente sonoro del Valhalla
   Todo se sintetiza con Web Audio API: sin archivos externos.
   Tambor de marco + drone grave + cuerno lejano.
   ============================================================ */
window.VFAudio = (function () {
  let ctx = null, master = null, running = false;
  let timer = null, nextTime = 0, step = 0;
  let droneNodes = [];

  const BPM = 74;
  const STEP = 60 / BPM / 2;          // corcheas
  const LOOKAHEAD = 0.12;             // s
  const TICK = 25;                    // ms

  // Patrón de tambor de 16 pasos: 2 = golpe fuerte, 1 = golpe suave, 0 = silencio
  const PATTERN = [2,0,1,0, 2,0,0,1, 2,0,1,0, 1,1,0,1];

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    return ctx;
  }

  /* ---------- Ruido reutilizable ---------- */
  let noiseBuffer = null;
  function noise() {
    if (!noiseBuffer) {
      const len = ctx.sampleRate * 1.2;
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    return src;
  }

  /* ---------- Tambor de marco ---------- */
  function drum(time, strong) {
    const gain = strong ? 0.9 : 0.42;

    // Cuerpo: seno que cae de golpe
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(strong ? 132 : 118, time);
    osc.frequency.exponentialRampToValueAtTime(strong ? 44 : 52, time + 0.16);
    og.gain.setValueAtTime(0.0001, time);
    og.gain.exponentialRampToValueAtTime(gain, time + 0.008);
    og.gain.exponentialRampToValueAtTime(0.0001, time + (strong ? 0.62 : 0.34));
    osc.connect(og).connect(master);
    osc.start(time); osc.stop(time + 0.8);

    // Piel: ruido filtrado corto
    const n = noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = strong ? 1500 : 2100; bp.Q.value = 0.8;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(gain * 0.32, time);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.085);
    n.connect(bp).connect(ng).connect(master);
    n.start(time); n.stop(time + 0.2);
  }

  /* ---------- Coro gregoriano: vocal "aah" con formantes ---------- */
  function chant(time, freq, dur = 3.4, level = 0.075, glideTo = 0) {
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, time);
    out.gain.exponentialRampToValueAtTime(level, time + dur * 0.35);   // entrada lenta
    out.gain.setValueAtTime(level, time + dur * 0.65);
    out.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    out.connect(master);

    // Dos formantes vocálicos aproximan la vocal /a/
    [[700, 9], [1150, 11]].forEach(([f, q]) => {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      bp.connect(out);
      // tres voces ligeramente desafinadas por formante
      [-4, 0, 5].forEach(cents => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        const f0 = freq * Math.pow(2, cents / 1200);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f0, time);
        if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo * Math.pow(2, cents / 1200), time + dur * 0.7);
        g.gain.value = 0.34;

        // vibrato de coro, muy lento
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 4.2 + cents * 0.05;
        lg.gain.value = freq * 0.004;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(time); lfo.stop(time + dur + 0.2);

        o.connect(g).connect(bp);
        o.start(time); o.stop(time + dur + 0.2);
      });
    });
  }

  /* ---------- Cuerno lejano (una nota grave con vibrato suave) ---------- */
  function horn(time, freq = 98) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    const g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o1.type = 'sawtooth'; o2.type = 'sawtooth';
    o1.frequency.value = freq; o2.frequency.value = freq * 1.005;
    lp.type = 'lowpass'; lp.frequency.value = 620; lp.Q.value = 0.6;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.16, time + 0.5);
    g.gain.setValueAtTime(0.16, time + 1.6);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 3.2);
    o1.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
    o1.start(time); o2.start(time); o1.stop(time + 3.4); o2.stop(time + 3.4);
  }

  /* ---------- Drone: quinta grave sostenida ---------- */
  function startDrone() {
    const base = 55; // A1
    [base, base * 1.5, base * 2].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      lp.type = 'lowpass'; lp.frequency.value = 400;
      g.gain.value = [0.09, 0.05, 0.028][i];

      // respiración lenta
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      lfo.frequency.value = 0.045 + i * 0.017;
      lfoG.gain.value = g.gain.value * 0.55;
      lfo.connect(lfoG).connect(g.gain);
      lfo.start();

      o.connect(lp).connect(g).connect(master);
      o.start();
      droneNodes.push(o, lfo);
    });

    // viento del norte: ruido muy filtrado
    const n = noise();
    n.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 340;
    const g = ctx.createGain(); g.gain.value = 0.05;
    n.connect(lp).connect(g).connect(master);
    n.start();
    droneNodes.push(n);
  }

  /* ---------- Secuenciador ---------- */
  // Melodía modal (re dórico) para el coro y los cuernos
  const CHANT = [146.83, 174.61, 196.00, 174.61, 220.00, 196.00, 174.61, 146.83];
  const HORNS = [73.42, 98.00, 87.31, 98.00];
  let chantIdx = 0, hornIdx = 0;

  function schedule() {
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      const hit = PATTERN[step % PATTERN.length];
      if (hit) drum(nextTime, hit === 2);

      // Coro cada 8 pasos (~3,2 s): línea continua de fondo
      if (step % 8 === 0) chant(nextTime, CHANT[chantIdx++ % CHANT.length], 3.4);

      // Cuernos cada compás y medio en vez de cada cuatro
      if (step % (PATTERN.length + 8) === 0 && step > 0) horn(nextTime, HORNS[hornIdx++ % HORNS.length]);

      nextTime += STEP;
      step++;
    }
  }

  /* ---------- API ---------- */
  function start(withFanfare) {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (running) { fadeTo(0.32); return; }
    running = true;

    startDrone();
    if (withFanfare) {
      const t = ctx.currentTime + 0.02;
      // Entrada: coro gregoriano ascendente y suave ("Valhalla is calling"),
      // luego cuerno y, ya a compás, los tambores.
      chant(t, 110.00, 2.6, 0.09, 164.81);
      horn(t + 1.9, 73.42);
      drum(t + 2.5, true); drum(t + 2.76, true); drum(t + 3.02, true);
    }
    nextTime = ctx.currentTime + (withFanfare ? 3.4 : 0.2);
    step = 0; chantIdx = 0; hornIdx = 0;
    timer = setInterval(schedule, TICK);
    fadeTo(0.32);
  }

  function fadeTo(v, dur = 1.6) {
    if (!master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.linearRampToValueAtTime(v, now + dur);
  }

  function mute()  { fadeTo(0, .6); }
  function unmute(){ if (!running) start(false); else { if (ctx.state === 'suspended') ctx.resume(); fadeTo(0.32); } }

  /* Golpe puntual para la UI (entrar, enviar formulario) */
  function strike() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    const wasSilent = !running;
    if (wasSilent) { const g = master.gain.value; master.gain.setValueAtTime(0.32, ctx.currentTime); drum(ctx.currentTime + 0.01, true); master.gain.setValueAtTime(g, ctx.currentTime + 1.2); }
    else drum(ctx.currentTime + 0.01, true);
  }

  return { start, mute, unmute, strike, get running() { return running; } };
})();
