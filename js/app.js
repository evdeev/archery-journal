/* Archery Journal v2.0 extracted application code */
let sessions=[
  {id:'s3',date:'2026-05-05',place:'',distance:18,shots:60,competition:false,bowId:'bow-bumblebee',arrowSetId:'arr-winning-bees',note:'Сегодня лучше получалась вторая половина тренировки. Нужно проверить стойку.',comments:{1:'Вторая стрела ушла вправо — поздний выпуск.'},seed:[[9,8,7],[7,8,8],[8,9,6],[9,7,7],['X',9,8],[8,9,9],[7,8,9],[9,9,8],[8,10,7],[9,8,8],[8,8,9],['X',9,9],[7,9,8],[8,8,8],[9,9,9],[10,8,9],[null,null,null],[null,null,null],[null,null,null],[null,null,null]]},
  {id:'s2',date:'2026-05-03',place:'Зал',distance:18,shots:30,competition:false,bowId:'bow-bumblebee',arrowSetId:'arr-winning-bees',seed:[[9,9,8],[8,8,9],[10,9,8],[7,9,9],[8,10,9],[9,8,8],[9,9,9],[10,8,9],[8,9,8],[null,null,null]]},
  {id:'s1',date:'2026-04-28',place:'',distance:10,shots:30,competition:true,bowId:'bow-bumblebee',arrowSetId:'arr-winning-bees',seed:[[10,9,9],[9,8,9],['X',10,9],[8,8,9],[9,9,8],[10,9,9],[8,9,10],[9,8,8],[10,9,8],[9,9,9]]}
];
let currentSessionId=sessions[0].id;
let session=sessions[0];
let seed=session.seed;
let keyboardVisible=false; let active=null;
let createDraft={distance:18,shots:60,competition:false,place:''};

