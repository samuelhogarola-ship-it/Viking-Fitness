/* Viking Fitness — workout timer UI */
(function () {
  'use strict';
  const form = document.getElementById('timerForm');
  if (!form || !window.VFTimer || !window.VFTimerAudio || !window.VFTools) return;
  const copy = window.VFPageCopy;
  const store = VFTools.safeStore('vf_viking_timer_v1');
  const mode = document.getElementById('timerMode');
  const groups = { intervals:document.getElementById('intervalFields'), rest:document.getElementById('durationFields'), emom:document.getElementById('emomFields') };
  const inputs = { prep:document.getElementById('timerPrep'), work:document.getElementById('timerWork'), rest:document.getElementById('timerRest'), rounds:document.getElementById('timerRounds'), duration:document.getElementById('timerDuration'), emomRounds:document.getElementById('timerEmomRounds') };
  const sound = document.getElementById('timerSound'), volume=document.getElementById('timerVolume'), vibration=document.getElementById('timerVibration'), wake=document.getElementById('timerWake');
  const startButton=document.getElementById('timerStart'), pauseButton=document.getElementById('timerPause'), resetButton=document.getElementById('timerReset');
  const phase=document.getElementById('timerPhase'), clock=document.getElementById('timerClock'), round=document.getElementById('timerRound'), status=document.getElementById('timerStatus');
  let state=null, frameId=null, intervalId=null, wakeLock=null;

  function config() {
    if (mode.value === 'rest') return { mode:'rest', duration:Number(inputs.duration.value) };
    if (mode.value === 'emom') return { mode:'emom', duration:Number(inputs.duration.value), rounds:Number(inputs.emomRounds.value) };
    return { mode:'intervals', prep:Number(inputs.prep.value), work:Number(inputs.work.value), rest:Number(inputs.rest.value), rounds:Number(inputs.rounds.value) };
  }
  function showMode() {
    groups.intervals.hidden = mode.value !== 'intervals';
    groups.rest.hidden = mode.value === 'intervals';
    groups.emom.hidden = mode.value !== 'emom';
    resetView();
  }
  function timeText(ms) { const total=Math.max(0,Math.ceil(ms/1000)); return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`; }
  function announce(message,error) { status.textContent=message; status.hidden=!message; status.classList.toggle('tool-status--error',Boolean(error)); }
  function preferences() { return { mode:mode.value, sound:sound.checked, volume:Number(volume.value), vibration:vibration.checked, wake:wake.checked }; }
  function savePreferences() { store.write(preferences()); }
  function render() {
    const current=state || VFTimer.create(config());
    phase.textContent=copy.phases[current.phase] || copy.phases.ready;
    clock.textContent=timeText(current.remainingMs);
    round.textContent=current.mode === 'rest' ? copy.single : copy.round.replace('{round}',current.round).replace('{rounds}',current.rounds);
    startButton.disabled=current.status==='running'||current.status==='paused'; pauseButton.disabled=!['running','paused'].includes(current.status); resetButton.disabled=current.status==='idle'; pauseButton.textContent=current.status==='paused'?copy.resume:copy.pause;
  }
  function signal(event) {
    if (!event) return;
    if (sound.checked) { if (event==='work-start') VFTimerAudio.horn(); if (event==='complete') VFTimerAudio.finish(); }
    if (vibration.checked && navigator.vibrate) navigator.vibrate(event==='complete'?[180,90,180]:120);
    if (event==='complete') { announce(copy.complete,false); stopLoops(); releaseWake(); }
    else announce(event==='work-start'?copy.workStart:copy.restStart,false);
  }
  function update() { if (!state) return; state=VFTimer.tick(state,performance.now()); signal(state.event); render(); }
  function loop() { update(); if (state&&state.status==='running') frameId=requestAnimationFrame(loop); }
  function startLoops() { stopLoops(); frameId=requestAnimationFrame(loop); intervalId=setInterval(update,250); }
  function stopLoops() { if(frameId)cancelAnimationFrame(frameId); if(intervalId)clearInterval(intervalId); frameId=null; intervalId=null; }
  async function acquireWake() { if(!wake.checked||!navigator.wakeLock)return; try{wakeLock=await navigator.wakeLock.request('screen');}catch{} }
  async function releaseWake() { if(wakeLock){try{await wakeLock.release();}catch{} wakeLock=null;} }
  function resetView(){ if(state&&state.status==='running')return; state=VFTimer.create(config()); announce('',false); render(); }

  const saved=store.read({}); if(saved.mode&&groups[saved.mode])mode.value=saved.mode; if(typeof saved.sound==='boolean')sound.checked=saved.sound; if(Number.isFinite(saved.volume))volume.value=String(saved.volume); if(typeof saved.vibration==='boolean')vibration.checked=saved.vibration; if(typeof saved.wake==='boolean')wake.checked=saved.wake;
  VFTimerAudio.setVolume(volume.value); showMode();
  form.addEventListener('submit',function(event){event.preventDefault();});
  mode.addEventListener('change',function(){showMode();savePreferences();});
  Object.values(inputs).forEach(input=>input.addEventListener('change',resetView));
  [sound,vibration,wake].forEach(input=>input.addEventListener('change',savePreferences)); volume.addEventListener('input',function(){VFTimerAudio.setVolume(volume.value);savePreferences();});
  startButton.addEventListener('click',async function(){const next=config(),validation=VFTimer.validate(next);if(!validation.ok){announce(copy.invalid,true);return;}VFTimerAudio.unlock();state=VFTimer.start(VFTimer.create(next),performance.now());signal(state.event);render();startLoops();acquireWake();savePreferences();});
  pauseButton.addEventListener('click',function(){if(!state)return;if(state.status==='running'){state=VFTimer.pause(state,performance.now());stopLoops();releaseWake();announce(copy.paused,false);}else if(state.status==='paused'){state=VFTimer.resume(state,performance.now());startLoops();acquireWake();announce(copy.resumed,false);}render();});
  resetButton.addEventListener('click',function(){stopLoops();releaseWake();state=VFTimer.reset(state||VFTimer.create(config()));announce(copy.reset,false);render();});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)update();}); window.addEventListener('pagehide',function(){stopLoops();releaseWake();});
})();
