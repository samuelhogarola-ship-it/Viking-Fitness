/* Viking Fitness — independent calorie counter UI */
(function () {
  'use strict';
  const form=document.getElementById('calorieForm');
  if(!form||!window.VFCalories||!window.VFTools)return;
  const copy=window.VFPageCopy, store=VFTools.safeStore('vf_calorie_counter_v1');
  const date=document.getElementById('calorieDate'), starter=document.getElementById('calorieStarter');
  const fields={name:document.getElementById('calorieName'),grams:document.getElementById('calorieGrams'),kcal100:document.getElementById('calorieKcal'),p100:document.getElementById('calorieProtein'),c100:document.getElementById('calorieCarbs'),f100:document.getElementById('calorieFat')};
  const list=document.getElementById('calorieEntries'), status=document.getElementById('calorieStatus'), submit=document.getElementById('calorieSubmit'), cancel=document.getElementById('calorieCancel');
  let editingId=null, persistentStatus='';

  function storageProbe(){try{const key='vf_calorie_counter_v1',raw=localStorage.getItem(key);localStorage.setItem(key,raw===null?JSON.stringify({version:1,entries:[]}):raw);if(raw===null)localStorage.removeItem(key);return true;}catch{return false;}}
  const storageOk=storageProbe();
  let state=store.read({version:1,entries:[]}); if(!VFCalories.validateState(state).ok)state={version:1,entries:[]};
  if(!storageOk)persistentStatus=copy.temporary;

  function id(){return crypto.randomUUID?crypto.randomUUID():`c-${Date.now()}-${Math.random().toString(16).slice(2)}`;}
  function today(){const now=new Date(),offset=now.getTimezoneOffset()*60000;return new Date(now.getTime()-offset).toISOString().slice(0,10);}
  function fmt(value,digits){return VFTools.formatNumber(value,copy.locale,digits);}
  function announce(message,error){status.textContent=[persistentStatus,message].filter(Boolean).join(' ');status.hidden=!status.textContent;status.classList.toggle('tool-status--error',Boolean(error));}
  function save(message){if(storageOk&&!store.write(state))persistentStatus=copy.temporary;announce(message,false);}
  function isoOffset(value,offset){const d=new Date(`${value}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
  function resetForm(){editingId=null;form.reset();starter.value='';submit.textContent=copy.add;cancel.hidden=true;}
  function fill(entry){fields.name.value=entry.name;fields.grams.value=entry.grams;fields.kcal100.value=entry.kcal100;fields.p100.value=entry.p100;fields.c100.value=entry.c100;fields.f100.value=entry.f100;}
  function entryFromForm(existingId){return VFCalories.normalizeEntry({id:existingId||id(),date:date.value,name:fields.name.value,grams:Number(fields.grams.value),kcal100:Number(fields.kcal100.value),p100:Number(fields.p100.value),c100:Number(fields.c100.value),f100:Number(fields.f100.value)});}
  function button(label,action,idValue){const b=document.createElement('button');b.type='button';b.className='btn btn--ghost';b.textContent=label;b.dataset.action=action;b.dataset.id=idValue;return b;}
  function render(){
    if(!date.value)date.value=today();
    const entries=state.entries.filter(entry=>entry.date===date.value);list.replaceChildren();
    if(!entries.length){const empty=document.createElement('p');empty.className='privacy-note';empty.textContent=copy.empty;list.appendChild(empty);}
    entries.forEach(entry=>{const total=VFCalories.entryTotals(entry),card=document.createElement('article');card.className='entry-card';const text=document.createElement('div'),actions=document.createElement('div');text.innerHTML=`<h3></h3><p></p>`;text.querySelector('h3').textContent=entry.name;text.querySelector('p').textContent=`${fmt(entry.grams,2)} g · ${fmt(total.kcal,2)} kcal · P ${fmt(total.p,2)} g · C ${fmt(total.c,2)} g · G ${fmt(total.f,2)} g`;actions.className='tool-actions';actions.append(button(copy.edit,'edit',entry.id),button(copy.duplicate,'duplicate',entry.id),button(copy.remove,'delete',entry.id));card.append(text,actions);list.appendChild(card);});
    const totals=VFCalories.dayTotals(state.entries,date.value);document.getElementById('totalKcal').textContent=fmt(totals.kcal,2);document.getElementById('totalProtein').textContent=fmt(totals.p,2);document.getElementById('totalCarbs').textContent=fmt(totals.c,2);document.getElementById('totalFat').textContent=fmt(totals.f,2);
    const week=VFCalories.weekSummary(state.entries,date.value);document.getElementById('weekRange').textContent=`${week.startDate} — ${week.endDate}`;document.getElementById('weekKcal').textContent=fmt(week.totals.kcal,2);document.getElementById('weekAverage').textContent=fmt(week.average.kcal,2);
  }

  starter.append(new Option(copy.custom,'')); copy.foods.forEach((food,index)=>starter.append(new Option(food.name,String(index))));
  date.value=today(); resetForm(); render(); announce('',false);
  starter.addEventListener('change',function(){if(starter.value==='')return;fill(Object.assign({grams:100},copy.foods[Number(starter.value)]));});
  form.addEventListener('submit',function(event){event.preventDefault();try{const entry=entryFromForm(editingId);if(editingId)state={version:1,entries:state.entries.map(item=>item.id===editingId?entry:item)};else state={version:1,entries:state.entries.concat(entry)};save(editingId?copy.updated:copy.added);resetForm();render();}catch{announce(copy.invalid,true);}});
  cancel.addEventListener('click',function(){resetForm();announce('',false);});
  list.addEventListener('click',function(event){const target=event.target.closest('[data-action]');if(!target)return;const entry=state.entries.find(item=>item.id===target.dataset.id);if(!entry)return;if(target.dataset.action==='edit'){editingId=entry.id;fill(entry);submit.textContent=copy.save;cancel.hidden=false;fields.name.focus();return;}if(target.dataset.action==='duplicate'){const duplicate=Object.assign({},entry,{id:id(),name:`${entry.name} ${copy.copySuffix}`});state={version:1,entries:state.entries.concat(duplicate)};save(copy.duplicated);render();return;}if(target.dataset.action==='delete'&&confirm(copy.confirmDelete)){state={version:1,entries:state.entries.filter(item=>item.id!==entry.id)};save(copy.deleted);render();}});
  document.getElementById('datePrev').addEventListener('click',()=>{date.value=isoOffset(date.value,-1);resetForm();render();});document.getElementById('dateNext').addEventListener('click',()=>{date.value=isoOffset(date.value,1);resetForm();render();});date.addEventListener('change',()=>{resetForm();render();});
  document.getElementById('exportCsv').addEventListener('click',()=>VFTools.downloadBlob(`viking-fitness-calories-${date.value}.csv`,'text/csv;charset=utf-8',VFCalories.toCsv(state.entries)));
  document.getElementById('exportJson').addEventListener('click',()=>VFTools.downloadBlob(`viking-fitness-calories-${date.value}.json`,'application/json',`${JSON.stringify(state,null,2)}\n`));
  document.getElementById('clearDay').addEventListener('click',function(){if(!confirm(copy.confirmDay))return;state={version:1,entries:state.entries.filter(entry=>entry.date!==date.value)};save(copy.dayCleared);render();});
  document.getElementById('clearAll').addEventListener('click',function(){if(!confirm(copy.confirmAll))return;state={version:1,entries:[]};if(storageOk)store.clear();announce(copy.allCleared,false);resetForm();render();});
})();