const scoreVal=v=>v==='M'||v==null?0:(v==='X'?10:Number(v)); const isTen=v=>v==='X'||v===10; const isNine=v=>v===9;
function maxEnds(){return session.shots/3}
function findFirstEmpty(){for(let end=0;end<maxEnds();end++){const shot=seed[end]?.findIndex(v=>v===null);if(shot!==-1)return{end,shot}}return null}
function targetEndForEdit(requestedEnd){
  const requestedDone=seed[requestedEnd]?.every(v=>v!==null);
  if(requestedDone) return requestedEnd;
  const firstEmpty=findFirstEmpty();
  return firstEmpty ? firstEmpty.end : requestedEnd;
}
function firstEmptyShotInEnd(end){
  const firstEmpty=seed[end].findIndex(v=>v===null);
  return firstEmpty===-1 ? 0 : firstEmpty;
}
function targetShotForEnd(end, requestedShot){
  const firstEmpty=seed[end].findIndex(v=>v===null);
  if(firstEmpty===-1) return requestedShot;
  return seed[end][requestedShot]!==null ? requestedShot : firstEmpty;
}
function showKeyboard(){keyboardVisible=true;assistant.classList.remove('hidden')}
function hideKeyboard(){keyboardVisible=false;active=null;assistant.classList.add('hidden');render()}
function activate(end,shot){active={end,shot};showKeyboard();render()}
function ensureSeed(){const ends=maxEnds(); while(seed.length<ends) seed.push([null,null,null]); if(seed.length>ends) seed=seed.slice(0,ends); session.seed=seed}
function shotColor(s){return s==='X'||s===10||s===9?'yellow':s===8||s===7?'red':s===6||s===5?'blue':s===4||s===3?'black':s===2||s===1||s==='M'?'white':''}
function escapeAttr(value){
  return String(value||'')
    .replace(/&/g,'&amp;')
    .replace(/'/g,'&#39;')
    .replace(/"/g,'&quot;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}
function seriesActionsForEnd(endIndex){
  session.comments=session.comments||{};
  const text=(session.comments[endIndex]||'').trim();
  const isActive=active&&endIndex===active.end;
  const done=seed[endIndex]?.every(v=>v!==null);
  let html='';
  if(text||isActive){
    html+=`<div class="series-comment"><textarea class="series-comment-input" data-comment-input-end="${endIndex}" placeholder="Добавить заметку" rows="1">${escapeAttr(text)}</textarea></div>`;
  }
  if(isActive&&done&&endIndex===lastFilledEndIndex()){
    html+=`<div class="series-clear" data-clear-end="${endIndex}">Очистить серию</div>`;
  }
  return html;
}
function hasVisibleComment(endIndex){
  session.comments=session.comments||{};
  return !!((session.comments[endIndex]||'').trim()) || !!(active&&endIndex===active.end);
}
function row(endIndex){const shots=seed[endIndex]; const sum=shots.reduce((a,b)=>a+scoreVal(b),0); const done=shots.every(v=>v!==null); const hasComment=hasVisibleComment(endIndex)||((active&&endIndex===active.end)&&done); return `<div class="row ${active&&endIndex===active.end?'active':''} ${hasComment?'has-comment':''}" data-end="${endIndex}"><div class="row-label">${endIndex+1}</div><div class="arrows">${shots.map((s,i)=>`<button class="shot ${shotColor(s)} ${s==null?'empty':''} ${active&&active.shot!==null&&endIndex===active.end&&i===active.shot?'active':''}" data-end="${endIndex}" data-shot="${i}">${s??'—'}</button>`).join('')}</div><div class="score ${done?'done':''}">${sum}</div></div>${seriesActionsForEnd(endIndex)}`}
function calc(from,to){let score=0,arrows=0,tens=0,nines=0;for(let i=from;i<to;i++)seed[i].forEach(v=>{score+=scoreVal(v);if(v!==null)arrows++;if(isTen(v))tens++;if(isNine(v))nines++});return{score,arrows,max:(to-from)*30,avg:arrows?(score/arrows).toFixed(1):'0.0',tens,nines}}
function sessionTotal(s){const oldSession=session,oldSeed=seed; session=s; seed=s.seed; ensureSeed(); const c=calc(0,maxEnds()); session=oldSession; seed=oldSeed; return c}
function formatDate(d){return new Date(d+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}
function formatShortDate(d){return new Date(d+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}

function primaryBowId(){
  return (equipment.bowManualSets||[]).find(x=>x.active)?.id || equipment.bowManualSets?.[0]?.id || '';
}
function primaryArrowId(){
  return (equipment.arrowManualSets||[]).find(x=>x.active)?.id || equipment.arrowManualSets?.[0]?.id || '';
}
function bowName(id){
  return (equipment.bowManualSets||[]).find(x=>x.id===id)?.name || '—';
}
function arrowName(id){
  return (equipment.arrowManualSets||[]).find(x=>x.id===id)?.name || '—';
}
function fillEquipmentSelects(bowSelectId,arrowSelectId,currentBow,currentArrow){
  const bowSelect=document.getElementById(bowSelectId);
  const arrowSelect=document.getElementById(arrowSelectId);
  if(bowSelect){
    bowSelect.innerHTML=(equipment.bowManualSets||[]).map(x=>`<option value="${x.id}" ${x.id===currentBow?'selected':''}>${x.name}</option>`).join('');
  }
  if(arrowSelect){
    arrowSelect.innerHTML=(equipment.arrowManualSets||[]).map(x=>`<option value="${x.id}" ${x.id===currentArrow?'selected':''}>${x.name}</option>`).join('');
  }
}

function pluralSession(n){
  const mod10=n%10, mod100=n%100;
  if(mod10===1 && mod100!==11) return 'сессия';
  if(mod10>=2 && mod10<=4 && (mod100<12 || mod100>14)) return 'сессии';
  return 'сессий';
}
function filledArrowsCount(s=session){
  return (s.seed||[]).reduce((count,end)=>count+end.filter(v=>v!==null).length,0);
}
function canSetShots(nextShots,s=session){
  return filledArrowsCount(s)<=nextShots;
}

function lastFilledEndIndex(){
  let last=-1;
  for(let i=0;i<maxEnds();i++){
    if(seed[i]?.every(v=>v!==null)) last=i;
    else break;
  }
  return last;
}
function clearSeries(end){
  if(end!==lastFilledEndIndex())return;
  seed[end]=[null,null,null];
  session.seed=seed;
  session.comments=session.comments||{};
  delete session.comments[end];
  active={end,shot:0};
  keyboardVisible=true;
  assistant.classList.remove('hidden');
  render();
}


function render(){ensureSeed(); const roundsCount=session.shots===60?2:1; let html=''; for(let r=0;r<roundsCount;r++){const from=r*10,to=from+10,c=calc(from,to),ar=active&&(active.end>=from&&active.end<to); html+=`<div class="section-title">Круг ${r+1}</div><section class="group round ${ar?'active-round':''}">${Array.from({length:10},(_,i)=>row(from+i)).join('')}</section><div class="round-result ${ar?'active-round':''}"><span>Итог круга</span><span><b>${c.score} / 300</b> · ср. <b>${c.avg}</b> · 10: <b>${c.tens}</b> · 9: <b>${c.nines}</b></span></div>`} rounds.innerHTML=html; const all=calc(0,maxEnds()); totalScore.textContent=all.score; totalDenom.textContent=` / ${session.shots*10}`; avgScore.textContent=all.avg; allTens.textContent=all.tens; allNines.textContent=all.nines; subtitle.textContent=`${session.distance} м · 40 см · ${session.shots} стрел${session.competition?' · соревнование':''}${session.place?' · '+session.place:''}${session.bowId?' · '+bowName(session.bowId):''}${session.arrowSetId?' · '+arrowName(session.arrowSetId):''}`;
  const noteEl=document.getElementById('noteContent');
  if(noteEl)noteEl.textContent=session.note&&session.note.trim()
    ? session.note.trim().replace(/\s+/g,' ').slice(0,80)
    : 'Добавить';
  assistant.classList.toggle('hidden',!keyboardVisible);
  


function importSessionsFromJson(data){
  if(!Array.isArray(data.sessions))throw new Error('Некорректный формат файла');

  const importedSessions=data.sessions.map(item=>({
    id:item.id||('s'+Date.now()+Math.random().toString(36).slice(2,6)),
    date:item.date,
    place:item.place||'',
    distance:Number(item.distance||18),
    shots:Number(item.shots||60),
    competition:!!item.competition,
    bowId:item.bowId||'',
    arrowSetId:item.arrowSetId||'',
    note:item.note||'',
    comments:item.comments||{},
    seed:item.seed||[]
  }));

  sessions=[...importedSessions,...sessions];

  renderHistory();
  renderStats();

  alert('Импортировано сессий: '+importedSessions.length);
}

function importEquipmentFromJson(data){
  equipment.bowManualSets=Array.isArray(data.bowManualSets)?data.bowManualSets:[];
  equipment.arrowManualSets=Array.isArray(data.arrowManualSets)?data.arrowManualSets:[];

  renderEquipment();

  alert('Экипировка импортирована');
}

function readJsonFile(file,onLoad){
  if(!file)return;

  const reader=new FileReader();

  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      onLoad(data);
    }catch(err){
      alert('Не удалось импортировать файл');
      console.error(err);
    }
  };

  reader.readAsText(file);
}

function exportHistory(){
  const data={sessions:sessions};

  const blob=new Blob(
    [JSON.stringify(data,null,2)],
    {type:'application/json'}
  );

  const url=URL.createObjectURL(blob);

  const a=document.createElement('a');
  a.href=url;
  a.download='archery-history-export.json';

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function exportEquipment(){
  const data={
    bowManualSets:equipment.bowManualSets||[],
    arrowManualSets:equipment.arrowManualSets||[]
  };

  const blob=new Blob(
    [JSON.stringify(data,null,2)],
    {type:'application/json'}
  );

  const url=URL.createObjectURL(blob);

  const a=document.createElement('a');
  a.href=url;
  a.download='archery-equipment-export.json';

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

document.getElementById('importHistoryButton')?.addEventListener('click',()=>{
  document.getElementById('importHistoryInput')?.click();
});

document.getElementById('importEquipmentButton')?.addEventListener('click',()=>{
  document.getElementById('importEquipmentInput')?.click();
});

document.getElementById('importHistoryInput')?.addEventListener('change',e=>{
  readJsonFile(e.target.files?.[0],importSessionsFromJson);
  e.target.value='';
});

document.getElementById('importEquipmentInput')?.addEventListener('change',e=>{
  readJsonFile(e.target.files?.[0],importEquipmentFromJson);
  e.target.value='';
});

document.getElementById('exportHistoryButton')?.addEventListener('click',exportHistory);
document.getElementById('exportEquipmentButton')?.addEventListener('click',exportEquipment);

function resetAllData(){
  const confirmed=confirm('Все данные приложения будут удалены без возможности восстановления.\n\nНажмите «ОК», чтобы удалить данные, или «Отмена», чтобы отменить действие.');
  if(!confirmed)return;

  sessions=[];

  equipment.arrowManualSets=[];
  equipment.bowManualSets=[];

  currentSessionId=null;
  session=null;
  seed=[];
  active=null;
  keyboardVisible=false;

  closeEquipmentDetail();

  document.getElementById('equipmentDetailScreen')?.classList.remove('open');
  document.getElementById('createScreen')?.classList.remove('open');
  document.getElementById('settingsScreen')?.classList.remove('open');

  showRoot('history');
  renderHistory();
  renderStats();
  renderEquipment();
}

document.getElementById('resetAppButton')?.addEventListener('click',resetAllData);


renderHistory(); renderStats(); renderEquipment(); autosizeAllSeriesComments()}
function moveNext(){if(!active||active.shot===null)return; if(active.shot<2){active.shot+=1;return} const nextEmpty=findFirstEmpty(); active=nextEmpty??null; if(!active)keyboardVisible=false}

function showRoot(tab='history'){hideKeyboardSilent(); document.body.classList.remove('session-mode','history-tab','stats-tab','equipment-tab','settings-tab'); document.body.classList.add('root-mode',tab+'-tab'); document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); const screenId=tab==='stats'?'statsScreen':tab==='equipment'?'equipmentScreen':tab==='settings'?'rootSettingsScreen':'historyScreen'; document.getElementById(screenId).classList.add('active'); document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab)); renderHistory(); renderStats(); renderEquipment(); autosizeAllSeriesComments()}
function openSession(id){const found=sessions.find(s=>s.id===id); if(!found)return; currentSessionId=id; session=found; seed=session.seed; active=findFirstEmpty(); keyboardVisible=!!active; document.body.classList.add('session-mode'); document.body.classList.remove('root-mode'); document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); sessionScreen.classList.add('active'); render()}
function hideKeyboardSilent(){keyboardVisible=false;active=null;assistant.classList.add('hidden')}

let editingSeriesCommentEnd=null;
function openSeriesCommentScreen(end){
  editingSeriesCommentEnd=end;
  session.comments=session.comments||{};
  const screen=document.getElementById('seriesCommentScreen');
  const input=document.getElementById('seriesCommentInput');
  const title=document.getElementById('seriesCommentTitle');
  if(!screen||!input)return;
  if(title)title.textContent='Серия '+(end+1);
  input.value=session.comments[end]||'';
  screen.classList.add('open');
  hideKeyboardSilent();
  setTimeout(()=>input.focus(),260);
}
function closeSeriesCommentScreen(){
  const screen=document.getElementById('seriesCommentScreen');
  if(screen)screen.classList.remove('open');
  editingSeriesCommentEnd=null;
}
function saveSeriesCommentValue(){
  if(editingSeriesCommentEnd===null)return closeSeriesCommentScreen();
  session.comments=session.comments||{};
  const input=document.getElementById('seriesCommentInput');
  const text=(input?.value||'').trim();
  if(text)session.comments[editingSeriesCommentEnd]=text;
  else delete session.comments[editingSeriesCommentEnd];
  closeSeriesCommentScreen();
  render();
}
function autosizeSeriesCommentInput(input){
  if(!input)return;
  input.style.height='auto';
  input.style.height=input.scrollHeight+'px';
}
function autosizeAllSeriesComments(){
  document.querySelectorAll('.series-comment-input').forEach(autosizeSeriesCommentInput);
}



function formatMonth(d){const text=new Date(d+'T12:00:00').toLocaleDateString('ru-RU',{month:'long',year:'numeric'});return text.charAt(0).toUpperCase()+text.slice(1)}
function renderHistory(){
  if(!historyList)return;
  sessions.sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  const groups={};
  sessions.forEach(s=>{const key=s.date.slice(0,7); if(!groups[key]) groups[key]=[]; groups[key].push(s)});
  const competitionIcon='<span class="competition-badge" title="Соревнование"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 11.1a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Z"></path><path d="M14.2 21H2.8a1.8 1.8 0 0 1-1.7-2.3 8.6 8.6 0 0 1 16.8 0 1.8 1.8 0 0 1-1.7 2.3h-2Z"></path><path d="M17.2 10.7a3.4 3.4 0 1 0-.1-6.8 5.6 5.6 0 0 1 .1 6.8Z" opacity=".82"></path><path d="M18.9 20.9h2.3a1.7 1.7 0 0 0 1.6-2.2 7.1 7.1 0 0 0-6.1-5.2 10 10 0 0 1 2.2 7.4Z" opacity=".82"></path></svg></span>';
  historyList.innerHTML=Object.keys(groups).sort().reverse().map(key=>{
    const monthSessions=groups[key];
    let monthScore=0, monthArrows=0;
    const items=monthSessions.map(s=>{
      const c=sessionTotal(s);
      monthScore+=c.score;
      monthArrows+=c.arrows;
      return `<div class="history-item" data-session-id="${s.id}">
        <div>
          <div class="history-main"><span>${formatShortDate(s.date)} · ${s.distance} м</span>${s.competition?competitionIcon:''}</div>
          <div class="history-meta"><span>Средний: ${c.avg}</span></div>
        </div>
        <div style="display:flex;align-items:center"><div class="history-score">${c.score}<span class="max">/${s.shots*10}</span></div><div class="chevron">›</div></div>
      </div>`
    }).join('');
    const monthAvg=monthArrows?(monthScore/monthArrows).toFixed(1):'0.0';
    return `<div class="history-month">
      <div class="month-title">${formatMonth(monthSessions[0].date)}</div>
      <section class="group">${items}</section>
      <div class="month-result"><span>Итог месяца</span><span><b>${monthSessions.length}</b> ${pluralSession(monthSessions.length)} · ср. <b>${monthAvg}</b></span></div>
    </div>`
  }).join('')
}


let statsPeriod='week';
function dateDaysAgo(days){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-days);return d}
function sessionsForStats(){
  const days=statsPeriod==='week'?7:statsPeriod==='month'?31:statsPeriod==='quarter'?92:366;
  const min=dateDaysAgo(days);
  return sessions.filter(s=>new Date(s.date+'T12:00:00')>=min).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
function sessionStats(s){
  const oldSession=session, oldSeed=seed; session=s; seed=s.seed; ensureSeed();
  const total=calc(0,maxEnds());
  const endSums=s.seed.slice(0,s.shots/3).map(end=>end.reduce((a,b)=>a+scoreVal(b),0));
  const doneEnds=s.seed.slice(0,s.shots/3).filter(end=>end.every(v=>v!==null));
  const first=calc(0,Math.min(10,maxEnds()));
  const second=maxEnds()>10?calc(10,Math.min(20,maxEnds())):{score:0,arrows:0,avg:'0.0',tens:0,nines:0};
  session=oldSession; seed=oldSeed;
  return {total,endSums,doneEnds,first,second,avg:+total.avg};
}
function movingAverage(values,windowSize=3){return values.map((_,i)=>{const from=Math.max(0,i-windowSize+1);const part=values.slice(from,i+1);return part.reduce((a,b)=>a+b,0)/part.length})}
function pathFromPoints(points){
  if(!points.length)return '';
  if(points.length===1)return `M ${points[0].x} ${points[0].y}`;
  let d=`M ${points[0].x} ${points[0].y}`;
  for(let i=1;i<points.length;i++){
    const p0=points[i-1],p1=points[i];
    const mx=(p0.x+p1.x)/2;
    d+=` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}
function startOfWeek(date){
  const d=new Date(date); d.setHours(12,0,0,0);
  const day=d.getDay()||7;
  d.setDate(d.getDate()-day+1);
  return d;
}
function monthKey(date){return date.toISOString().slice(0,7)}
function shortMonthName(date){return date.toLocaleDateString('ru-RU',{month:'short'}).replace('.', '')}
function formatAxisDate(dateString, includeYear=false){
  const d=new Date(dateString+'T12:00:00');
  return includeYear
    ? d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit'})
    : d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}).replace('.', '');
}
function formatWeekRangeLabel(startDate){
  const end=new Date(startDate); end.setDate(end.getDate()+6);
  const sameMonth=startDate.getMonth()===end.getMonth();
  if(sameMonth)return `${startDate.getDate()}–${end.getDate()} ${shortMonthName(end)}`;
  return `${startDate.getDate()} ${shortMonthName(startDate)}–${end.getDate()} ${shortMonthName(end)}`;
}
function buildStatsPoints(items){
  if(statsPeriod==='quarter'){
    const groups={};
    items.forEach(it=>{
      const d=startOfWeek(new Date(it.session.date+'T12:00:00'));
      const key=d.toISOString().slice(0,10);
      if(!groups[key])groups[key]={label:formatWeekRangeLabel(d),score:0,arrows:0,count:0,items:[]};
      groups[key].score+=it.stats.total.score;
      groups[key].arrows+=it.stats.total.arrows;
      groups[key].count+=1;
      groups[key].items.push(it);
    });
    return Object.keys(groups).sort().map(key=>({key,label:groups[key].label,avg:groups[key].arrows?groups[key].score/groups[key].arrows:0,count:groups[key].count,items:groups[key].items,kind:'week'}));
  }
  if(statsPeriod==='year'){
    const groups={};
    items.forEach(it=>{
      const d=new Date(it.session.date+'T12:00:00');
      const key=monthKey(d);
      if(!groups[key])groups[key]={label:shortMonthName(d),score:0,arrows:0,count:0,items:[]};
      groups[key].score+=it.stats.total.score;
      groups[key].arrows+=it.stats.total.arrows;
      groups[key].count+=1;
      groups[key].items.push(it);
    });
    return Object.keys(groups).sort().map(key=>({key,label:groups[key].label,avg:groups[key].arrows?groups[key].score/groups[key].arrows:0,count:groups[key].count,items:groups[key].items,kind:'month'}));
  }
  const hasSeveralYears=items.some((it,_,arr)=>it.session.date.slice(0,4)!==arr[0].session.date.slice(0,4));
  return items.map(it=>({key:it.session.id,label:formatAxisDate(it.session.date,hasSeveralYears),avg:it.stats.avg,count:1,items:[it],kind:'session'}));
}
function labelEvery(points){
  if(statsPeriod==='year')return 1;
  if(statsPeriod==='quarter')return points.length>14?2:1;
  if(points.length<=12)return 1;
  if(points.length<=24)return 2;
  return Math.ceil(points.length/12);
}
function renderAverageChart(items){
  const pointsData=buildStatsPoints(items);
  const values=pointsData.map(i=>i.avg);
  const w=398,h=226,padL=30,padR=12,padT=16,padB=48;
  const min=Math.max(0,Math.floor(Math.min(...values)-.5));
  const max=Math.min(10,Math.ceil(Math.max(...values)+.5));
  const span=Math.max(1,max-min);
  const innerW=w-padL-padR,innerH=h-padT-padB;
  const barGap=pointsData.length>20?3:6;
  const barW=Math.max(4,(innerW-(pointsData.length-1)*barGap)/Math.max(1,pointsData.length));
  const y=v=>padT+innerH-((v-min)/span)*innerH;
  const trend=movingAverage(values,Math.min(5,Math.max(2,pointsData.length))).map((v,i)=>({x:padL+i*(barW+barGap)+barW/2,y:y(v)}));
  const every=labelEvery(pointsData);
  const bars=pointsData.map((it,i)=>{
    const x=padL+i*(barW+barGap), cx=x+barW/2, top=y(it.avg), bh=padT+innerH-top;
    const showLabel=i%every===0 || i===pointsData.length-1;
    const valueTitle=it.count>1?`${it.avg.toFixed(1)} · ${it.count} сесс.`:it.avg.toFixed(1);
    return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2,bh).toFixed(1)}" rx="${Math.min(5,barW/2).toFixed(1)}" fill="var(--blue)" opacity=".72"><title>${valueTitle}</title></rect>${showLabel?`<text x="${cx.toFixed(1)}" y="205" text-anchor="middle">${it.label}</text>`:''}`;
  }).join('');
  const grid=[min,(min+max)/2,max].map(v=>`<line x1="${padL}" x2="${w-padR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1" opacity=".75"></line><text x="3" y="${(y(v)+4).toFixed(1)}">${v.toFixed(v%1?1:0)}</text>`).join('');
  const trendCircles=trend.map((p,i)=>pointsData.length>18?'':`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.2" fill="var(--accent)"></circle>`).join('');
  const valueLabels=pointsData.map((it,i)=>{
    if(pointsData.length>14)return '';
    const x=padL+i*(barW+barGap)+barW/2;
    return `<text x="${x.toFixed(1)}" y="${(y(it.avg)-6).toFixed(1)}" text-anchor="middle">${it.avg.toFixed(1)}</text>`;
  }).join('');
  return `<svg class="stats-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Средний бал по тренировкам">${grid}${bars}${valueLabels}<path d="${pathFromPoints(trend)}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"></path>${trendCircles}</svg>`;
}
function renderStabilitySpark(items){
  const vals=items.map(it=>{
    const sums=it.stats.endSums.filter((_,i)=>it.session.seed[i]?.every(v=>v!==null));
    if(!sums.length)return 0;
    return Math.max(...sums)-Math.min(...sums);
  });
  const max=Math.max(1,...vals);
  return `<div class="spark-bars">${vals.map(v=>`<div class="spark-bar" style="height:${Math.max(8,(v/max)*74)}px;opacity:${.35+(v/max)*.5}"></div>`).join('')}</div>`;
}
function renderStats(){
  const root=document.getElementById('statsContent'); if(!root)return;
  document.querySelectorAll('#statsPeriodSeg button').forEach(b=>b.classList.toggle('active',b.dataset.period===statsPeriod));
  const raw=sessionsForStats();
  const items=raw.map(s=>({session:s,stats:sessionStats(s)})).filter(i=>i.stats.total.arrows>0);
  if(!items.length){root.innerHTML=`<section class="group"><div class="stats-empty">За выбранный период пока нет заполненных тренировок.</div></section>`;return}
  const chartPoints=buildStatsPoints(items);
  const totalScore=items.reduce((a,i)=>a+i.stats.total.score,0);
  const totalArrows=items.reduce((a,i)=>a+i.stats.total.arrows,0);
  const avg=totalArrows?totalScore/totalArrows:0;
  const firstAvg=chartPoints[0].avg, lastAvg=chartPoints[chartPoints.length-1].avg;
  const delta=lastAvg-firstAvg;
  const best=items.reduce((a,i)=>i.stats.avg>a.stats.avg?i:a,items[0]);
  const tens=items.reduce((a,i)=>a+i.stats.total.tens,0);
  const nines=items.reduce((a,i)=>a+i.stats.total.nines,0);
  const stabilityVals=items.map(it=>{const sums=it.stats.endSums.filter((_,i)=>it.session.seed[i]?.every(v=>v!==null));return sums.length?Math.max(...sums)-Math.min(...sums):0});
  const stabilityAvg=stabilityVals.reduce((a,b)=>a+b,0)/Math.max(1,stabilityVals.length);
  const sixty=items.filter(i=>i.session.shots===60&&i.stats.second.arrows>0);
  const firstHalf=sixty.length?sixty.reduce((a,i)=>a+(+i.stats.first.avg),0)/sixty.length:null;
  const secondHalf=sixty.length?sixty.reduce((a,i)=>a+(+i.stats.second.avg),0)/sixty.length:null;
  const comps=items.filter(i=>i.session.competition), trains=items.filter(i=>!i.session.competition);
  const avgOf=arr=>arr.length?arr.reduce((a,i)=>a+i.stats.total.score,0)/arr.reduce((a,i)=>a+i.stats.total.arrows,0):null;
  const compAvg=avgOf(comps), trainAvg=avgOf(trains);
  const chartMode=statsPeriod==='quarter'?'по неделям':statsPeriod==='year'?'по месяцам':'по сессиям';
  root.innerHTML=`
    <section class="stats-card">
      <div class="stats-card-title">Средний результат · ${chartMode}</div>
      <div class="stats-hero"><div><div class="stats-hero-value">${avg.toFixed(1)}</div><div class="mini-note">${items.length} ${pluralSession(items.length)} · ${totalArrows} стрел</div></div><div class="stats-hero-sub">Тренд<br><b style="color:var(--text);font-size:18px">${delta>=0?'+':''}${delta.toFixed(1)}</b></div></div>
      ${renderAverageChart(items)}
    </section>
    <div class="stats-grid">
      <section class="mini-card"><div class="mini-label">Лучшая сессия</div><div class="mini-value">${best.stats.avg.toFixed(1)}</div><div class="mini-note">${formatShortDate(best.session.date)} · ${best.stats.total.score}/${best.session.shots*10}</div></section>
      <section class="mini-card"><div class="mini-label">X / 10 / 9</div><div class="mini-value">${tens} / ${nines}</div><div class="mini-note">десятки и девятки за период</div></section>
    </div>
    <section class="stats-card">
      <div class="stats-card-title">Стабильность серий</div>
      <div class="stats-hero"><div><div class="stats-hero-value">${stabilityAvg.toFixed(1)}</div><div class="mini-note">средний разброс между лучшей и худшей серией</div></div></div>
      ${renderStabilitySpark(items)}
    </section>
    <section class="stats-card">
      <div class="stats-card-title">Дополнительный анализ</div>
      ${sixty.length?`<div class="stats-list-row"><div><div class="stats-list-main">Первая vs вторая половина</div><div class="stats-list-sub">показывает усталость или разогрев</div></div><div class="stats-list-value">${firstHalf.toFixed(1)} → ${secondHalf.toFixed(1)}</div></div>`:''}
      ${(compAvg!==null||trainAvg!==null)?`<div class="stats-list-row"><div><div class="stats-list-main">Тренировки / соревнования</div><div class="stats-list-sub">сравнение среднего балла</div></div><div class="stats-list-value">${trainAvg!==null?trainAvg.toFixed(1):'—'} / ${compAvg!==null?compAvg.toFixed(1):'—'}</div></div>`:''}
      <div class="stats-list-row"><div><div class="stats-list-main">Лучший результат</div><div class="stats-list-sub">${formatShortDate(best.session.date)} · ${best.session.distance} м</div></div><div class="stats-list-value">${best.stats.total.score}/${best.session.shots*10}</div></div>
    </section>`;
}



