/* Viking Fitness — timestamp-based workout timer engine */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VFTimer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function seconds(value) { return Math.max(0, Number(value) || 0) * 1000; }

  function create(config) {
    const clean = Object.assign({}, config);
    let phase;
    let remainingMs;
    if (clean.mode === 'rest') {
      phase = 'rest';
      clean.rounds = 1;
      remainingMs = seconds(clean.duration);
    } else if (clean.mode === 'emom') {
      phase = 'work';
      clean.work = clean.duration;
      remainingMs = seconds(clean.duration);
    } else {
      phase = Number(clean.prep) > 0 ? 'prep' : 'work';
      remainingMs = seconds(phase === 'prep' ? clean.prep : clean.work);
    }
    return { mode:clean.mode, status:'idle', phase, round:1, rounds:Number(clean.rounds) || 1, remainingMs, deadlineMs:null, pausedAtMs:null, config:clean, event:null };
  }

  function start(state, now) {
    if (state.status !== 'idle') return Object.assign({}, state, { event:null });
    return Object.assign({}, state, {
      status:'running',
      deadlineMs:Number(now) + state.remainingMs,
      pausedAtMs:null,
      event:state.phase === 'work' ? 'work-start' : null,
    });
  }

  function enter(state, phase, durationMs, deadlineMs, event) {
    return Object.assign({}, state, { phase, remainingMs:durationMs, deadlineMs:deadlineMs + durationMs, event });
  }

  function complete(state) {
    return Object.assign({}, state, { status:'complete', remainingMs:0, deadlineMs:null, pausedAtMs:null, event:'complete' });
  }

  function advance(state, boundary) {
    if (state.mode === 'rest') return complete(state);
    if (state.mode === 'emom') {
      if (state.round >= state.rounds) return complete(state);
      return enter(Object.assign({}, state, { round:state.round + 1 }), 'work', seconds(state.config.duration), boundary, 'work-start');
    }
    if (state.phase === 'prep') return enter(state, 'work', seconds(state.config.work), boundary, 'work-start');
    if (state.phase === 'work') {
      if (state.round >= state.rounds) return complete(state);
      if (seconds(state.config.rest) === 0) return enter(Object.assign({}, state, { round:state.round + 1 }), 'work', seconds(state.config.work), boundary, 'work-start');
      return enter(state, 'rest', seconds(state.config.rest), boundary, 'rest-start');
    }
    return enter(Object.assign({}, state, { round:state.round + 1 }), 'work', seconds(state.config.work), boundary, 'work-start');
  }

  function tick(state, now) {
    if (state.status !== 'running') return Object.assign({}, state, { event:null });
    let next = Object.assign({}, state, { event:null });
    const time = Number(now);
    while (next.status === 'running' && time >= next.deadlineMs) {
      const boundary = next.deadlineMs;
      next = advance(next, boundary);
    }
    if (next.status === 'running') next = Object.assign({}, next, { remainingMs:Math.max(0, next.deadlineMs - time) });
    return next;
  }

  function pause(state, now) {
    const current = tick(state, now);
    if (current.status !== 'running') return current;
    return Object.assign({}, current, { status:'paused', deadlineMs:null, pausedAtMs:Number(now), event:null });
  }

  function resume(state, now) {
    if (state.status !== 'paused') return Object.assign({}, state, { event:null });
    return Object.assign({}, state, { status:'running', deadlineMs:Number(now) + state.remainingMs, pausedAtMs:null, event:null });
  }

  function reset(state) { return create(state.config); }

  function validate(config) {
    const errors = {};
    if (!['rest', 'intervals', 'emom'].includes(config && config.mode)) errors.mode = 'unsupported';
    if (config && config.mode === 'rest') {
      const duration = Number(config.duration);
      if (!Number.isInteger(duration) || duration < 1 || duration > 7200) errors.duration = 'range';
    } else if (config && config.mode === 'emom') {
      const duration = Number(config.duration);
      const rounds = Number(config.rounds);
      if (!Number.isInteger(duration) || duration < 5 || duration > 3600) errors.duration = 'range';
      if (!Number.isInteger(rounds) || rounds < 1 || rounds > 100) errors.rounds = 'range';
    } else if (config && config.mode === 'intervals') {
      const prep = Number(config.prep), work = Number(config.work), rest = Number(config.rest), rounds = Number(config.rounds);
      if (!Number.isInteger(prep) || prep < 0 || prep > 600) errors.prep = 'range';
      if (!Number.isInteger(work) || work < 1 || work > 3600) errors.work = 'range';
      if (!Number.isInteger(rest) || rest < 0 || rest > 3600) errors.rest = 'range';
      if (!Number.isInteger(rounds) || rounds < 1 || rounds > 100) errors.rounds = 'range';
    }
    return { ok:Object.keys(errors).length === 0, errors };
  }

  return { create, start, pause, resume, tick, reset, validate };
});
