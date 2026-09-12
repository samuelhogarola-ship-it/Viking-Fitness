/* Viking Fitness — calorie counter data and nutrition engine */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VFCalories = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function round2(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
  }
  function validEntry(entry) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || !entry.id.trim()) return false;
    if (!validDate(entry.date) || typeof entry.name !== 'string' || !entry.name.trim() || entry.name.trim().length > 120) return false;
    if (!Number.isFinite(Number(entry.grams)) || Number(entry.grams) < 1 || Number(entry.grams) > 3000) return false;
    return ['kcal100','p100','c100','f100'].every(key => Number.isFinite(Number(entry[key])) && Number(entry[key]) >= 0 && Number(entry[key]) <= 5000);
  }
  function normalizeEntry(input) {
    if (!validEntry(input)) throw new Error('Invalid calorie entry');
    return {
      id:String(input.id), date:String(input.date), name:String(input.name).trim(), grams:round2(input.grams),
      kcal100:round2(input.kcal100), p100:round2(input.p100), c100:round2(input.c100), f100:round2(input.f100),
    };
  }
  function entryTotals(entry) {
    const factor = Number(entry.grams) / 100;
    return { kcal:round2(entry.kcal100 * factor), p:round2(entry.p100 * factor), c:round2(entry.c100 * factor), f:round2(entry.f100 * factor) };
  }
  function addTotals(total, value) {
    return { kcal:round2(total.kcal + value.kcal), p:round2(total.p + value.p), c:round2(total.c + value.c), f:round2(total.f + value.f) };
  }
  function dayTotals(entries, date) {
    return entries.filter(entry => entry.date === date).reduce((total, entry) => addTotals(total, entryTotals(entry)), { kcal:0, p:0, c:0, f:0 });
  }
  function isoOffset(date, offset) {
    const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return value.toISOString().slice(0,10);
  }
  function weekSummary(entries, endDate) {
    if (!validDate(endDate)) throw new Error('Invalid end date');
    const days = Array.from({length:7}, (_, index) => { const date=isoOffset(endDate,index-6); return {date,totals:dayTotals(entries,date)}; });
    const totals = days.reduce((sum, day) => addTotals(sum, day.totals), { kcal:0, p:0, c:0, f:0 });
    const average = Object.fromEntries(Object.entries(totals).map(([key,value]) => [key,round2(value/7)]));
    return { startDate:days[0].date, endDate, days, totals, average };
  }
  function csvCell(value) {
    const text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
  function toCsv(entries) {
    const rows = ['date,name,grams,kcal,protein,carbohydrate,fat'];
    entries.slice().sort((a,b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)).forEach(entry => {
      const total=entryTotals(entry); rows.push([entry.date,entry.name,entry.grams,total.kcal,total.p,total.c,total.f].map(csvCell).join(','));
    });
    return `${rows.join('\n')}\n`;
  }
  function validateState(value) {
    const errors=[];
    if (!value || typeof value !== 'object' || value.version !== 1 || !Array.isArray(value.entries)) return {ok:false,errors:['structure']};
    const ids=new Set();
    value.entries.forEach((entry,index) => { if(!validEntry(entry))errors.push(`entry:${index}`); if(ids.has(entry.id))errors.push(`duplicate:${entry.id}`); ids.add(entry.id); });
    return {ok:errors.length===0,errors};
  }
  return { normalizeEntry, entryTotals, dayTotals, weekSummary, toCsv, validateState };
});