const equipment={
  bowKits:[{id:'kit1',name:'Bumblebee',status:'active',class:'Barebow',length:'70″',riserId:'riser1',limbsId:'limbs1',stringId:'string1',plungerId:'plunger1',restId:'rest1',slingId:'sling1',weightIds:['w1','w2','w3'],arrowSetId:'arrows1',settings:{braceHeight:'235 мм',nockingPoint:'+8 мм',tillerTop:'—',tillerBottom:'—',centerShot:'—',plungerSpring:'soft',plungerClicks:'0 от минимума'}}],
  arrowSets:[{id:'arrows1',name:'Winning Bees',shaftId:'shaft1',insertId:'insert1',pointId:'point1',pinId:'pin1',nockId:'nock1',fletchingId:'fletching1',details:'Victory V-Force 600 · 31″ · 125 gr'}],
  risers:[{id:'riser1',name:'WIAWIS Meta LX',brand:'WIAWIS',model:'Meta LX',details:'25″ · 1260 г'}],
  limbs:[{id:'limbs1',name:'Akusta Obsidian',brand:'Akusta',model:'Obsidian',details:'34# · фактически 36.5# · 470 г'}],
  strings:[{id:'string1',name:'BCY 8125',brand:'BCY',model:'8125',details:'Flo. Yellow'}],
  plungers:[{id:'plunger1',name:'Avalon Tec MAXX Micro Click',brand:'Avalon',model:'Tec MAXX Micro Click',details:'25 г · soft · 0 кликов'}],
  rests:[{id:'rest1',name:'Zniper Arrow Rest RFD',brand:'Zniper',model:'Arrow Rest RFD',details:'53 г'}],
  slings:[{id:'sling1',name:'ACCMOS wrist sling',brand:'ACCMOS',model:'wrist sling',details:'77 г'}],
  weights:[{id:'w1',name:'TenYards front middle',details:'riser weight · 326 г'},{id:'w2',name:'TenYards front lower',details:'riser weight · 553 г'},{id:'w3',name:'ACCMOS back middle',details:'planned damper'}],
  shafts:[{id:'shaft1',name:'Victory V-Force',details:'spine 600 · 31″ · ID 0.245 · OD 0.287'}],
  inserts:[{id:'insert1',name:'Victory VFORCE RPS',details:'22 gr'}],
  points:[{id:'point1',name:'Saunders Field Points',details:'125 gr'}],
  pins:[{id:'pin1',name:'Victory VFORCE',details:'11 gr'}],
  nocks:[{id:'nock1',name:'Easton Pin Nocks Large Groove',details:'pin nock'}],
  fletchings:[{id:'fletching1',name:'Feather Shield',details:'3 × 4″ · feather · shield'}]
};
const bowComponentTypes=['risers','limbs','strings','plungers','rests','slings','weights'];
const arrowComponentTypes=['shafts','inserts','points','pins','nocks','fletchings'];
const equipmentTitles={
  bowKits:'Комплекты лука',arrowSets:'Комплекты стрел',
  risers:'Райзеры',limbs:'Плечи',strings:'Тетивы',plungers:'Плунжеры',rests:'Полочки',slings:'Слинги',weights:'Стабилизаторы / грузы',
  shafts:'Шафты',inserts:'Инсерты',points:'Поинты',pins:'Пины',nocks:'Ноки',fletchings:'Оперение'
};
const bowKitFieldTypes={riserId:'risers',limbsId:'limbs',stringId:'strings',plungerId:'plungers',restId:'rests',slingId:'slings',arrowSetId:'arrowSets'};
const bowKitFieldLabels={riserId:'Райзер',limbsId:'Плечи',stringId:'Тетива',plungerId:'Плунжер',restId:'Полочка',slingId:'Слинг',arrowSetId:'Комплект стрел'};
const arrowSetFieldTypes={shaftId:'shafts',insertId:'inserts',pointId:'points',pinId:'pins',nockId:'nocks',fletchingId:'fletchings'};
const arrowSetFieldLabels={shaftId:'Шафт',insertId:'Инсерт',pointId:'Поинт',pinId:'Пин',nockId:'Нок',fletchingId:'Оперение'};
let equipmentMode={kind:'home'};
let equipmentReturnAction='home';
function escapeHtml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function uid(prefix){return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function eqFind(type,id){return (equipment[type]||[]).find(x=>x.id===id)||{};}
function eqName(type,id){return eqFind(type,id).name||'Не выбрано';}
function equipmentRow(title,subtitle,value,action){return `<div class="equipment-row" ${action?`data-eq-action="${action}"`:''}><div><div class="equipment-row-main">${escapeHtml(title)}</div>${subtitle?`<div class="equipment-row-sub">${escapeHtml(subtitle)}</div>`:''}</div><div class="equipment-row-value">${escapeHtml(value||'')}<span class="equipment-chev">›</span></div></div>`}
function valueRow(label,value,action){return `<div class="value-row" ${action?`data-eq-action="${action}"`:''}><div class="value-label">${escapeHtml(label)}</div><div class="value-text">${escapeHtml(value||'—')}</div></div>`}
function activeBowKit(){return equipment.bowKits.find(k=>k.status==='active')||equipment.bowKits[0];}
function arrowSetSummary(arrowSet){if(!arrowSet)return 'Не выбрано';return `${eqName('shafts',arrowSet.shaftId)} · ${eqName('points',arrowSet.pointId)} · ${eqName('nocks',arrowSet.nockId)}`;}
function currentEqTitle(){const b=document.getElementById('equipmentEditBtn');return b}
function setEquipmentNav(title,buttonText='',buttonAction=''){
  const nav=document.getElementById('equipmentDetailNavTitle'); const btn=document.getElementById('equipmentEditBtn');
  if(nav)nav.textContent=title;
  if(btn){btn.textContent=buttonText;btn.dataset.eqAction=buttonAction;btn.style.display=buttonText?'block':'none'}
}
function renderEquipment(){
  const root=document.getElementById('equipmentContent'); if(!root)return;
  const kit=activeBowKit(); const arrows=eqFind('arrowSets',kit.arrowSetId);
  root.innerHTML=`
    <section class="equipment-hero" data-eq-action="bowKit:${kit.id}">
      <div class="equipment-kicker">Активный сетап</div>
      <div class="equipment-title">${escapeHtml(kit.name)}</div>
      <div class="equipment-sub">${escapeHtml(kit.class)} · ${escapeHtml(kit.length)}<br>Стрелы: ${escapeHtml(eqName('arrowSets',kit.arrowSetId))}</div>
      <div class="equipment-pill-row"><span class="equipment-pill">${escapeHtml(eqName('risers',kit.riserId))}</span><span class="equipment-pill">${escapeHtml(eqName('limbs',kit.limbsId))}</span><span class="equipment-pill">База ${escapeHtml(kit.settings.braceHeight)}</span></div>
    </section>
    <div class="section-title">Комплекты</div><section class="group">
      ${equipmentRow('Комплекты лука',`${equipment.bowKits.length} · активный: ${kit.name}`,'','group:bowKits')}
      ${equipmentRow('Комплекты стрел',`${equipment.arrowSets.length} · выбран: ${arrows.name}`,'','group:arrowSets')}
    </section>
    <div class="section-title">Библиотека</div><section class="group">
      ${equipmentRow('Компоненты лука','Райзеры, плечи, тетивы, плунжеры, полочки','','group:bowComponents')}
      ${equipmentRow('Компоненты стрел','Шафты, инсерты, поинты, пины, ноки, оперение','','group:arrowComponents')}
    </section>`;
}
function openEquipmentDetail(action){equipmentReturnAction=action||'home'; renderEquipmentDetail(action); document.getElementById('equipmentDetailScreen')?.classList.add('open')}
function renderEquipmentDetail(action){
  const root=document.getElementById('equipmentDetailContent'); if(!root)return;
  const [kind,...rest]=String(action||'').split(':'); const id=rest[0];
  equipmentMode={kind,id,action};
  if(kind==='bowKit')return renderBowKitView(id);
  if(kind==='arrowSet')return renderArrowSetView(id);
  if(kind==='editBowKit')return renderBowKitEdit(id);
  if(kind==='editArrowSet')return renderArrowSetEdit(id);
  if(kind==='newBowKit')return renderBowKitEdit('new');
  if(kind==='newArrowSet')return renderArrowSetEdit('new');
  if(kind==='select')return renderSelectList(rest[0],rest[1],rest[2],rest[3]);
  if(kind==='group')return renderEquipmentGroup(id);
  if(kind==='list')return renderComponentList(id);
  if(kind==='component')return renderComponentEdit(rest[0],rest[1]);
  if(kind==='newComponent')return renderComponentEdit(rest[0],'new');
  renderEquipmentGroup('bowKits');
}
function renderBowKitView(id){
  const root=document.getElementById('equipmentDetailContent'); const kit=equipment.bowKits.find(k=>k.id===id)||activeBowKit();
  setEquipmentNav('Комплект лука','Править',`editBowKit:${kit.id}`);
  const weights=(kit.weightIds||[]).map(wid=>eqName('weights',wid)).join(', ')||'Не выбрано';
  root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">${escapeHtml(kit.name)}</div><div class="equipment-detail-sub">${escapeHtml(kit.class)} · ${escapeHtml(kit.length)} · ${kit.status==='active'?'активный комплект':'комплект'}</div></div>
    <div class="section-title">Лук</div><section class="group">
      ${valueRow('Райзер',eqName('risers',kit.riserId))}${valueRow('Плечи',eqName('limbs',kit.limbsId))}${valueRow('Тетива',eqName('strings',kit.stringId))}${valueRow('Плунжер',eqName('plungers',kit.plungerId))}${valueRow('Полочка',eqName('rests',kit.restId))}${valueRow('Слинг',eqName('slings',kit.slingId))}${valueRow('Стабилизаторы / грузы',weights)}
    </section>
    <div class="section-title">Стрелы</div><section class="group">${equipmentRow('Комплект стрел',arrowSetSummary(eqFind('arrowSets',kit.arrowSetId)),eqName('arrowSets',kit.arrowSetId),'arrowSet:'+kit.arrowSetId)}</section>
    <div class="section-title">Настройки</div><section class="group">${valueRow('База',kit.settings.braceHeight)}${valueRow('Нок-пойнт',kit.settings.nockingPoint)}${valueRow('Тиллер верхний',kit.settings.tillerTop)}${valueRow('Тиллер нижний',kit.settings.tillerBottom)}${valueRow('Центершот',kit.settings.centerShot)}${valueRow('Пружина плунжера',kit.settings.plungerSpring)}${valueRow('Клики плунжера',kit.settings.plungerClicks)}</section>`;
}
function renderArrowSetView(id){
  const root=document.getElementById('equipmentDetailContent'); const set=equipment.arrowSets.find(a=>a.id===id)||equipment.arrowSets[0];
  setEquipmentNav('Комплект стрел','Править',`editArrowSet:${set.id}`);
  root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">${escapeHtml(set.name)}</div><div class="equipment-detail-sub">Отдельный комплект стрел</div></div>
    <div class="section-title">Основа</div><section class="group">${equipmentRow('Шафт','',eqName('shafts',set.shaftId),'component:shafts:'+set.shaftId)}</section>
    <div class="section-title">Передняя часть</div><section class="group">${equipmentRow('Инсерт','',eqName('inserts',set.insertId),'component:inserts:'+set.insertId)}${equipmentRow('Поинт','',eqName('points',set.pointId),'component:points:'+set.pointId)}</section>
    <div class="section-title">Задняя часть</div><section class="group">${equipmentRow('Пин','',eqName('pins',set.pinId),'component:pins:'+set.pinId)}${equipmentRow('Нок','',eqName('nocks',set.nockId),'component:nocks:'+set.nockId)}${equipmentRow('Оперение','',eqName('fletchings',set.fletchingId),'component:fletchings:'+set.fletchingId)}</section>`;
}
function inputRow(label,name,value,placeholder=''){
  return `<label class="setting-row"><span class="setting-label">${escapeHtml(label)}</span><input class="equipment-form-input" name="${name}" value="${escapeHtml(value||'')}" placeholder="${escapeHtml(placeholder)}"></label>`
}
function selectRow(label,type,current,field,ownerKind,ownerId){return equipmentRow(label,'',eqName(type,current),`select:${type}:${field}:${ownerKind}:${ownerId}`)}
function renderBowKitEdit(id){
  const root=document.getElementById('equipmentDetailContent'); const base=id==='new'?{id:'new',name:'Новый комплект',status:'draft',class:'Barebow',length:'70″',settings:{braceHeight:'',nockingPoint:'',tillerTop:'',tillerBottom:'',centerShot:'',plungerSpring:'',plungerClicks:''}}:equipment.bowKits.find(k=>k.id===id)||activeBowKit();
  setEquipmentNav(id==='new'?'Новый комплект':'Правка','Готово',`saveBowKit:${id}`);
  root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">${id==='new'?'Новый комплект':escapeHtml(base.name)}</div><div class="equipment-detail-sub">Можно менять поля и выбирать готовые сущности</div></div>
    <form id="equipmentEditForm">
    <div class="section-title">Основное</div><section class="group">${inputRow('Название','name',base.name)}${inputRow('Класс','class',base.class)}${inputRow('Длина','length',base.length)}<div class="setting-row"><span class="setting-label">Активный</span><div class="switch ${base.status==='active'?'on':''}" data-eq-action="toggleActive" role="switch"></div></div></section>
    <div class="section-title">Лук</div><section class="group">${selectRow('Райзер','risers',base.riserId,'riserId','bowKit',base.id)}${selectRow('Плечи','limbs',base.limbsId,'limbsId','bowKit',base.id)}${selectRow('Тетива','strings',base.stringId,'stringId','bowKit',base.id)}${selectRow('Плунжер','plungers',base.plungerId,'plungerId','bowKit',base.id)}${selectRow('Полочка','rests',base.restId,'restId','bowKit',base.id)}${selectRow('Слинг','slings',base.slingId,'slingId','bowKit',base.id)}</section>
    <div class="section-title">Стрелы</div><section class="group">${selectRow('Комплект стрел','arrowSets',base.arrowSetId,'arrowSetId','bowKit',base.id)}</section>
    <div class="section-title">Настройки</div><section class="group">${inputRow('База','braceHeight',base.settings.braceHeight)}${inputRow('Нок-пойнт','nockingPoint',base.settings.nockingPoint)}${inputRow('Тиллер верхний','tillerTop',base.settings.tillerTop)}${inputRow('Тиллер нижний','tillerBottom',base.settings.tillerBottom)}${inputRow('Центершот','centerShot',base.settings.centerShot)}${inputRow('Пружина','plungerSpring',base.settings.plungerSpring)}${inputRow('Клики','plungerClicks',base.settings.plungerClicks)}</section>
    ${id!=='new'?`<div class="section-title">Опасная зона</div><section class="group"><div class="equipment-row" data-eq-action="deleteBowKit:${base.id}"><div><div class="equipment-row-main danger-text">Удалить комплект</div></div><div class="equipment-row-value"></div></div></section>`:''}
    </form>`;
}
function renderArrowSetEdit(id){
  const root=document.getElementById('equipmentDetailContent'); const base=id==='new'?{id:'new',name:'Новый комплект стрел'}:equipment.arrowSets.find(a=>a.id===id)||equipment.arrowSets[0];
  setEquipmentNav(id==='new'?'Новые стрелы':'Правка','Готово',`saveArrowSet:${id}`);
  root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">${id==='new'?'Новый комплект стрел':escapeHtml(base.name)}</div><div class="equipment-detail-sub">Стрела как отдельная сборка компонентов</div></div>
    <form id="equipmentEditForm">
    <div class="section-title">Основное</div><section class="group">${inputRow('Название','name',base.name)}${inputRow('Описание','details',base.details)}</section>
    <div class="section-title">Основа</div><section class="group">${selectRow('Шафт','shafts',base.shaftId,'shaftId','arrowSet',base.id)}</section>
    <div class="section-title">Передняя часть</div><section class="group">${selectRow('Инсерт','inserts',base.insertId,'insertId','arrowSet',base.id)}${selectRow('Поинт','points',base.pointId,'pointId','arrowSet',base.id)}</section>
    <div class="section-title">Задняя часть</div><section class="group">${selectRow('Пин','pins',base.pinId,'pinId','arrowSet',base.id)}${selectRow('Нок','nocks',base.nockId,'nockId','arrowSet',base.id)}${selectRow('Оперение','fletchings',base.fletchingId,'fletchingId','arrowSet',base.id)}</section>
    ${id!=='new'?`<div class="section-title">Опасная зона</div><section class="group"><div class="equipment-row" data-eq-action="deleteArrowSet:${base.id}"><div><div class="equipment-row-main danger-text">Удалить комплект стрел</div></div><div class="equipment-row-value"></div></div></section>`:''}</form>`;
}
function formValue(name){return document.querySelector(`#equipmentEditForm [name="${name}"]`)?.value.trim()||''}
function saveBowKit(id){
  let kit=id==='new'?{id:uid('kit'),settings:{}}:equipment.bowKits.find(k=>k.id===id); if(!kit)return;
  Object.assign(kit,{name:formValue('name')||'Без названия',class:formValue('class')||'Barebow',length:formValue('length')||'',status:document.querySelector('#equipmentEditForm .switch')?.classList.contains('on')?'active':kit.status});
  ['riserId','limbsId','stringId','plungerId','restId','slingId','arrowSetId'].forEach(f=>{const v=document.querySelector(`#equipmentEditForm [data-eq-field="${f}"]`)?.dataset.value;if(v)kit[f]=v});
  ['braceHeight','nockingPoint','tillerTop','tillerBottom','centerShot','plungerSpring','plungerClicks'].forEach(f=>kit.settings[f]=formValue(f)||'—');
  if(kit.status==='active')equipment.bowKits.forEach(k=>{if(k.id!==kit.id)k.status='draft'});
  if(id==='new')equipment.bowKits.push(kit);
  renderEquipment(); renderEquipmentDetail('bowKit:'+kit.id);
}
function saveArrowSet(id){
  let set=id==='new'?{id:uid('arrows')}:equipment.arrowSets.find(a=>a.id===id); if(!set)return;
  set.name=formValue('name')||'Без названия'; set.details=formValue('details')||'';
  Object.keys(arrowSetFieldTypes).forEach(f=>{const v=document.querySelector(`#equipmentEditForm [data-eq-field="${f}"]`)?.dataset.value;if(v)set[f]=v});
  if(id==='new')equipment.arrowSets.push(set);
  renderEquipment(); renderEquipmentDetail('arrowSet:'+set.id);
}
function renderSelectList(type,field,ownerKind,ownerId){
  const root=document.getElementById('equipmentDetailContent'); const title=equipmentTitles[type]||'Выбор'; setEquipmentNav('Выбор','', '');
  const owner=ownerKind==='bowKit'?(ownerId==='new'?{}:equipment.bowKits.find(k=>k.id===ownerId)||{}):(ownerId==='new'?{}:equipment.arrowSets.find(a=>a.id===ownerId)||{});
  const current=owner[field]||document.querySelector(`#equipmentEditForm [data-eq-field="${field}"]`)?.dataset.value||'';
  root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">${escapeHtml(title)}</div><div class="equipment-detail-sub">Выбери существующее или добавь новое</div></div><section class="group">${(equipment[type]||[]).map(item=>`<div class="equipment-select-row ${item.id===current?'selected':''}" data-eq-action="pick:${type}:${field}:${ownerKind}:${ownerId}:${item.id}"><div><div class="equipment-row-main">${escapeHtml(item.name)}</div>${item.details?`<div class="equipment-row-sub">${escapeHtml(item.details)}</div>`:''}</div><div class="equipment-check">${item.id===current?'✓':''}</div></div>`).join('')}<div class="equipment-row" data-eq-action="newComponent:${type}:${field}:${ownerKind}:${ownerId}"><div><div class="equipment-row-main" style="color:var(--blue)">Добавить</div></div><div class="equipment-row-value"><span class="equipment-chev">›</span></div></div></section>`;
}
function pickComponent(type,field,ownerKind,ownerId,itemId){
  if(ownerKind==='bowKit'&&ownerId!=='new'){const kit=equipment.bowKits.find(k=>k.id===ownerId); if(kit)kit[field]=itemId; renderEquipmentDetail('editBowKit:'+ownerId); return}
  if(ownerKind==='arrowSet'&&ownerId!=='new'){const set=equipment.arrowSets.find(a=>a.id===ownerId); if(set)set[field]=itemId; renderEquipmentDetail('editArrowSet:'+ownerId); return}
  renderEquipmentDetail(ownerKind==='bowKit'?'editBowKit:new':'editArrowSet:new');
}
function renderEquipmentGroup(id){
  const root=document.getElementById('equipmentDetailContent');
  if(id==='bowKits'){
    setEquipmentNav('Комплекты лука','+', 'newBowKit');
    root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">Комплекты лука</div><div class="equipment-detail-sub">Лук + настройки + выбранный комплект стрел</div></div><section class="group">${equipment.bowKits.map(k=>equipmentRow(k.name,`${k.class} · ${k.length} · стрелы: ${eqName('arrowSets',k.arrowSetId)}`,k.status==='active'?'Активен':'','bowKit:'+k.id)).join('')}<div class="equipment-row" data-eq-action="newBowKit"><div><div class="equipment-row-main" style="color:var(--blue)">Добавить комплект лука</div></div><div class="equipment-row-value"><span class="equipment-chev">›</span></div></div></section>`;return;
  }
  if(id==='arrowSets'){
    setEquipmentNav('Комплекты стрел','+', 'newArrowSet');
    root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">Комплекты стрел</div><div class="equipment-detail-sub">Стрела как отдельная сборка компонентов</div></div><section class="group">${equipment.arrowSets.map(a=>equipmentRow(a.name,arrowSetSummary(a),'','arrowSet:'+a.id)).join('')}<div class="equipment-row" data-eq-action="newArrowSet"><div><div class="equipment-row-main" style="color:var(--blue)">Добавить комплект стрел</div></div><div class="equipment-row-value"><span class="equipment-chev">›</span></div></div></section>`;return;
  }
  if(id==='bowComponents'||id==='arrowComponents'){
    const types=id==='bowComponents'?bowComponentTypes:arrowComponentTypes; setEquipmentNav(id==='bowComponents'?'Компоненты лука':'Компоненты стрел','', '');
    root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">${id==='bowComponents'?'Компоненты лука':'Компоненты стрел'}</div><div class="equipment-detail-sub">Библиотека готовых сущностей</div></div><section class="group">${types.map(t=>equipmentRow(equipmentTitles[t],(equipment[t]||[])[0]?.name||'Пока пусто',String((equipment[t]||[]).length),'list:'+t)).join('')}</section>`;
  }
}
function renderComponentList(type){
  const root=document.getElementById('equipmentDetailContent'); setEquipmentNav(equipmentTitles[type]||'Компоненты','+',`newComponent:${type}`);
  const items=equipment[type]||[];
  root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">${escapeHtml(equipmentTitles[type]||'Компоненты')}</div><div class="equipment-detail-sub">Можно добавлять и редактировать</div></div><section class="group">${items.map(it=>equipmentRow(it.name,it.details||'', '', `component:${type}:${it.id}`)).join('')}<div class="equipment-row" data-eq-action="newComponent:${type}"><div><div class="equipment-row-main" style="color:var(--blue)">Добавить</div></div><div class="equipment-row-value"><span class="equipment-chev">›</span></div></div></section>`;
}
function renderComponentEdit(type,id){
  const root=document.getElementById('equipmentDetailContent'); const item=id==='new'?{id:'new',name:'',details:''}:eqFind(type,id);
  setEquipmentNav(id==='new'?'Новый компонент':'Компонент','Готово',`saveComponent:${type}:${id}`);
  root.innerHTML=`<div class="equipment-detail-head"><div class="equipment-detail-title">${id==='new'?'Добавить':escapeHtml(item.name)}</div><div class="equipment-detail-sub">${escapeHtml(equipmentTitles[type]||'Компонент')}</div></div><form id="equipmentEditForm"><div class="section-title">Описание</div><section class="group">${inputRow('Название','name',item.name)}${inputRow('Детали','details',item.details)}${inputRow('Бренд','brand',item.brand)}${inputRow('Модель','model',item.model)}</section>${id!=='new'?`<div class="section-title">Опасная зона</div><section class="group"><div class="equipment-row" data-eq-action="deleteComponent:${type}:${item.id}"><div><div class="equipment-row-main danger-text">Удалить</div></div><div class="equipment-row-value"></div></div></section>`:''}</form>`;
}
function saveComponent(type,id){
  let item=id==='new'?{id:uid(type.slice(0,3))}:equipment[type].find(i=>i.id===id); if(!item)return;
  item.name=formValue('name')||'Без названия'; item.details=formValue('details')||''; item.brand=formValue('brand')||''; item.model=formValue('model')||'';
  if(id==='new')equipment[type].push(item); renderEquipment(); renderComponentList(type);
}
function deleteComponent(type,id){equipment[type]=equipment[type].filter(i=>i.id!==id); renderEquipment(); renderComponentList(type)}
function closeEquipmentDetail(){document.getElementById('equipmentDetailScreen')?.classList.remove('open'); setEquipmentNav('Комплект','Править','')}
function handleEquipmentAction(action){
  const parts=String(action||'').split(':'); const kind=parts[0];
  if(kind==='saveBowKit')return saveBowKit(parts[1]);
  if(kind==='saveArrowSet')return saveArrowSet(parts[1]);
  if(kind==='saveComponent')return saveComponent(parts[1],parts[2]);
  if(kind==='pick')return pickComponent(parts[1],parts[2],parts[3],parts[4],parts[5]);
  if(kind==='toggleActive'){const sw=document.querySelector('#equipmentEditForm .switch'); if(sw)sw.classList.toggle('on'); return}
  if(kind==='deleteBowKit'){if(equipment.bowKits.length>1){equipment.bowKits=equipment.bowKits.filter(k=>k.id!==parts[1]); renderEquipment(); renderEquipmentGroup('bowKits')} return}
  if(kind==='deleteArrowSet'){if(equipment.arrowSets.length>1){equipment.arrowSets=equipment.arrowSets.filter(a=>a.id!==parts[1]); renderEquipment(); renderEquipmentGroup('arrowSets')} return}
  if(kind==='deleteComponent')return deleteComponent(parts[1],parts[2]);
  if(kind==='newComponent'&&parts.length>2){return renderComponentEdit(parts[1],'new')}
  return openEquipmentDetail(action);
}

function openSettingsPanel(){
dateInput.value=session.date;
placeInput.value=session.place;
fillEquipmentSelects('sessionBowSelect','sessionArrowSelect',session.bowId,session.arrowSetId);
syncSettingsUI();
settingsScreen.classList.add('open');
hideKeyboard()
}
function closeSettingsPanel(){settingsScreen.classList.remove('open')}
function syncSettingsUI(){
[...distanceSeg.children].forEach(b=>b.classList.toggle('active',+b.dataset.value===session.distance));
[...shotsSeg.children].forEach(b=>{
  const value=+b.dataset.value;
  const blocked=!canSetShots(value) && value!==session.shots;
  b.classList.toggle('active',value===session.shots);
  b.classList.toggle('disabled',blocked);
});
const blockedOption=[...shotsSeg.children].find(b=>!canSetShots(+b.dataset.value) && +b.dataset.value!==session.shots);
if(blockedOption){
  shotsWarning.style.display='block';
  shotsWarning.textContent='Нельзя уменьшить — сначала нужно очистить часть заполненных серий';
}else{
  shotsWarning.style.display='none';
}
competitionSwitch.classList.toggle('on',session.competition);
competitionSwitch.setAttribute('aria-checked',session.competition)
}
function syncCreateUI(){[...createDistanceSeg.children].forEach(b=>b.classList.toggle('active',+b.dataset.value===createDraft.distance));[...createShotsSeg.children].forEach(b=>b.classList.toggle('active',+b.dataset.value===createDraft.shots));createCompetitionSwitch.classList.toggle('on',createDraft.competition);createCompetitionSwitch.setAttribute('aria-checked',createDraft.competition)}
function openCreate(){
const today=new Date().toISOString().slice(0,10);
createDraft={date:today,distance:18,shots:60,competition:false,place:'',bowId:primaryBowId(),arrowSetId:primaryArrowId()};
createDateInput.value=today;
createPlaceInput.value='';
fillEquipmentSelects('createBowSelect','createArrowSelect',createDraft.bowId,createDraft.arrowSetId);
syncCreateUI();
createScreen.classList.add('open')
}
function closeCreatePanel(){createScreen.classList.remove('open')}
function createSession(){const date=createDateInput.value||new Date().toISOString().slice(0,10); const ends=createDraft.shots/3; const s={id:'s'+Date.now(),date,place:createPlaceInput.value.trim(),distance:createDraft.distance,shots:createDraft.shots,competition:createDraft.competition,bowId:document.getElementById('createBowSelect')?.value||primaryBowId(),arrowSetId:document.getElementById('createArrowSelect')?.value||primaryArrowId(),comments:{},note:'',seed:Array.from({length:ends},()=>[null,null,null])}; sessions.unshift(s); closeCreatePanel(); openSession(s.id)}

document.addEventListener('click',e=>{
  const clearEl=e.target.closest('[data-clear-end]');
  if(clearEl){
    e.preventDefault();
    e.stopPropagation();
    clearSeries(+clearEl.dataset.clearEnd);
    return;
  }
  const inlineCommentInput=e.target.closest('.series-comment-input'); if(inlineCommentInput){e.stopPropagation();hideKeyboardSilent();return}
  const key=e.target.closest('.key'); if(key){e.stopPropagation(); const v=key.dataset.v; if(v==='done'){hideKeyboard();return} if(!active){active=findFirstEmpty();if(!active)return} const wasEditingExisting=seed[active.end][active.shot]!==null;
  const editedEnd=active.end;
  seed[active.end][active.shot]=(v==='M'||v==='X')?v:+v;
  if(wasEditingExisting){
    const firstEmptyInEnd=seed[editedEnd].findIndex(v=>v===null);
    if(firstEmptyInEnd!==-1){active={end:editedEnd,shot:firstEmptyInEnd};keyboardVisible=true;render();return}
    hideKeyboard();return
  }
  moveNext(); render(); return}
  const shot=e.target.closest('.shot'); if(shot){e.stopPropagation(); const requestedEnd=+shot.dataset.end; const requestedShot=+shot.dataset.shot; const end=targetEndForEdit(requestedEnd); const next={end,shot:end===requestedEnd?targetShotForEnd(end,requestedShot):firstEmptyShotInEnd(end)}; if(active&&keyboardVisible&&active.end===next.end&&active.shot===next.shot){hideKeyboard();return} activate(next.end,next.shot);return} const rowEl=e.target.closest('.row'); if(rowEl){e.stopPropagation(); const requestedEnd=+rowEl.dataset.end; const end=targetEndForEdit(requestedEnd); const done=seed[end]?.every(v=>v!==null); if(done){active={end,shot:null}; keyboardVisible=false; assistant.classList.add('hidden'); render(); return} activate(end,firstEmptyShotInEnd(end)); return}
  const eqAction=e.target.closest('[data-eq-action]'); if(eqAction){e.stopPropagation();handleEquipmentAction(eqAction.dataset.eqAction);return}
  const historyItem=e.target.closest('.history-item'); if(historyItem){openSession(historyItem.dataset.sessionId);return}
  const tab=e.target.closest('.tab'); if(tab){showRoot(tab.dataset.tab);return}
  if(!e.target.closest('.assistant')&&!e.target.closest('.settings-screen')&&!e.target.closest('.create-screen')) hideKeyboard()
});

function openNoteScreen(){
  const screen=document.getElementById('noteScreen');
  const input=document.getElementById('noteInput');
  if(!screen||!input)return;
  input.value=session.note||'';
  screen.classList.add('open');
  hideKeyboardSilent();
}
function closeNoteScreen(){
  const screen=document.getElementById('noteScreen');
  if(screen)screen.classList.remove('open');
}


['pointerdown','touchstart','mousedown'].forEach(eventName=>{
  document.addEventListener(eventName,e=>{
    const clearEl=e.target.closest('[data-clear-end]');
    if(!clearEl)return;
    e.preventDefault();
    e.stopPropagation();
  },true);
});

document.addEventListener('focusin',e=>{
  const input=e.target.closest('.series-comment-input');
  if(!input)return;
  hideKeyboardSilent();
  autosizeSeriesCommentInput(input);
});
document.addEventListener('input',e=>{
  const input=e.target.closest('.series-comment-input');
  if(!input)return;
  const end=+input.dataset.commentInputEnd;
  session.comments=session.comments||{};
  const text=input.value.trim();
  if(text)session.comments[end]=text;
  else delete session.comments[end];
  autosizeSeriesCommentInput(input);
});
document.addEventListener('focusout',e=>{
  const input=e.target.closest('.series-comment-input');
  if(!input)return;
  const end=+input.dataset.commentInputEnd;
  session.comments=session.comments||{};
  const text=input.value.trim();
  if(text)session.comments[end]=text;
  else delete session.comments[end];
  render();
});

document.getElementById('closeEquipmentDetail')?.addEventListener('click',closeEquipmentDetail);
document.getElementById('statsPeriodSeg')?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;statsPeriod=b.dataset.period;renderStats()});
document.getElementById('noteCard')?.addEventListener('click',openNoteScreen);
document.getElementById('closeNote')?.addEventListener('click',closeNoteScreen);
document.getElementById('saveNote')?.addEventListener('click',()=>{
  const input=document.getElementById('noteInput');
  if(input)session.note=input.value.trim();
  closeNoteScreen();
  render();
});


