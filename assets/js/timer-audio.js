/* Viking Fitness — isolated Web Audio signals for the workout timer */
(function (root) {
  'use strict';
  let context = null;
  let volume = 0.65;

  function audioContext() {
    if (!context) {
      const AudioContext = root.AudioContext || root.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }

  function unlock() { return Boolean(audioContext()); }
  function setVolume(value) { volume = Math.max(0, Math.min(1, Number(value) || 0)); }

  function horn() {
    const ctx = audioContext();
    if (!ctx || volume === 0) return false;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const compressor = ctx.createDynamicsCompressor();
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(780, now); filter.Q.setValueAtTime(3.2, now);
    master.gain.setValueAtTime(0.0001, now); master.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.38), now + 0.08); master.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    filter.connect(compressor); compressor.connect(master); master.connect(ctx.destination);
    [{type:'sawtooth',frequency:92,gain:.42},{type:'triangle',frequency:46,gain:.52},{type:'sine',frequency:138,gain:.16}].forEach(part => {
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = part.type; oscillator.frequency.setValueAtTime(part.frequency, now); oscillator.frequency.exponentialRampToValueAtTime(part.frequency * .88, now + 1.2);
      gain.gain.value = part.gain; oscillator.connect(gain); gain.connect(filter); oscillator.start(now); oscillator.stop(now + 1.4);
    });
    return true;
  }

  function finish() {
    const ctx = audioContext();
    if (!ctx || volume === 0) return false;
    const now = ctx.currentTime;
    const master = ctx.createGain(); master.gain.setValueAtTime(volume * .32, now); master.gain.exponentialRampToValueAtTime(.0001, now + .75); master.connect(ctx.destination);
    const oscillator = ctx.createOscillator(); oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(520, now); oscillator.frequency.exponentialRampToValueAtTime(150, now + .7); oscillator.connect(master); oscillator.start(now); oscillator.stop(now + .75);
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .18), ctx.sampleRate); const data = buffer.getChannelData(0);
    for (let i=0;i<data.length;i+=1) data[i]=(Math.random()*2-1)*(1-i/data.length);
    const noise=ctx.createBufferSource(); const noiseFilter=ctx.createBiquadFilter(); noise.buffer=buffer; noiseFilter.type='bandpass'; noiseFilter.frequency.value=950; noise.connect(noiseFilter); noiseFilter.connect(master); noise.start(now); noise.stop(now+.18);
    return true;
  }

  root.VFTimerAudio = { unlock, horn, finish, setVolume };
})(typeof window !== 'undefined' ? window : this);
