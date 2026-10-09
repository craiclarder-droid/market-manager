const SUPABASE_URL = "https://svbappqtjnkivjbcxcpg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZzpDMdUmxkcHu00qnaA4QA_OBaT5KJi";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const CLOUD_TABLE = "market_manager_data";

const KEY='market-manager-v1';
const CRAIC_MASTER_CHECKLIST=["Popcorn", "Apron", "Seasoning for popcorn", "Allergen cards", "Signage", "Bucket for waste water", "Soap", "Blue roll", "Bags", "Gloves", "Honey", "Blends x 7", "Craic stickers", "First aid kit", "Blackboard", "Blue tack", "Tubs", "Spoons", "Elevators (plastic crates)", "Tester cups", "Strut cards", "Card machine", "Change", "Tablecloth", "Water tank & tap", "Lights", "Clips", "Crates", "Banners", "Bungees", "Fairy lights"];
const CRAIC_BLENDS=['Garlic / Herb','Salt / Chilli','Smokey / Sweet','Highlander Salt','Kebab House','Mexican Mix','Lemon / Herb'];
const statuses=['Discovered','Interested','Applying','Applied','Waiting List','Offered','Booked','Paid','Completed','Declined','Cancelled','Ignored'];
const defaultChecklist=["Popcorn", "Apron", "Seasoning for popcorn", "Allergen cards", "Signage", "Bucket for waste water", "Soap", "Blue roll", "Bags", "Gloves", "Honey", "Blends x 7", "Craic stickers", "First aid kit", "Blackboard", "Blue tack", "Tubs", "Spoons", "Elevators (plastic crates)", "Tester cups", "Strut cards", "Card machine", "Change", "Tablecloth", "Water tank & tap", "Lights", "Clips", "Crates", "Banners", "Bungees", "Fairy lights"];
const demo={organisers:[{id:'o1',name:'Scottish Markets',contactName:'',email:'',phone:'',website:'',instagram:'',facebook:'',notes:'Demo organiser – delete when ready'}],markets:[{id:'m1',name:'Newton Mearns Market',organiserId:'o1',venue:'Avenue area',town:'Newton Mearns',address:'',frequency:'1st Saturday',typicalFee:60,setting:'Outdoor',applicationUrl:'',notes:'DEMO DATA – use this to test then delete'}],events:[{id:'e1',marketId:'m1',date:'2026-11-07',status:'Booked',pitchFee:60,paid:false,applicationDeadline:'',paymentDeadline:'',setupFrom:'08:00',arrivalDeadline:'09:00',vehicleOut:'09:30',tradeStart:'10:00',tradeFinish:'14:00',packStart:'14:00',packFinish:'15:00',pitch:'',parking:'',instructions:'Demo event',notes:'',checklist:defaultChecklist.map((text,i)=>({id:'c'+i,text,done:false}))}],personal:[],settings:{defaultChecklist:[...defaultChecklist]}};
let data=load(); let page='home'; let calendarCursor=new Date(); let settingFilter='All';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(demo)}catch{return structuredClone(demo)}}