document.getElementById('closeSeriesComment')?.addEventListener('click',closeSeriesCommentScreen);
document.getElementById('saveSeriesComment')?.addEventListener('click',saveSeriesCommentValue);
backToHistory.addEventListener('click',()=>showRoot('history'));
openSettings.addEventListener('click',e=>{e.stopPropagation();openSettingsPanel()});
closeSettings.addEventListener('click',closeSettingsPanel);
saveSettings.addEventListener('click',()=>{
session.date=dateInput.value||session.date;
session.place=placeInput.value.trim();
session.bowId=document.getElementById('sessionBowSelect')?.value||session.bowId;
session.arrowSetId=document.getElementById('sessionArrowSelect')?.value||session.arrowSetId;
closeSettingsPanel();
active=findFirstEmpty();
keyboardVisible=!!active;
render()
});
distanceSeg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;session.distance=+b.dataset.value;syncSettingsUI();render()});
shotsSeg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const nextShots=+b.dataset.value;if(nextShots===session.shots)return;if(!canSetShots(nextShots)){alert(`Нельзя изменить на ${nextShots} стрел: уже заполнено ${filledArrowsCount()} стрел. Это приведёт к потере результата.`);syncSettingsUI();return}session.shots=nextShots;ensureSeed();active=findFirstEmpty();keyboardVisible=!!active;syncSettingsUI();render()});
competitionSwitch.addEventListener('click',()=>{session.competition=!session.competition;syncSettingsUI();render()});
rootThemeSwitch.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';rootThemeSwitch.classList.toggle('on',dark);rootThemeSwitch.setAttribute('aria-checked',dark)});
createDateInput.addEventListener('change',()=>{createDraft.date=createDateInput.value});
createFab.addEventListener('click',openCreate);
closeCreate.addEventListener('click',closeCreatePanel);
createDoneTop.addEventListener('click',createSession);
createSessionBtn.addEventListener('click',createSession);
createDistanceSeg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;createDraft.distance=+b.dataset.value;syncCreateUI()});
createShotsSeg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;createDraft.shots=+b.dataset.value;syncCreateUI()});
createCompetitionSwitch.addEventListener('click',()=>{createDraft.competition=!createDraft.competition;syncCreateUI()});


