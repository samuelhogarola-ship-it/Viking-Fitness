/* ============================================================
   VIKING FITNESS — Audio
   - Prepage: Web Audio con trompas suaves + tambores en crescendo.
   - Main page: musica ambiente via YouTube.
   ============================================================ */
window.VFAudio = (function () {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const youtubeId = 'ynQKvum9Hiw';

  let ctx = null;
  let master = null;
  let ambient = null;
  let drums = null;
  let horns = null;
  let noiseBuffer = null;
  let drumTimer = null;
  let hornTimer = null;
  let startedAt = 0;
  let ambienceStarted = false;
  let previewRunning = false;

  let player = null;
  let apiReady = false;
  let apiLoading = false;
  let pendingMainStart = false;
  let mainRunning = false;
  let activeMode = null;

  function notify() {
    document.dispatchEvent(new Event('vf:audio'));
  }

  function makeNoiseBuffer() {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function ensureContext() {
    if (!AudioCtx) return false;
    if (ctx) return true;

    ctx = new AudioCtx();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -26;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = .012;
    compressor.release.value = .28;

    master = ctx.createGain();
    ambient = ctx.createGain();
    drums = ctx.createGain();
    horns = ctx.createGain();
    master.gain.value = 0;
    ambient.gain.value = .2;
    drums.gain.value = .42;
    horns.gain.value = .16;

    ambient.connect(master);
    drums.connect(master);
    horns.connect(master);
    master.connect(compressor);
    compressor.connect(ctx.destination);
    noiseBuffer = makeNoiseBuffer();
    return true;
  }

  function rampParam(param, value, seconds) {
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, seconds);
  }

  function startWind() {
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    filter.type = 'bandpass';
    filter.frequency.value = 340;
    filter.Q.value = .45;
    gain.gain.value = .018;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ambient);
    noise.start();
  }

  function startDrone() {
    [55, 82.41].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = i ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      gain.gain.value = i ? .035 : .05;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ambient);
      osc.start();
    });
  }

  function hitDrum(accent = 1) {
    if (!previewRunning || !ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const body = ctx.createGain();
    const noise = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    const age = Math.min((now - startedAt) / 18, 1);
    const level = (.12 + age * .2) * accent;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + .22);
    body.gain.setValueAtTime(level, now);
    body.gain.exponentialRampToValueAtTime(.001, now + .46);
    osc.connect(body);
    body.connect(drums);
    osc.start(now);
    osc.stop(now + .5);

    noise.buffer = noiseBuffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 190;
    noiseGain.gain.setValueAtTime(level * .16, now);
    noiseGain.gain.exponentialRampToValueAtTime(.001, now + .12);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(drums);
    noise.start(now);
    noise.stop(now + .14);
  }

  function scheduleDrums() {
    clearInterval(drumTimer);
    let step = 0;
    drumTimer = setInterval(() => {
      hitDrum(step % 4 === 0 ? 1.35 : .72);
      step += 1;
    }, 780);
  }

  function hornNote(freq, start, duration, gainLevel) {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const now = ctx.currentTime + start;
    osc.type = 'sawtooth';
    sub.type = 'triangle';
    osc.frequency.value = freq;
    sub.frequency.value = freq / 2;
    filter.type = 'lowpass';
    filter.frequency.value = 740;
    filter.Q.value = .9;
    gain.gain.setValueAtTime(.001, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + .6);
    gain.gain.setTargetAtTime(.001, now + duration - .8, .34);
    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(horns);
    osc.start(now);
    sub.start(now);
    osc.stop(now + duration + .4);
    sub.stop(now + duration + .4);
  }

  function playRagnarokCall() {
    if (!previewRunning || !ctx) return;
    hornNote(110, 0, 4.1, .055);
    hornNote(146.83, .45, 3.9, .04);
    hornNote(196, 1.15, 3.25, .032);
  }

  function scheduleHorns(withFanfare) {
    if (withFanfare) playRagnarokCall();
    clearInterval(hornTimer);
    hornTimer = setInterval(playRagnarokCall, 22000);
  }

  async function startPreview(withFanfare) {
    if (!ensureContext()) return;
    if (ctx.state === 'suspended') await ctx.resume();
    if (!ambienceStarted) {
      startedAt = ctx.currentTime;
      startWind();
      startDrone();
      ambienceStarted = true;
    }
    previewRunning = true;
    activeMode = 'preview';
    scheduleDrums();
    scheduleHorns(Boolean(withFanfare));
    rampParam(master.gain, .32, 1.2);
    notify();
  }

  function stopPreview() {
    if (!ctx || !previewRunning) return;
    rampParam(master.gain, 0, .22);
    clearInterval(drumTimer);
    clearInterval(hornTimer);
    previewRunning = false;
  }

  function loadYouTubeAPI() {
    if (apiReady || apiLoading || document.getElementById('yt-api')) return;
    apiLoading = true;
    const tag = document.createElement('script');
    tag.id = 'yt-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    apiLoading = false;
    if (pendingMainStart) {
      pendingMainStart = false;
      startMain();
    }
  };

  function createPlayer() {
    const div = document.createElement('div');
    div.id = 'yt-player';
    div.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0;';
    document.body.appendChild(div);

    player = new YT.Player('yt-player', {
      videoId: youtubeId,
      playerVars: {
        autoplay: 1,
        loop: 1,
        playlist: youtubeId,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: function (e) {
          e.target.setVolume(42);
          e.target.playVideo();
          mainRunning = true;
          activeMode = 'main';
          notify();
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) e.target.playVideo();
          if (e.data === YT.PlayerState.PLAYING) {
            mainRunning = true;
            activeMode = 'main';
            notify();
          }
        }
      }
    });
  }

  function startMain() {
    stopPreview();
    loadYouTubeAPI();
    if (!apiReady) {
      pendingMainStart = true;
      notify();
      return;
    }
    if (!player) createPlayer();
    else {
      if (player.unMute) player.unMute();
      if (player.setVolume) player.setVolume(42);
      if (player.playVideo) player.playVideo();
      mainRunning = true;
      activeMode = 'main';
      notify();
    }
  }

  function mute() {
    stopPreview();
    if (player && player.pauseVideo) player.pauseVideo();
    mainRunning = false;
    activeMode = null;
    pendingMainStart = false;
    notify();
  }

  function unmute() {
    startMain();
  }

  function strike() {
    if (previewRunning) hitDrum(1.5);
  }

  loadYouTubeAPI();

  return {
    primeMain: loadYouTubeAPI,
    start: startMain,
    startMain,
    startPreview,
    mute,
    unmute,
    strike,
    get running() { return previewRunning || mainRunning || pendingMainStart; },
    get mode() { return activeMode; }
  };
})();
