const KEY='market-manager-v1';
const CRAIC_MASTER_CHECKLIST=["Popcorn", "Apron", "Seasoning for popcorn", "Allergen cards", "Signage", "Bucket for waste water", "Soap", "Blue roll", "Bags", "Gloves", "Honey", "Blends x 7", "Craic stickers", "First aid kit", "Blackboard", "Blue tack", "Tubs", "Spoons", "Elevators (plastic crates)", "Tester cups", "Strut cards", "Card machine", "Change", "Tablecloth", "Water tank & tap", "Lights", "Clips", "Crates", "Banners", "Bungees", "Fairy lights"];
const statuses=['Discovered','Interested','Applying','Applied','Waiting List','Offered','Booked','Paid','Completed','Declined','Cancelled','Ignored'];
const defaultChecklist=["Popcorn", "Apron", "Seasoning for popcorn", "Allergen cards", "Signage", "Bucket for waste water", "Soap", "Blue roll", "Bags", "Gloves", "Honey", "Blends x 7", "Craic stickers", "First aid kit", "Blackboard", "Blue tack", "Tubs", "Spoons", "Elevators (plastic crates)", "Tester cups", "Strut cards", "Card machine", "Change", "Tablecloth", "Water tank & tap", "Lights", "Clips", "Crates", "Banners", "Bungees", "Fairy lights"];
const demo={organisers:[{id:'o1',name:'Scottish Markets',contactName:'',email:'',phone:'',website:'',instagram:'',facebook:'',notes:'Demo organiser – delete when ready'}],markets:[{id:'m1',name:'Newton Mearns Market',organiserId:'o1',venue:'Avenue area',town:'Newton Mearns',address:'',frequency:'1st Saturday',typicalFee:60,setting:'Outdoor',applicationUrl:'',notes:'DEMO DATA – use this to test then delete'}],events:[{id:'e1',marketId:'m1',date:'2026-11-07',status:'Booked',pitchFee:60,paid:false,applicationDeadline:'',paymentDeadline:'',setupFrom:'08:00',arrivalDeadline:'09:00',vehicleOut:'09:30',tradeStart:'10:00',tradeFinish:'14:00',packStart:'14:00',packFinish:'15:00',pitch:'',parking:'',instructions:'Demo event',notes:'',checklist:defaultChecklist.map((text,i)=>({id:'c'+i,text,done:false}))}],personal:[],settings:{defaultChecklist:[...defaultChecklist]}};
let data=load(); let page='home';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(demo)}catch{return structuredClone(demo)}}

// One-time master-checklist migration. Existing event checklists are intentionally untouched.
data.settings = data.settings || {};
if (data.settings.craicChecklistVersion !== 1) {
  data.settings.defaultChecklist = [...CRAIC_MASTER_CHECKLIST];
  data.settings.craicChecklistVersion = 1;
  localStorage.setItem(KEY, JSON.stringify(data));
}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
const $=s=>document.querySelector(s); const uid=p=>p+Date.now()+Math.random().toString(16).slice(2);
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function market(id){return data.markets.find(x=>x.id===id)} function organiser(id){return data.organisers.find(x=>x.id===id)}
function fmtDate(x){if(!x)return'';return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(x+'T12:00:00'))}
function money(x){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(x||0))}
function hoursBetween(a,b){if(!a||!b)return 0;let [ah,am]=a.split(':').map(Number),[bh,bm]=b.split(':').map(Number);let mins=(bh*60+bm)-(ah*60+am);return mins>0?mins/60:0}
function eventNet(e){return Number(e.results?.takings||0)-Number(e.pitchFee||0)-Number(e.results?.travelCost||0)-Number(e.results?.otherCosts||0)}
function eventHourly(e){let h=hoursBetween(e.tradeStart,e.tradeFinish);return h?eventNet(e)/h:0}
function marketStats(mid){let es=data.events.filter(e=>e.marketId===mid&&e.results&&e.results.takings!==''&&e.results.takings!=null);if(!es.length)return null;let vals=es.map(e=>Number(e.results.takings||0));return {count:es.length,avg:vals.reduce((a,b)=>a+b,0)/vals.length,best:Math.max(...vals),worst:Math.min(...vals),avgNet:es.reduce((a,e)=>a+eventNet(e),0)/es.length,avgHourly:es.reduce((a,e)=>a+eventHourly(e),0)/es.length}}