/* Simplified equipment v13: manual bow and arrow sets */
let equipmentTab='bow';
let editingArrowId=null;
let editingBowId=null;
let editingEquipmentKind=null;

equipment.arrowManualSets=[
  {
    id:'arr-winning-bees',
    active:true,
    name:'Winning Bees',
    count:'12',
    shaftBrand:'Victory',
    shaftModel:'V-Force',
    shaftSpine:'600',
    shaftLength:'31',
    shaftId:'0.245',
    shaftOd:'0.287',
    insertBrand:'Victory',
    insertModel:'VFORCE RPS',
    insertWeight:'22',
    pointBrand:'Saunders',
    pointModel:'Field Points',
    pointWeight:'125',
    pinBrand:'Victory',
    pinModel:'VFORCE',
    pinWeight:'11',
    nockBrand:'Easton',
    nockModel:'Pin Nocks Large Groove',
    fletchingType:'Перо',
    fletchingShape:'Shield',
    fletchingCount:'3',
    fletchingLength:'4'
  }
];

equipment.bowManualSets=[
  {
    id:'bow-bumblebee',
    active:true,
    name:'Bumblebee',
    bowClass:'Barebow',
    bowLength:'70',
    bowPower:'36.5',
    tiller:'',
    nockingPoint:'+8 мм',
    _expanded:{riser:true,limbs:true,string:true,plunger:true,rest:true,sling:true,topStabilizer:false,centerStabilizer:true,bottomStabilizer:true,backStabilizer:false},
    riserBrand:'WIAWIS',riserModel:'Meta LX',riserWeight:'1260',riserSize:'25',
    limbsBrand:'Akusta',limbsModel:'Obsidian',limbsWeight:'470',limbsPower:'34',
    stringThreadBrand:'BCY',stringThreadModel:'8125',stringMaster:'',
    plungerBrand:'Avalon',plungerModel:'Tec MAXX Micro Click',plungerWeight:'25',plungerSpring:'soft',plungerPosition:'0 от минимума',
    restBrand:'Zniper',restModel:'Arrow Rest RFD',restWeight:'53',
    slingBrand:'ACCMOS',slingModel:'wrist sling',slingType:'wrist',slingWeight:'77',
    centerStabilizerType:'riser weight',centerStabilizerBrand:'TenYards',centerStabilizerModel:'front middle',centerStabilizerWeight:'326',
    bottomStabilizerType:'riser weight',bottomStabilizerBrand:'TenYards',bottomStabilizerModel:'front lower',bottomStabilizerWeight:'553'
  }
];

