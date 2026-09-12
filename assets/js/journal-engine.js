/* Viking Fitness — independent Warrior Journal data engine */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VFJournal = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function validDate(value) { if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;const d=new Date(`${value}T00:00:00Z`);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value; }
  function exerciseVolume(exercise) { return Number(exercise.sets) * Number(exercise.reps) * Number(exercise.kg); }
  function dayVolume(day) { return (day.exercises||[]).reduce((sum,exercise)=>sum+exerciseVolume(exercise),0); }
  function validExercise(exercise) {
    return exercise&&typeof exercise.id==='string'&&Boolean(exercise.id.trim())&&typeof exercise.name==='string'&&Boolean(exercise.name.trim())&&exercise.name.trim().length<=120&&Number.isInteger(Number(exercise.sets))&&Number(exercise.sets)>=1&&Number(exercise.sets)<=30&&Number.isInteger(Number(exercise.reps))&&Number(exercise.reps)>=1&&Number(exercise.reps)<=100&&Number.isFinite(Number(exercise.kg))&&Number(exercise.kg)>=0&&Number(exercise.kg)<=1000;
  }
  function validDay(day) {
    return day&&typeof day.id==='string'&&Boolean(day.id.trim())&&validDate(day.date)&&Array.isArray(day.exercises)&&day.exercises.every(validExercise)&&typeof day.meals==='string'&&day.meals.length<=5000&&(day.weight===null||(Number.isFinite(Number(day.weight))&&Number(day.weight)>=20&&Number(day.weight)<=350))&&typeof day.notes==='string'&&day.notes.length<=5000;
  }
  function validateBackup(value) {
    const errors=[];
    if(!value||typeof value!=='object'||value.version!==1||!Array.isArray(value.days))return {ok:false,errors:['structure']};
    const dayIds=new Set(),dates=new Set(),exerciseIds=new Set();
    value.days.forEach((day,index)=>{if(!validDay(day))errors.push(`day:${index}`);if(day&&dayIds.has(day.id))errors.push(`duplicate-day:${day.id}`);if(day&&dates.has(day.date))errors.push(`duplicate-date:${day.date}`);if(day){dayIds.add(day.id);dates.add(day.date);if(Array.isArray(day.exercises))day.exercises.forEach(exercise=>{if(exerciseIds.has(exercise.id))errors.push(`duplicate-exercise:${exercise.id}`);exerciseIds.add(exercise.id);});}});
    return {ok:errors.length===0,errors};
  }
  function sorted(state) { state.days.sort((a,b)=>b.date.localeCompare(a.date));return state; }
  function replace(current,incoming) { const validation=validateBackup(incoming);if(!validation.ok)throw new Error(`Invalid backup: ${validation.errors.join(', ')}`);return sorted(clone(incoming)); }
  function merge(current,incoming) {
    if(!validateBackup(current).ok||!validateBackup(incoming).ok)throw new Error('Invalid backup');
    const combined={version:1,days:clone(current.days).concat(clone(incoming.days))};const validation=validateBackup(combined);if(!validation.ok){if(validation.errors.some(error=>error.includes('duplicate')))throw new Error('Duplicate journal record');throw new Error('Invalid backup');}return sorted(combined);
  }
  function exportBackup(state) { const validation=validateBackup(state);if(!validation.ok)throw new Error('Invalid journal state');return `${JSON.stringify(sorted(clone(state)),null,2)}\n`; }
  return { exerciseVolume, dayVolume, validateBackup, merge, replace, exportBackup };
});