$('#nav').onclick=e=>{if(e.target.dataset.page){page=e.target.dataset.page;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));render()}};
$('#addBtn').onclick=()=>openMarket();
function render(){const a=$('#app'); if(page==='home')a.innerHTML=home(); else if(page==='markets')a.innerHTML=marketsPage(); else if(page==='calendar')a.innerHTML=calendarPage(); else if(page==='applications')a.innerHTML=placeholder('Applications','Cycle 2 will turn this into the application and booking pipeline.'); else if(page==='stock')a.innerHTML=placeholder('Stock','Cycle 3 will use booked markets and historic takings to forecast stock.'); else a.innerHTML=settingsPage(); bind();}
function home(){const upcoming=[...data.events].filter(e=>e.date>=new Date().toISOString().slice(0,10)&&!['Cancelled','Declined','Ignored'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date)); const unpaid=upcoming.filter(e=>['Offered','Booked','Paid'].includes(e.status)&&!e.paid); return `<h2>Dashboard</h2><div class="grid"><div class="card"><div class="muted">Upcoming events</div><div class="stat">${upcoming.length}</div></div><div class="card"><div class="muted">Need paid</div><div class="stat">${unpaid.length}</div></div><div class="card"><div class="muted">Markets stored</div><div class="stat">${data.markets.length}</div></div></div><h3>Next up</h3>${upcoming.slice(0,4).map(eventCard).join('')||'<div class="card empty">Nothing upcoming yet.</div>'}`}
function marketsPage(){return `<div class="row"><div><h2>Markets</h2><div class="muted">Organiser → market → individual event</div></div><button class="primary" data-action="addMarket">+ Add market</button></div><br>${data.markets.map(m=>{const o=organiser(m.organiserId), es=data.events.filter(e=>e.marketId===m.id).sort((a,b)=>a.date.localeCompare(b.date));let st=marketStats(m.id);return `<div class="card"><div class="row"><div><h3>${esc(m.name)}</h3><div class="muted">${esc(m.town)} · ${esc(o?.name||'No organiser')} · ${esc(m.frequency||'No frequency')}</div>${st?`<div class="performance"><b>${st.count} result${st.count===1?'':'s'} · Avg ${money(st.avg)} · Avg net ${money(st.avgNet)} · ${money(st.avgHourly)}/hr</b><div class="muted">Best ${money(st.best)} · Worst ${money(st.worst)}</div></div>`:''}</div><div><button data-action="editMarket" data-id="${m.id}">Edit</button> <button data-action="addEvent" data-id="${m.id}" class="primary">+ Event</button></div></div>${es.length?es.map(eventCard).join(''):'<p class="muted">No event dates yet.</p>'}</div>`}).join('')||'<div class="card empty">No markets yet.</div>'}`}
function eventCard(e){const m=market(e.marketId);return `<div class="card event"><div class="row"><div><b>${esc(m?.name||'Market')}</b><div>${fmtDate(e.date)} · ${esc(e.tradeStart||'?')}–${esc(e.tradeFinish||'?')}</div><span class="badge">${esc(e.status)}</span>${e.paid?'<span class="badge">Paid ✓</span>':'<span class="badge">Unpaid</span>'}${e.results&&e.results.takings!==''&&e.results.takings!=null?`<span class="badge">Takings ${money(e.results.takings)}</span><span class="badge">Net ${money(eventNet(e))}</span>`:''}</div><div><button data-action="editEvent" data-id="${e.id}">Open</button></div></div></div>`}
function calendarPage(){let now=new Date();let y=now.getFullYear(),mo=now.getMonth();let first=new Date(y,mo,1), last=new Date(y,mo+1,0), offset=(first.getDay()+6)%7;let cells='';for(let i=0;i<offset;i++)cells+='<div></div>';for(let d=1;d<=last.getDate();d++){let ds=`${y}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;let es=data.events.filter(e=>e.date===ds);let ps=data.personal.filter(e=>e.date===ds);cells+=`<div class="day"><b>${d}</b>${es.map(e=>`<div class="calitem">${esc(market(e.marketId)?.name||'Market')}</div>`).join('')}${ps.map(e=>`<div class="calitem">${esc(e.title)}</div>`).join('')}</div>`}return `<div class="row"><div><h2>Calendar</h2><div class="muted">${first.toLocaleString('en-GB',{month:'long',year:'numeric'})}</div></div><button data-action="addPersonal">+ Add personal item</button></div><br><div class="calendar">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<b>${x}</b>`).join('')}${cells}</div><p class="muted">Full month navigation and clash detection arrive in the next Cycle 1 pass.</p>`}
function settingsPage(){return `<h2>Settings</h2><div class="card"><h3>Default market checklist</h3><p class="muted">New events copy this list. Editing an event checklist never changes this master list.</p><div id="defaultChecks">${data.settings.defaultChecklist.map((x,i)=>`<div class="row"><span>${esc(x)}</span><button data-action="removeDefault" data-i="${i}">Remove</button></div>`).join('')}</div><br><button data-action="addDefault">+ Add item</button></div><div class="card"><h3>Data</h3><p class="muted">Cycle 1 stores data in this browser so it survives refreshes. Cloud sync can replace this data layer later.</p><button data-action="export">Export backup</button> <button data-action="reset" class="danger">Reset demo data</button></div>`}
function placeholder(t,s){return `<h2>${t}</h2><div class="card empty">${s}</div>`}
function bind(){document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset.id,b.dataset.i))}
function action(a,id,i){if(a==='addMarket')openMarket(); if(a==='editMarket')openMarket(id); if(a==='addEvent')openEvent(null,id); if(a==='editEvent')openEvent(id); if(a==='addPersonal')openPersonal(); if(a==='removeDefault'){data.settings.defaultChecklist.splice(+i,1);save()} if(a==='addDefault'){let x=prompt('Checklist item');if(x){data.settings.defaultChecklist.push(x);save()}} if(a==='export'){let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='market-manager-backup.json';a.click();URL.revokeObjectURL(u)} if(a==='reset'&&confirm('Reset everything back to demo data?')){data=structuredClone(demo);save()}}
function field(label,name,val='',type='text'){return `<div class="field"><label>${label}</label><input type="${type}" name="${name}" value="${esc(val??'')}"></div>`}
function openMarket(id){let m=id?market(id):{}, o=id?organiser(m.organiserId):{};$('#formBody').innerHTML=`<h2>${id?'Edit':'Add'} market</h2><div class="stack">${field('Market name','name',m.name)}<div class="two">${field('Venue','venue',m.venue)}${field('Town / city','town',m.town)}</div>${field('Address / postcode','address',m.address)}<div class="two">${field('Typical frequency','frequency',m.frequency)}${field('Typical pitch fee (£)','typicalFee',m.typicalFee,'number')}</div><div class="field"><label>Indoor / outdoor</label><select name="setting">${['','Indoor','Outdoor','Mixed'].map(x=>`<option ${m.setting===x?'selected':''}>${x}</option>`).join('')}</select></div>${field('Application URL','applicationUrl',m.applicationUrl)}<hr><h3>Organiser</h3>${field('Organiser name','orgName',o.name)}<div class="two">${field('Contact name','contactName',o.contactName)}${field('Email','email',o.email,'email')}</div><div class="two">${field('Phone','phone',o.phone)}${field('Website','website',o.website)}</div>${field('Instagram','instagram',o.instagram)}${field('Facebook','facebook',o.facebook)}<div class="field"><label>Notes</label><textarea name="notes">${esc(m.notes||'')}</textarea></div>${id?'<button type="button" class="danger" id="deleteMarket">Delete market</button>':''}</div>`;$('#modal').showModal();$('#form').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target), oid=o.id||uid('o'), mid=m.id||uid('m');let org={id:oid,name:f.get('orgName'),contactName:f.get('contactName'),email:f.get('email'),phone:f.get('phone'),website:f.get('website'),instagram:f.get('instagram'),facebook:f.get('facebook'),notes:o.notes||''};let nm={id:mid,name:f.get('name'),organiserId:oid,venue:f.get('venue'),town:f.get('town'),address:f.get('address'),frequency:f.get('frequency'),typicalFee:+f.get('typicalFee')||0,setting:f.get('setting'),applicationUrl:f.get('applicationUrl'),notes:f.get('notes')};upsert(data.organisers,org);upsert(data.markets,nm);$('#modal').close();save()};if(id)$('#deleteMarket').onclick=()=>{if(confirm('Delete this market AND all its event dates?')){data.events=data.events.filter(e=>e.marketId!==id);data.markets=data.markets.filter(x=>x.id!==id);$('#modal').close();save()}}}
function upsert(arr,x){let i=arr.findIndex(y=>y.id===x.id);if(i>=0)arr[i]=x;else arr.push(x)}
function openEvent(id,marketId){
  let e=id?data.events.find(x=>x.id===id):{marketId,status:'Interested',paid:false,checklist:CRAIC_MASTER_CHECKLIST.map(x=>({id:uid('c'),text:x,done:false}))};
  let m=market(e.marketId);
  let checklist=structuredClone(e.checklist||[]);

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
    <div class="two">${field('Card (£) - optional','card',e.results?.card??'','number')}${field('Travel / fuel (£)','travelCost',e.results?.travelCost??'','number')}</div>
    ${field('Other event costs (£)','otherCosts',e.results?.otherCosts??'','number')}
    <div class="two"><div class="field"><label>Footfall</label><select name="footfall">${['','Poor','Average','Busy'].map(x=>`<option ${e.results?.footfall===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Weather</label><select name="weather">${['','Poor','OK','Good'].map(x=>`<option ${e.results?.weather===x?'selected':''}>${x}</option>`).join('')}</select></div></div>
    <div class="field"><label>Would you book again?</label><select name="bookAgain">${['','Yes','Maybe','No'].map(x=>`<option ${e.results?.bookAgain===x?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="field"><label>Result notes / context</label><textarea name="resultNotes">${esc(e.results?.notes||'')}</textarea></div>
    ${e.results&&e.results.takings!==''&&e.results.takings!=null?`<div class="result-grid"><div class="metric"><span class="muted">Net after event costs</span><b>${money(eventNet(e))}</b></div><div class="metric"><span class="muted">Trading hours</span><b>${hoursBetween(e.tradeStart,e.tradeFinish).toFixed(1)}</b></div><div class="metric"><span class="muted">Net / hour</span><b>${money(eventHourly(e))}</b></div></div>`:''}
    <h3>Event checklist</h3>
    <div id="checks">${checklist.map(checkRow).join('')}</div>
    <button type="button" id="addCheck">+ Add checklist item</button>
    ${id?'<button type="button" class="danger" id="deleteEvent">Delete event</button>':''}
  </div>`;

  $('#modal').showModal();

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
      results:{takings:f.get('takings'),cash:f.get('cash'),card:f.get('card'),travelCost:f.get('travelCost'),otherCosts:f.get('otherCosts'),footfall:f.get('footfall'),weather:f.get('weather'),bookAgain:f.get('bookAgain'),notes:f.get('resultNotes')}
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
render();