const arrowSections=[
  {title:'Комплект',fields:[['name','Название'],['count','Кол-во стрел']]},
  {title:'Шафты',fields:[['shaftBrand','Бренд'],['shaftModel','Модель'],['shaftSpine','Спайн'],['shaftLength','Длина в дюймах'],['shaftId','ID в дюймах'],['shaftOd','OD в дюймах']]},
  {title:'Инсерт',fields:[['insertBrand','Бренд'],['insertModel','Модель'],['insertWeight','Вес, гранн']]},
  {title:'Поинт',fields:[['pointBrand','Бренд'],['pointModel','Модель'],['pointWeight','Вес, гранн']]},
  {title:'Пин',fields:[['pinBrand','Бренд'],['pinModel','Модель'],['pinWeight','Вес, гранн']]},
  {title:'Нок',fields:[['nockBrand','Бренд'],['nockModel','Модель']]},
  {title:'Оперение',fields:[['fletchingType','Вид'],['fletchingShape','Форма'],['fletchingCount','Количество'],['fletchingLength','Длина в дюймах']]}
];

const bowBaseSections=[
  {title:'Лук',fields:[['name','Название'],['bowClass','Класс лука'],['bowLength','Размер в дюймах'],['bowPower','Сила в фунтах']]},
  {title:'Настройки',fields:[['tiller','Тиллер'],['nockingPoint','Гнездо']]}
];
const bowComponentSections=[
  {key:'riser',title:'Райзер',add:'добавить райзер',fields:[['riserBrand','Бренд'],['riserModel','Модель'],['riserWeight','Вес в граммах'],['riserSize','Размер в дюймах']]},
  {key:'limbs',title:'Плечи',add:'добавить плечи',fields:[['limbsBrand','Бренд'],['limbsModel','Модель'],['limbsWeight','Вес в граммах'],['limbsPower','Сила в фунтах']]},
  {key:'string',title:'Тетива',add:'добавить тетиву',fields:[['stringThreadBrand','Бренд нити'],['stringThreadModel','Модель нити'],['stringMaster','Мастер']]},
  {key:'plunger',title:'Плунжер',add:'добавить плунжер',fields:[['plungerBrand','Бренд'],['plungerModel','Модель'],['plungerWeight','Вес в граммах'],['plungerSpring','Пружина'],['plungerPosition','Положение регулировки']]},
  {key:'rest',title:'Полочка',add:'добавить полочку',fields:[['restBrand','Бренд'],['restModel','Модель'],['restWeight','Вес в граммах']]},
  {key:'sling',title:'Вязочка',add:'добавить вязочку',fields:[['slingBrand','Бренд'],['slingModel','Модель'],['slingType','Тип'],['slingWeight','Вес в граммах']]},
  {key:'topStabilizer',title:'Верхний стабилизатор',add:'добавить верхний стабилизатор',fields:[['topStabilizerType','Тип'],['topStabilizerBrand','Бренд'],['topStabilizerModel','Модель'],['topStabilizerWeight','Вес в граммах']]},
  {key:'centerStabilizer',title:'Центральный стабилизатор',add:'добавить центральный стабилизатор',fields:[['centerStabilizerType','Тип'],['centerStabilizerBrand','Бренд'],['centerStabilizerModel','Модель'],['centerStabilizerWeight','Вес в граммах']]},
  {key:'bottomStabilizer',title:'Нижний стабилизатор',add:'добавить нижний стабилизатор',fields:[['bottomStabilizerType','Тип'],['bottomStabilizerBrand','Бренд'],['bottomStabilizerModel','Модель'],['bottomStabilizerWeight','Вес в граммах']]},
  {key:'backStabilizer',title:'Задний стабилизатор',add:'добавить задний стабилизатор',fields:[['backStabilizerType','Тип'],['backStabilizerBrand','Бренд'],['backStabilizerModel','Модель'],['backStabilizerWeight','Вес в граммах']]}
];