// One-time master-checklist migration. Existing event checklists are intentionally untouched.
data.settings = data.settings || {};
data.settings.basePostcode = data.settings.basePostcode || 'PA2 8TR';
data.settings.mileageRate = Number(data.settings.mileageRate || 0.55);
if (data.settings.craicChecklistVersion !== 1) {
  data.settings.defaultChecklist = [...CRAIC_MASTER_CHECKLIST];
  data.settings.craicChecklistVersion = 1;
  localStorage.setItem(KEY, JSON.stringify(data));
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(data));
  render();
  saveToCloud();
}
async function saveToCloud(){
  const { data: { user } } = await supabaseClient.auth.getUser();
  if(!user) return false;
  const { error } = await supabaseClient.from(CLOUD_TABLE).upsert({
    id:user.id,
    data,
    updated_at:new Date().toISOString()
  },{onConflict:"id"});
  if(error){console.error("Market Manager cloud save failed:",error);return false;}
  return true;
}
async function loadFromCloud(){
  const { data: { user } } = await supabaseClient.auth.getUser();
  if(!user) return "no-user";
  const { data:row,error } = await supabaseClient.from(CLOUD_TABLE).select("data").eq("id",user.id).maybeSingle();
  if(error){console.error("Market Manager cloud load failed:",error);return "error";}
  if(row?.data){
    data=row.data;
    localStorage.setItem(KEY,JSON.stringify(data));
    return "loaded";
  }
  const ok=await saveToCloud();
  return ok?"seeded":"error";
}
async function marketManagerLogin(){
  const email=document.getElementById("mmLoginEmail").value.trim();
  const password=document.getElementById("mmLoginPassword").value;
  const status=document.getElementById("mmLoginStatus");
  if(!email||!password){status.textContent="Enter your email and password.";return;}
  status.textContent="Connecting...";
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){status.textContent="Login failed: "+error.message;return;}
  await startMarketManager();
}
function showMarketLogin(){
  document.getElementById("app").innerHTML=`<div class="card" style="max-width:520px;margin:32px auto">
    <h2>Market Manager Cloud Login</h2>
    <p class="muted">Use the same Craic cloud login as Craic HQ.</p>
    <label>Email</label><input id="mmLoginEmail" type="email" autocomplete="email">
    <label>Password</label><input id="mmLoginPassword" type="password" autocomplete="current-password">
    <div class="actions"><button class="primary" onclick="marketManagerLogin()">Log in & connect cloud</button></div>
    <p id="mmLoginStatus" class="muted"></p>
  </div>`;
}
window.marketManagerLogin=marketManagerLogin;
const $=s=>document.querySelector(s); const uid=p=>p+Date.now()+Math.random().toString(16).slice(2);
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function market(id){return data.markets.find(x=>x.id===id)} function organiser(id){return data.organisers.find(x=>x.id===id)}
function fmtDate(x){if(!x)return'';return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(x+'T12:00:00'))}
function money(x){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(x||0))}
function hoursBetween(a,b){if(!a||!b)return 0;let [ah,am]=a.split(':').map(Number),[bh,bm]=b.split(':').map(Number);let mins=(bh*60+bm)-(ah*60+am);return mins>0?mins/60:0}
function expenseTotal(e){const xs=e.results?.expenses;if(Array.isArray(xs))return xs.reduce((a,x)=>a+Number(x.amount||0),0);return Number(e.results?.otherCosts||0)}
function eventNet(e){return Number(e.results?.takings||0)-Number(e.pitchFee||0)-Number(e.results?.travelCost||0)-expenseTotal(e)}
function eventHourly(e){let h=hoursBetween(e.tradeStart,e.tradeFinish);return h?eventNet(e)/h:0}
function today(){return new Date().toISOString().slice(0,10)}
function daysUntil(ds){if(!ds)return null;return Math.ceil((new Date(ds+'T12:00:00')-new Date(today()+'T12:00:00'))/86400000)}
function activeEvent(e){return !['Cancelled','Declined','Ignored'].includes(e.status)}
function eventClashes(e){return data.events.filter(x=>x.id!==e.id&&x.date===e.date&&activeEvent(x)).length+data.personal.filter(x=>x.date===e.date).length}
function actionQueue(){
  let out=[];
  data.events.filter(activeEvent).forEach(e=>{
    let m=market(e.marketId), name=m?.name||'Market';
    if(e.applicationDeadline&&!['Applied','Waiting List','Offered','Booked','Paid','Completed'].includes(e.status)){
      let d=daysUntil(e.applicationDeadline); if(d!==null&&d>=-7)out.push({event:e,kind:'Application',date:e.applicationDeadline,due:d,text:name+' application'});
    }
    if(e.paymentDeadline&&!e.paid&&['Offered','Booked'].includes(e.status)){
      let d=daysUntil(e.paymentDeadline); if(d!==null&&d>=-7)out.push({event:e,kind:'Payment',date:e.paymentDeadline,due:d,text:name+' payment'});
    }
    if(e.status==='Offered'&&!e.paid&&!e.paymentDeadline)out.push({event:e,kind:'Payment',date:e.date,due:daysUntil(e.date),text:name+' offer needs action'});
  });
  return out.sort((a,b)=>a.date.localeCompare(b.date));
}
function pipelineGroups(){return ['Interested','Applying','Applied','Waiting List','Offered','Booked','Paid'].map(status=>({status,events:data.events.filter(e=>e.status===status).sort((a,b)=>(a.date||'').localeCompare(b.date||''))}))}
function blendSalesFromEvent(e){return e.results?.blendSales&&typeof e.results.blendSales==='object'?e.results.blendSales:{}}
function blendProfile(mid){
 let es=data.events.filter(e=>e.marketId===mid&&Object.values(blendSalesFromEvent(e)).some(Number));
 let totals=Object.fromEntries(CRAIC_BLENDS.map(x=>[x,0])),all=0;
 es.forEach(e=>CRAIC_BLENDS.forEach(x=>{let n=Number(blendSalesFromEvent(e)[x]||0);totals[x]+=n;all+=n}));
 return {events:es.length,totals,shares:Object.fromEntries(CRAIC_BLENDS.map(x=>[x,all?totals[x]/all:0])),units:all};
}
function confidenceLabel(count,blendEvents){if(count>=4&&blendEvents>=3)return'High';if(count>=2||blendEvents>=1)return'Medium';return'Low'}
function forecastForEvent(e){
 let st=marketStats(e.marketId), expected=st?.avg||0, profile=blendProfile(e.marketId);
 let pouches=expected?Math.ceil(expected/12*3):0,buffer=pouches?Math.ceil(pouches*1.2):0;
 let fallback={'Salt / Chilli':.22,'Lemon / Herb':.17,'Garlic / Herb':.16,'Smokey / Sweet':.14,'Kebab House':.12,'Mexican Mix':.10,'Highlander Salt':.09};
 let shares=profile.units?profile.shares:fallback;
 let byBlend=Object.fromEntries(CRAIC_BLENDS.map(x=>[x,buffer?Math.max(1,Math.round(buffer*(shares[x]||0))):0]));
 let assigned=Object.values(byBlend).reduce((a,b)=>a+b,0),diff=buffer-assigned;
 if(buffer&&diff)byBlend['Salt / Chilli']=Math.max(1,byBlend['Salt / Chilli']+diff);
 return {expected,pouches,buffer,byBlend,profile,confidence:confidenceLabel(st?.count||0,profile.events)};
}
function marketStats(mid){let es=data.events.filter(e=>e.marketId===mid&&e.results&&e.results.takings!==''&&e.results.takings!=null);if(!es.length)return null;let vals=es.map(e=>Number(e.results.takings||0));return {count:es.length,avg:vals.reduce((a,b)=>a+b,0)/vals.length,best:Math.max(...vals),worst:Math.min(...vals),avgNet:es.reduce((a,e)=>a+eventNet(e),0)/es.length,avgHourly:es.reduce((a,e)=>a+eventHourly(e),0)/es.length}}
function marketDecision(mid){
 let st=marketStats(mid),es=data.events.filter(e=>e.marketId===mid&&e.results&&e.results.takings!==''&&e.results.takings!=null);
 if(!st)return {label:'Unproven',tone:'neutral',reason:'No trading results logged yet.',score:null};
 let yes=es.filter(e=>e.results?.bookAgain==='Yes').length,no=es.filter(e=>e.results?.bookAgain==='No').length;
 let score=0;
 if(st.avgNet>=300)score+=3;else if(st.avgNet>=180)score+=2;else if(st.avgNet>=100)score+=1;else if(st.avgNet<60)score-=2;
 if(st.avgHourly>=60)score+=2;else if(st.avgHourly>=35)score+=1;else if(st.avgHourly&&st.avgHourly<20)score-=1;
 score+=yes?1:0;score-=no?1:0;
 let label=score>=4?'Strong':score>=1?'Retest':score<=-2&&st.count>=2?'Avoid':'Weak';
 if(st.count===1&&label==='Avoid')label='Retest';
 let reason=st.count+' result'+(st.count===1?'':'s')+' · avg net '+money(st.avgNet)+' · '+money(st.avgHourly)+'/hr';
 if(st.count===1)reason+=' · one result is not enough to write it off';
 return {label,tone:label.toLowerCase(),reason,score};
}
function clashSummary(e){let n=eventClashes(e);return n?'<span class="badge warning">⚠ '+n+' clash'+(n===1?'':'es')+'</span>':''}
function prepSummary(){
 let next=data.events.filter(e=>e.date>=today()&&['Booked','Paid'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date))[0];
 if(!next)return null;let f=forecastForEvent(next);return {event:next,forecast:f};
}