function arrowSummary(set){
  const parts=[];
  if(set.shaftSpine)parts.push('спайн '+set.shaftSpine);
  if(set.shaftLength)parts.push(set.shaftLength+'″');
  if(set.count)parts.push(set.count+' шт.');
  return parts.join(' · ')||'Заполните параметры';
}
function bowSummary(set){
  const parts=[];
  if(set.bowPower)parts.push(set.bowPower+'#');
  if(set.bowClass)parts.push(set.bowClass);
  if(set.bowLength)parts.push(set.bowLength+'″');
  return parts.join(' · ')||'Заполните параметры';
}
function renderEquipment(){
  const root=document.getElementById('equipmentContent'); if(!root)return;
  const add=document.getElementById('equipmentAddBtn'); if(add)add.style.visibility='visible';
  const tabs=`<div class="equipment-tabs"><button data-eq-action="equipmentTab:bow" class="${equipmentTab==='bow'?'active':''}">Лук</button><button data-eq-action="equipmentTab:arrows" class="${equipmentTab==='arrows'?'active':''}">Стрелы</button></div>`;
  if(equipmentTab==='bow'){
    const items=equipment.bowManualSets||[];
    root.innerHTML=tabs+(items.length?`<section class="group">${items.map(set=>`<div class="arrow-card" data-eq-action="openBowManual:${set.id}"><div><div class="arrow-card-title">${escapeHtml(set.name||'Без названия')}${set.active?'<span style="margin-left:8px;color:var(--blue);font-size:13px;font-weight:600">Основной</span>':''}</div><div class="arrow-card-sub">${escapeHtml(bowSummary(set))}</div></div><div class="arrow-card-chevron">›</div></div>`).join('')}</section>`:`<section class="group"><div class="equipment-empty">Пока нет комплектов лука. Нажмите +, чтобы добавить первый.</div></section>`);
    return;
  }
  const items=equipment.arrowManualSets||[];
  root.innerHTML=tabs+(items.length?`<section class="group">${items.map(set=>`<div class="arrow-card" data-eq-action="openArrowManual:${set.id}"><div><div class="arrow-card-title">${escapeHtml(set.name||'Без названия')}${set.active?'<span style="margin-left:8px;color:var(--blue);font-size:13px;font-weight:600">Основной</span>':''}</div><div class="arrow-card-sub">${escapeHtml(arrowSummary(set))}</div></div><div class="arrow-card-chevron">›</div></div>`).join('')}</section>`:`<section class="group"><div class="equipment-empty">Пока нет комплектов стрел. Нажмите +, чтобы добавить первый.</div></section>`);
}
function setEquipmentEditorNav(title,closeAction){
  const nav=document.getElementById('equipmentDetailNavTitle');
  const btn=document.getElementById('equipmentEditBtn');
  if(nav)nav.textContent=title||'Экипировка';
  if(btn){btn.textContent='Готово';btn.style.visibility='visible';btn.style.display='block';btn.dataset.eqAction=closeAction}
}
function fieldInputHtml(key,label,value,kind){
  const numeric=['count','shaftSpine','shaftLength','shaftId','shaftOd','insertWeight','pointWeight','pinWeight','fletchingCount','fletchingLength','bowLength','bowPower','riserWeight','riserSize','limbsWeight','limbsPower','plungerWeight','restWeight','slingWeight','topStabilizerWeight','centerStabilizerWeight','bottomStabilizerWeight','backStabilizerWeight'].includes(key);
  const attr=kind==='bow'?'data-bow-field':'data-arrow-field';
  return `<label class="arrow-form-row"><span class="arrow-form-label">${escapeHtml(label)}</span><input class="arrow-form-input" ${attr}="${escapeAttr(key)}" value="${escapeAttr(value||'')}" placeholder="" inputmode="${numeric?'decimal':'text'}"></label>`;
}
function newArrowSet(){
  const item={id:'arr-'+Date.now(),name:'',count:''};
  equipment.arrowManualSets.unshift(item);
  openArrowEditor(item.id);
}
function openArrowEditor(id){
  editingEquipmentKind='arrow';
  editingArrowId=id;
  editingBowId=null;
  const set=(equipment.arrowManualSets||[]).find(x=>x.id===id); if(!set)return;
  setEquipmentEditorNav(set.name||'Комплект стрел','closeArrowEditor');
  const root=document.getElementById('equipmentDetailContent'); if(!root)return;
  root.innerHTML=`<form id="arrowManualForm">${arrowSections.map(section=>`<div class="section-title">${escapeHtml(section.title)}</div><section class="group">${section.fields.map(([key,label])=>fieldInputHtml(key,label,set[key],'arrow')).join('')}</section>`).join('')}<section class="group delete-group">${!set.active?'<button type="button" class="equipment-delete-row" data-eq-action="makeArrowPrimary:'+set.id+'">Сделать основным</button>':''}<button type="button" class="equipment-delete-row" data-eq-delete-arrow="${escapeAttr(id)}">Удалить комплект стрел</button></section></form>`;
  document.getElementById('equipmentDetailScreen')?.classList.add('open');
}
function newBowSet(){
  const item={id:'bow-'+Date.now(),name:'',bowClass:'',bowLength:'',bowPower:'',tiller:'',nockingPoint:'',_expanded:{}};
  equipment.bowManualSets.unshift(item);
  openBowEditor(item.id);
}
function componentHasData(set,component){return component.fields.some(([key])=>String(set[key]||'').trim())}
function saveBowEditorValues(){
  if(!editingBowId)return;
  const set=(equipment.bowManualSets||[]).find(x=>x.id===editingBowId); if(!set)return;
  document.querySelectorAll('#bowManualForm [data-bow-field]').forEach(input=>{set[input.dataset.bowField]=input.value.trim()});
  if(!set.name)set.name='Без названия';
}
function openBowEditor(id){
  editingEquipmentKind='bow';
  editingBowId=id;
  editingArrowId=null;
  const set=(equipment.bowManualSets||[]).find(x=>x.id===id); if(!set)return;
  set._expanded=set._expanded||{};
  setEquipmentEditorNav(set.name||'Комплект лука','closeBowEditor');
  const root=document.getElementById('equipmentDetailContent'); if(!root)return;
  const baseHtml=bowBaseSections.map(section=>`<div class="section-title">${escapeHtml(section.title)}</div><section class="group">${section.fields.map(([key,label])=>fieldInputHtml(key,label,set[key],'bow')).join('')}</section>`).join('');
  const componentHtml=bowComponentSections.map(component=>{
    const expanded=!!set._expanded[component.key]||componentHasData(set,component);
    if(!expanded){
      return `<section class="group bow-add-group"><button type="button" class="add-block-row" data-eq-action="toggleBowBlock:${component.key}"><span class="add-circle">+</span><span>${escapeHtml(component.add)}</span></button></section>`;
    }
    return `<div class="section-title">${escapeHtml(component.title)}</div><section class="group">${component.fields.map(([key,label])=>fieldInputHtml(key,label,set[key],'bow')).join('')}<button type="button" class="equipment-delete-row" data-eq-action="toggleBowBlock:${component.key}">Снять с лука</button></section>`;
  }).join('');
  root.innerHTML=`<form id="bowManualForm">${baseHtml}${componentHtml}<section class="group delete-group">${!set.active?'<button type="button" class="equipment-delete-row" data-eq-action="makeBowPrimary:'+set.id+'">Сделать основным</button>':''}<button type="button" class="equipment-delete-row" data-eq-delete-bow="${escapeAttr(id)}">Удалить комплект лука</button></section></form>`;
  document.getElementById('equipmentDetailScreen')?.classList.add('open');
}
function saveArrowEditorValues(){
  if(!editingArrowId)return;
  const set=(equipment.arrowManualSets||[]).find(x=>x.id===editingArrowId); if(!set)return;
  document.querySelectorAll('#arrowManualForm [data-arrow-field]').forEach(input=>{set[input.dataset.arrowField]=input.value.trim()});
  if(!set.name)set.name='Без названия';
}
function closeEquipmentDetail(){
  if(editingEquipmentKind==='bow')saveBowEditorValues();
  if(editingEquipmentKind==='arrow')saveArrowEditorValues();
  editingArrowId=null; editingBowId=null; editingEquipmentKind=null;
  document.getElementById('equipmentDetailScreen')?.classList.remove('open');
  const btn=document.getElementById('equipmentEditBtn'); if(btn){btn.textContent='Править';btn.dataset.eqAction='';btn.style.visibility='hidden'}
  renderEquipment();
}
function toggleBowBlock(key){
  if(!editingBowId)return;
  saveBowEditorValues();
  const set=(equipment.bowManualSets||[]).find(x=>x.id===editingBowId); if(!set)return;
  set._expanded=set._expanded||{};
  set._expanded[key]=!set._expanded[key];
  openBowEditor(editingBowId);
}
function handleEquipmentAction(action){
  if(!action)return;
  const parts=action.split(':');
  if(parts[0]==='equipmentTab'){equipmentTab=parts[1]||'arrows';renderEquipment();return}
  if(parts[0]==='addEquipmentCurrent'){if(equipmentTab==='arrows')newArrowSet(); else newBowSet();return}
  if(parts[0]==='openArrowManual'){openArrowEditor(parts[1]);return}
  if(parts[0]==='openBowManual'){openBowEditor(parts[1]);return}
  if(parts[0]==='closeArrowEditor'||parts[0]==='closeBowEditor'){closeEquipmentDetail();return}
  if(parts[0]==='toggleBowBlock'){toggleBowBlock(parts[1]);return}
  if(parts[0]==='deleteArrowManual'){deleteArrowManualById(parts[1]);return}
  if(parts[0]==='deleteBowManual'){deleteBowManualById(parts[1]);return}
  if(parts[0]==='makeBowPrimary'){makeBowPrimary(parts[1]);return}
  if(parts[0]==='makeArrowPrimary'){makeArrowPrimary(parts[1]);return}
}
function deleteArrowManualById(id){
  id=String(id||''); if(!id)return;
  equipment.arrowManualSets=(equipment.arrowManualSets||[]).filter(x=>String(x.id)!==id);
  editingArrowId=null; editingEquipmentKind=null;
  document.getElementById('equipmentDetailScreen')?.classList.remove('open');
  const btn=document.getElementById('equipmentEditBtn'); if(btn){btn.textContent='Править';btn.dataset.eqAction='';btn.style.visibility='hidden'}
  equipmentTab='arrows'; renderEquipment();
}

function makeBowPrimary(id){
  equipment.bowManualSets.forEach(x=>x.active=String(x.id)===String(id));
  renderEquipment();
  openBowEditor(id);
}
function makeArrowPrimary(id){
  equipment.arrowManualSets.forEach(x=>x.active=String(x.id)===String(id));
  renderEquipment();
  openArrowEditor(id);
}

function deleteBowManualById(id){
  id=String(id||''); if(!id)return;
  equipment.bowManualSets=(equipment.bowManualSets||[]).filter(x=>String(x.id)!==id);
  editingBowId=null; editingEquipmentKind=null;
  document.getElementById('equipmentDetailScreen')?.classList.remove('open');
  const btn=document.getElementById('equipmentEditBtn'); if(btn){btn.textContent='Править';btn.dataset.eqAction='';btn.style.visibility='hidden'}
  equipmentTab='bow'; renderEquipment();
}

document.addEventListener('input',e=>{
  const arrowInput=e.target.closest('#arrowManualForm [data-arrow-field]');
  if(arrowInput&&editingArrowId){
    const set=(equipment.arrowManualSets||[]).find(x=>x.id===editingArrowId); if(!set)return;
    set[arrowInput.dataset.arrowField]=arrowInput.value.trim();
    if(arrowInput.dataset.arrowField==='name')setEquipmentEditorNav(arrowInput.value.trim()||'Комплект стрел','closeArrowEditor');
    return;
  }
  const bowInput=e.target.closest('#bowManualForm [data-bow-field]');
  if(bowInput&&editingBowId){
    const set=(equipment.bowManualSets||[]).find(x=>x.id===editingBowId); if(!set)return;
    set[bowInput.dataset.bowField]=bowInput.value.trim();
    if(bowInput.dataset.bowField==='name')setEquipmentEditorNav(bowInput.value.trim()||'Комплект лука','closeBowEditor');
  }
});

function handleEquipmentDeleteTap(e){
  const arrowDelete=e.target.closest('[data-eq-delete-arrow]');
  if(arrowDelete){e.preventDefault();e.stopImmediatePropagation();deleteArrowManualById(arrowDelete.dataset.eqDeleteArrow);return}
  const bowDelete=e.target.closest('[data-eq-delete-bow]');
  if(bowDelete){e.preventDefault();e.stopImmediatePropagation();deleteBowManualById(bowDelete.dataset.eqDeleteBow);return}
}
document.addEventListener('pointerup',handleEquipmentDeleteTap,true);
document.addEventListener('click',handleEquipmentDeleteTap,true);

renderHistory();
renderStats();
renderEquipment();