$('#nav').onclick=e=>{if(e.target.dataset.page){page=e.target.dataset.page;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));render()}};
$('#addBtn').onclick=()=>openMarket();
function render(){const a=$('#app'); if(page==='home')a.innerHTML=home(); else if(page==='markets')a.innerHTML=marketsPage(); else if(page==='calendar')a.innerHTML=calendarPage(); else if(page==='applications')a.innerHTML=applicationsPage(); else if(page==='stock')a.innerHTML=stockPage(); else a.innerHTML=settingsPage(); bind();}
function home(){
 const upcoming=[...data.events].filter(e=>e.date>=today()&&activeEvent(e)).sort((a,b)=>a.date.localeCompare(b.date));
 const unpaid=upcoming.filter(e=>['Offered','Booked','Paid'].includes(e.status)&&!e.paid), q=actionQueue(),prep=prepSummary();
 const clashes=upcoming.filter(e=>eventClashes(e));
 return `<h2>Dashboard</h2><div class="grid"><div class="card"><div class="muted">Upcoming events</div><div class="stat">${upcoming.length}</div></div><div class="card"><div class="muted">Need paid</div><div class="stat">${unpaid.length}</div></div><div class="card"><div class="muted">Actions due</div><div class="stat">${q.length}</div></div><div class="card"><div class="muted">Clashes</div><div class="stat">${clashes.length}</div></div></div>
 ${prep?`<div class="card focus-card"><div class="row"><div><div class="muted">NEXT MARKET PREP</div><h3>${esc(market(prep.event.marketId)?.name||'Market')} · ${fmtDate(prep.event.date)}</h3>${prep.forecast.buffer?`<div>Plan around <b>${prep.forecast.buffer} pouches</b> · ${prep.forecast.confidence} forecast confidence</div>`:'<div>Log previous results to unlock a stock forecast.</div>'}</div><button data-action="editEvent" data-id="${prep.event.id}">Open event</button></div></div>`:''}
 <h3>Action queue</h3>${q.slice(0,8).map(x=>`<div class="card action-card"><div class="row"><div><b>${esc(x.text)}</b><div class="muted">${x.kind} · ${fmtDate(x.date)} · ${x.due<0?Math.abs(x.due)+' days overdue':x.due===0?'due today':x.due+' days'}</div></div><button data-action="editEvent" data-id="${x.event.id}">Open</button></div></div>`).join('')||'<div class="card empty">Nothing urgent. You are clear.</div>'}
 <h3>Next up</h3>${upcoming.slice(0,4).map(eventCard).join('')||'<div class="card empty">Nothing upcoming yet.</div>'}`;
}
function marketsPage(){return `<div class="row"><div><h2>Markets</h2><div class="muted">Organiser → market → individual event</div></div><button class="primary" data-action="addMarket">+ Add market</button></div><div class="card"><label for="settingFilter">Find markets by weather suitability</label><select id="settingFilter"><option value="All" ${settingFilter==='All'?'selected':''}>All markets</option><option value="Indoor" ${settingFilter==='Indoor'?'selected':''}>Indoor - rainy days</option><option value="Outdoor" ${settingFilter==='Outdoor'?'selected':''}>Outdoor - fair weather</option><option value="Mixed" ${settingFilter==='Mixed'?'selected':''}>Mixed / flexible</option></select><p class="muted">Uses the Indoor / Outdoor / Mixed setting on each market. Change it when editing a market.</p></div><br>${data.markets.filter(m=>settingFilter==='All'||m.setting===settingFilter).map(m=>{const o=organiser(m.organiserId), es=data.events.filter(e=>e.marketId===m.id).sort((a,b)=>a.date.localeCompare(b.date));let st=marketStats(m.id),dec=marketDecision(m.id);return `<div class="card"><div class="row"><div><h3>${esc(m.name)} <span class="decision ${dec.tone}">${dec.label}</span></h3><div class="muted">${esc(m.town)} · ${esc(o?.name||'No organiser')} · ${esc(m.frequency||'No frequency')}</div>${st?`<div class="performance"><b>${st.count} result${st.count===1?'':'s'} · Avg ${money(st.avg)} · Avg net ${money(st.avgNet)} · ${money(st.avgHourly)}/hr</b><div class="muted">Best ${money(st.best)} · Worst ${money(st.worst)}</div><div class="decision-reason">${esc(dec.reason)}</div></div>`:`<div class="decision-reason">${esc(dec.reason)}</div>`}</div><div><button data-action="editMarket" data-id="${m.id}">Edit</button> <button data-action="addEvent" data-id="${m.id}" class="primary">+ Event</button></div></div>${es.length?es.map(eventCard).join(''):'<p class="muted">No event dates yet.</p>'}</div>`}).join('')||'<div class="card empty">No markets yet.</div>'}`}
function eventCard(e){const m=market(e.marketId);return `<div class="card event"><div class="row"><div><b>${esc(m?.name||'Market')}</b> ${clashSummary(e)}<div>${fmtDate(e.date)} · ${esc(e.tradeStart||'?')}–${esc(e.tradeFinish||'?')}</div><span class="badge">${esc(e.status)}</span>${e.paid?'<span class="badge">Paid ✓</span>':'<span class="badge">Unpaid</span>'}${e.results&&e.results.takings!==''&&e.results.takings!=null?`<span class="badge">Takings ${money(e.results.takings)}</span><span class="badge">Net ${money(eventNet(e))}</span>`:''}</div><div><button data-action="editEvent" data-id="${e.id}">Open</button></div></div></div>`}
function calendarPage(){
 let y=calendarCursor.getFullYear(),mo=calendarCursor.getMonth(),first=new Date(y,mo,1),last=new Date(y,mo+1,0),offset=(first.getDay()+6)%7,cells='';
 for(let i=0;i<offset;i++)cells+='<div></div>';
 for(let d=1;d<=last.getDate();d++){let ds=`${y}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,es=data.events.filter(e=>e.date===ds&&activeEvent(e)),ps=data.personal.filter(e=>e.date===ds),clash=es.length+ps.length>1;cells+=`<div class="day ${clash?'clash':''}"><b>${d}${clash?' ⚠':''}</b>${es.map(e=>`<div class="calitem" data-action="editEvent" data-id="${e.id}">${esc(market(e.marketId)?.name||'Market')}</div>`).join('')}${ps.map(e=>`<div class="calitem personal">${esc(e.title)}</div>`).join('')}</div>`}
 return `<div class="row"><div><h2>Calendar</h2><div class="muted">${first.toLocaleString('en-GB',{month:'long',year:'numeric'})}</div></div><div><button data-action="prevMonth">←</button> <button data-action="thisMonth">Today</button> <button data-action="nextMonth">→</button> <button data-action="addPersonal">+ Personal</button></div></div><br><div class="calendar">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<b>${x}</b>`).join('')}${cells}</div><p class="muted">⚠ marks dates with more than one market/personal commitment.</p>`;
}
function applicationsPage(){
 return `<div class="row"><div><h2>Applications & bookings</h2><div class="muted">From interest to paid pitch.</div></div></div><div class="pipeline">${pipelineGroups().map(g=>`<section class="pipe-col"><h3>${g.status} <span class="badge">${g.events.length}</span></h3>${g.events.map(e=>`<div class="card mini"><b>${esc(market(e.marketId)?.name||'Market')}</b><div>${fmtDate(e.date)}</div>${e.applicationDeadline?`<div class="muted">Apply by ${fmtDate(e.applicationDeadline)}</div>`:''}${e.paymentDeadline&&!e.paid?`<div class="muted">Pay by ${fmtDate(e.paymentDeadline)}</div>`:''}<button data-action="editEvent" data-id="${e.id}">Open</button></div>`).join('')||'<div class="muted">None</div>'}</section>`).join('')}</div>`;
}
function stockPage(){
 let es=data.events.filter(e=>e.date>=today()&&['Booked','Paid'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date));
 return `<h2>Stock forecast</h2><p class="muted">Uses each market's takings history and, when you log it, the actual blend mix sold there. Low-confidence forecasts use Craic's current general sales pattern until that market teaches us better.</p>${es.map(e=>{let f=forecastForEvent(e),st=marketStats(e.marketId);return `<div class="card"><div class="row"><div><h3>${esc(market(e.marketId)?.name||'Market')}</h3><div class="muted">${fmtDate(e.date)} · ${st?st.count+' previous result'+(st.count===1?'':'s'):'no history yet'} · <b>${f.confidence} confidence</b></div></div><button data-action="editEvent" data-id="${e.id}">Open</button></div>${st?`<div class="result-grid"><div class="metric"><span class="muted">Expected takings</span><b>${money(f.expected)}</b></div><div class="metric"><span class="muted">Core pouch guide</span><b>${f.pouches}</b></div><div class="metric"><span class="muted">Pack with 20% buffer</span><b>${f.buffer}</b></div></div><h4>Suggested blend load</h4><div class="blend-forecast">${CRAIC_BLENDS.map(x=>`<div><span>${esc(x)}</span><b>${f.byBlend[x]}</b></div>`).join('')}</div><p class="muted">${f.profile.events?`Based on ${f.profile.events} event${f.profile.events===1?'':'s'} with blend-level sales logged at this market.`:'No blend-level history here yet, so this uses Craic’s general mix as a starting point.'}</p>`:'<p>Add a result from this market before relying on a stock number.</p>'}</div>`}).join('')||'<div class="card empty">No booked markets to forecast yet.</div>'}`;
}
function settingsPage(){return `<h2>Settings</h2><div class="card"><h3>Travel</h3><div class="two">${field('Craic base postcode','basePostcode',data.settings.basePostcode)}${field('Mileage rate (£/mile)','mileageRate',data.settings.mileageRate,'number')}</div><p class="muted">Return mileage × rate. Default rate is 55p/mile for 2026/27.</p><button data-action="saveTravel">Save travel settings</button></div><div class="card"><h3>Default market checklist</h3><p class="muted">New events copy this list. Editing an event checklist never changes this master list.</p><div id="defaultChecks">${data.settings.defaultChecklist.map((x,i)=>`<div class="row"><span>${esc(x)}</span><button data-action="removeDefault" data-i="${i}">Remove</button></div>`).join('')}</div><br><button data-action="addDefault">+ Add item</button></div><div class="card"><h3>Data</h3><p class="muted">Cycle 1 stores data in this browser so it survives refreshes. Cloud sync can replace this data layer later.</p><button data-action="export">Export backup</button> <button data-action="reset" class="danger">Reset demo data</button></div>`}
function placeholder(t,s){return `<h2>${t}</h2><div class="card empty">${s}</div>`}
function bind(){let filter=document.getElementById('settingFilter');if(filter)filter.onchange=()=>{settingFilter=filter.value;render()};document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset.id,b.dataset.i))}
function action(a,id,i){if(a==='prevMonth'){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);render();return}if(a==='nextMonth'){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);render();return}if(a==='thisMonth'){calendarCursor=new Date();render();return}if(a==='saveTravel'){let bp=document.querySelector('[name="basePostcode"]'),mr=document.querySelector('[name="mileageRate"]');data.settings.basePostcode=(bp?.value||'PA2 8TR').trim().toUpperCase();data.settings.mileageRate=Number(mr?.value||0.55);save();return;}if(a==='addMarket')openMarket(); if(a==='editMarket')openMarket(id); if(a==='addEvent')openEvent(null,id); if(a==='editEvent')openEvent(id); if(a==='addPersonal')openPersonal(); if(a==='removeDefault'){data.settings.defaultChecklist.splice(+i,1);save()} if(a==='addDefault'){let x=prompt('Checklist item');if(x){data.settings.defaultChecklist.push(x);save()}} if(a==='export'){let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='market-manager-backup.json';a.click();URL.revokeObjectURL(u)} if(a==='reset'&&confirm('Reset everything back to demo data?')){data=structuredClone(demo);save()}}
function field(label,name,val='',type='text'){let extra=type==='number'?' step="0.01" inputmode="decimal"':'';return `<div class="field"><label>${label}</label><input type="${type}"${extra} name="${name}" value="${esc(val??'')}"></div>`}
function openMarket(id){let m=id?market(id):{}, o=id?organiser(m.organiserId):{};$('#formBody').innerHTML=`<h2>${id?'Edit':'Add'} market</h2><div class="stack">${field('Market name','name',m.name)}<div class="two">${field('Venue','venue',m.venue)}${field('Town / city','town',m.town)}</div>${field('Address / postcode','address',m.address)}<div class="two">${field('Typical frequency','frequency',m.frequency)}${field('Typical pitch fee (£)','typicalFee',m.typicalFee,'number')}</div><div class="field"><label>Indoor / outdoor</label><select name="setting">${['','Indoor','Outdoor','Mixed'].map(x=>`<option ${m.setting===x?'selected':''}>${x}</option>`).join('')}</select></div>${field('Application URL','applicationUrl',m.applicationUrl)}<hr><h3>Organiser</h3>${field('Organiser name','orgName',o.name)}<div class="two">${field('Contact name','contactName',o.contactName)}${field('Email','email',o.email,'email')}</div><div class="two">${field('Phone','phone',o.phone)}${field('Website','website',o.website)}</div>${field('Instagram','instagram',o.instagram)}${field('Facebook','facebook',o.facebook)}<div class="field"><label>Notes</label><textarea name="notes">${esc(m.notes||'')}</textarea></div>${id?'<button type="button" class="danger" id="deleteMarket">Delete market</button>':''}</div>`;$('#modal').showModal();$('#form').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target), oid=o.id||uid('o'), mid=m.id||uid('m');let org={id:oid,name:f.get('orgName'),contactName:f.get('contactName'),email:f.get('email'),phone:f.get('phone'),website:f.get('website'),instagram:f.get('instagram'),facebook:f.get('facebook'),notes:o.notes||''};let nm={id:mid,name:f.get('name'),organiserId:oid,venue:f.get('venue'),town:f.get('town'),address:f.get('address'),frequency:f.get('frequency'),typicalFee:+f.get('typicalFee')||0,setting:f.get('setting'),applicationUrl:f.get('applicationUrl'),notes:f.get('notes')};upsert(data.organisers,org);upsert(data.markets,nm);$('#modal').close();save()};if(id)$('#deleteMarket').onclick=()=>{if(confirm('Delete this market AND all its event dates?')){data.events=data.events.filter(e=>e.marketId!==id);data.markets=data.markets.filter(x=>x.id!==id);$('#modal').close();save()}}}
function upsert(arr,x){let i=arr.findIndex(y=>y.id===x.id);if(i>=0)arr[i]=x;else arr.push(x)}
function openEvent(id,marketId){
  let e=id?data.events.find(x=>x.id===id):{marketId,status:'Interested',paid:false,checklist:CRAIC_MASTER_CHECKLIST.map(x=>({id:uid('c'),text:x,done:false}))};
  let m=market(e.marketId);
  let checklist=structuredClone(e.checklist||[]);
  let expenses=Array.isArray(e.results?.expenses)?structuredClone(e.results.expenses):[];
  if(!expenses.length && Number(e.results?.otherCosts||0)>0) expenses=[{id:uid('x'),description:'Previous other event costs',amount:Number(e.results.otherCosts)}];

  function checkRow(c,i){
    return `<div class="check" data-check-row="${i}">
      <input type="checkbox" data-check="${i}" ${c.done?'checked':''}>
      <input data-text="${i}" value="${esc(c.text)}">
      <button type="button" data-rm="${i}">×</button>
    </div>`;
  }

  $('#formBody').innerHTML=`<h2>${id?'Event':'New event'} · ${esc(m?.name||'')}</h2><div class="stack">
    ${field('Date','date',e.date,'date')}
    <div class="two">
      <div class="field"><label>Status</label><select name="status">${statuses.map(x=>`<option ${e.status===x?'selected':''}>${x}</option>`).join('')}</select></div>
      ${field('Pitch fee (£)','pitchFee',e.pitchFee??m?.typicalFee,'number')}
    </div>
    <label class="check"><input type="checkbox" name="paid" ${e.paid?'checked':''}> Pitch paid</label>
    <div class="two">${field('Application deadline','applicationDeadline',e.applicationDeadline,'date')}${field('Payment deadline','paymentDeadline',e.paymentDeadline,'date')}</div>
    <h3>Times</h3>
    <div class="two">
      ${field('Setup from','setupFrom',e.setupFrom,'time')}
      ${field('Arrival deadline','arrivalDeadline',e.arrivalDeadline,'time')}
      ${field('Vehicle out by','vehicleOut',e.vehicleOut,'time')}
      ${field('Trading starts','tradeStart',e.tradeStart,'time')}
      ${field('Trading finishes','tradeFinish',e.tradeFinish,'time')}
      ${field('Pack down finishes','packFinish',e.packFinish,'time')}
    </div>
    ${field('Pitch / stall number','pitch',e.pitch)}
    <div class="field"><label>Parking / loading</label><textarea name="parking">${esc(e.parking||'')}</textarea></div>
    <div class="field"><label>Organiser instructions</label><textarea name="instructions">${esc(e.instructions||'')}</textarea></div>
    <h3>Market results</h3>
    <p class="muted">Fill this in after trading. Leave it blank beforehand.</p>
    <div class="two">${field('Total takings (£)','takings',e.results?.takings??'','number')}${field('Cash (£) - optional','cash',e.results?.cash??'','number')}</div>
    <div class="two">${field('Card (£) - optional','card',e.results?.card??'','number')}${field('Return mileage','returnMiles',e.results?.returnMiles??'','number')}</div>
    <div class="two">${field('Travel cost (£)','travelCost',e.results?.travelCost??'','number')}<div class="field"><label>Mileage calculator</label><button type="button" id="calcMileage">Calculate from return miles</button><div class="muted">${esc(data.settings.basePostcode)} · ${money(data.settings.mileageRate)}/mile</div></div></div>
    <div class="field"><label>Event expenses</label><div id="expenses"></div><div class="two"><input id="expenseDesc" placeholder="e.g. Curry / networking"><input id="expenseAmount" type="number" step="0.01" inputmode="decimal" placeholder="£"></div><button type="button" id="addExpense">+ Add expense</button><p class="muted">Parking, networking food, one-off supplies etc. Mileage stays separate.</p></div>
    <div class="two"><div class="field"><label>Footfall</label><select name="footfall">${['','Poor','Average','Busy'].map(x=>`<option ${e.results?.footfall===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Weather</label><select name="weather">${['','Poor','OK','Good'].map(x=>`<option ${e.results?.weather===x?'selected':''}>${x}</option>`).join('')}</select></div></div>
    <div class="field"><label>Blend pouches sold (optional, makes stock forecasts smarter)</label><div class="blend-sales">${CRAIC_BLENDS.map(x=>`<div class="field"><label>${esc(x)}</label><input type="number" min="0" step="1" inputmode="numeric" name="blend_${esc(x)}" value="${esc(blendSalesFromEvent(e)[x]??'')}"></div>`).join('')}</div></div>
    <div class="field"><label>Would you book again?</label><select name="bookAgain">${['','Yes','Maybe','No'].map(x=>`<option ${e.results?.bookAgain===x?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="field"><label>Result notes / context</label><textarea name="resultNotes">${esc(e.results?.notes||'')}</textarea></div>
    ${e.results&&e.results.takings!==''&&e.results.takings!=null?`<div class="result-grid"><div class="metric"><span class="muted">Net after event costs</span><b>${money(eventNet(e))}</b></div><div class="metric"><span class="muted">Trading hours</span><b>${hoursBetween(e.tradeStart,e.tradeFinish).toFixed(1)}</b></div><div class="metric"><span class="muted">Net / hour</span><b>${money(eventHourly(e))}</b></div></div>`:''}
    <h3>Event checklist</h3>
    <div id="checks">${checklist.map(checkRow).join('')}</div>
    <button type="button" id="addCheck">+ Add checklist item</button>
    ${id?'<button type="button" class="danger" id="deleteEvent">Delete event</button>':''}
  </div>`;

  $('#modal').showModal();

  function renderExpenses(){
    let box=$('#expenses'); if(!box)return;
    box.innerHTML=expenses.length?expenses.map((x,i)=>`<div class="row"><span>${esc(x.description)} · ${money(x.amount)}</span><button type="button" data-exp-rm="${i}">Remove</button></div>`).join(''):'<div class="muted">No extra expenses.</div>';
    box.querySelectorAll('[data-exp-rm]').forEach(b=>b.onclick=()=>{expenses.splice(+b.dataset.expRm,1);renderExpenses()});
  }
  renderExpenses();
  $('#addExpense').onclick=()=>{
    let d=$('#expenseDesc').value.trim(), a=Number($('#expenseAmount').value);
    if(!d || !(a>0))return;
    expenses.push({id:uid('x'),description:d,amount:a});
    $('#expenseDesc').value=''; $('#expenseAmount').value=''; renderExpenses();
  };
  $('#calcMileage').onclick=()=>{
    let miles=Number(document.querySelector('[name="returnMiles"]').value||0);
    document.querySelector('[name="travelCost"]').value=(miles*Number(data.settings.mileageRate||0.55)).toFixed(2);
  };

  function syncChecklistFromDom(){
    document.querySelectorAll('[data-text]').forEach(inp=>{
      let i=+inp.dataset.text;
      if(checklist[i]){
        checklist[i].text=inp.value;
        let cb=document.querySelector(`[data-check="${i}"]`);
        checklist[i].done=!!cb?.checked;
      }
    });
  }

  function renderChecklist(){
    $('#checks').innerHTML=checklist.map(checkRow).join('');
    bindChecklist();
  }

  function bindChecklist(){
    document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{
      syncChecklistFromDom();
      checklist.splice(+b.dataset.rm,1);
      renderChecklist();
    });
  }

  bindChecklist();

  $('#addCheck').onclick=()=>{
    syncChecklistFromDom();
    let x=prompt('Checklist item');
    if(x && x.trim()){
      checklist.push({id:uid('c'),text:x.trim(),done:false});
      renderChecklist();
    }
  };

  $('#form').onsubmit=ev=>{
    ev.preventDefault();
    syncChecklistFromDom();
    let f=new FormData(ev.target), ne={
      ...e,id:e.id||uid('e'),marketId:e.marketId,date:f.get('date'),status:f.get('status'),
      pitchFee:+f.get('pitchFee')||0,paid:f.get('paid')==='on',
      applicationDeadline:f.get('applicationDeadline'),paymentDeadline:f.get('paymentDeadline'),
      setupFrom:f.get('setupFrom'),arrivalDeadline:f.get('arrivalDeadline'),vehicleOut:f.get('vehicleOut'),
      tradeStart:f.get('tradeStart'),tradeFinish:f.get('tradeFinish'),packStart:e.packStart||'',
      packFinish:f.get('packFinish'),pitch:f.get('pitch'),parking:f.get('parking'),
      instructions:f.get('instructions'),notes:e.notes||'',checklist,
      results:{takings:f.get('takings'),cash:f.get('cash'),card:f.get('card'),returnMiles:f.get('returnMiles'),travelCost:f.get('travelCost'),expenses,otherCosts:expenses.reduce((a,x)=>a+Number(x.amount||0),0),footfall:f.get('footfall'),weather:f.get('weather'),blendSales:Object.fromEntries(CRAIC_BLENDS.map(x=>[x,Number(f.get('blend_'+x)||0)])),bookAgain:f.get('bookAgain'),notes:f.get('resultNotes')}
    };
    upsert(data.events,ne);
    $('#modal').close();
    save();
  };

  if(id)$('#deleteEvent').onclick=()=>{
    if(confirm('Delete this event?')){
      data.events=data.events.filter(x=>x.id!==id);
      $('#modal').close();
      save();
    }
  };
}
function openEventObject(obj,id){let idx=data.events.findIndex(x=>x.id===obj.id); if(idx>=0)data.events[idx]=obj; else if(id){} openEvent(id||null,obj.marketId)}
function openPersonal(){let title=prompt('What is it? e.g. Butcher shift, holiday, appointment');if(!title)return;let date=prompt('Date (YYYY-MM-DD)');if(date){data.personal.push({id:uid('p'),title,date});save()}}
async function startMarketManager(){
  const { data: { user } } = await supabaseClient.auth.getUser();
  if(!user){showMarketLogin();return;}
  const result=await loadFromCloud();
  if(result==="error"){
    document.getElementById("app").innerHTML='<div class="card"><h2>Cloud connection failed</h2><p>Market Manager could not read/write Supabase. Check the market_manager_data permissions.</p></div>';
    return;
  }
  render();
}
startMarketManager();
