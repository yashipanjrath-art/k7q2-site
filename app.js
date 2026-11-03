const VER=' <span class=ver>v14</span>';
'use strict';
const TASKS=[{k:'B',n:'🪥 Brush teeth',c:'#bf5af2',max:2,fg:'#fff'},{k:'W',n:'💧 Water',c:'#0a84ff',max:8,fg:'#fff'},{k:'G',n:'🏋️ Workout',c:'#e5e5ea',max:2,fg:'#000'},{k:'K',n:'💼 Work',c:'#30d5c8',max:1,tick:true}];
const GREEN='#30d158',RED='#ff453a',TR='rgba(255,255,255,.12)',SKEY='habits.v1';
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let S=load(),view='today',viewKey=null,monthPos=null;
function load(){try{const s=JSON.parse(localStorage.getItem(SKEY));if(s&&s.days){const ks=Object.keys(s.days).filter(k=>/^\d{4}-\d\d-\d\d$/.test(k)&&Object.values(s.days[k]).some(v=>v));for(const k of ks)if(!s.start||k<s.start)s.start=k;return s}}catch(e){}return{start:key(new Date()),days:{}}}
function save(){localStorage.setItem(SKEY,JSON.stringify(S))}
function key(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dt(k){const[a,b,c]=k.split('-').map(Number);return new Date(a,b-1,c)}
function add(k,n){const d=dt(k);d.setDate(d.getDate()+n);return key(d)}
function diff(a,b){return Math.round((dt(b)-dt(a))/864e5)}
const TODAY=()=>key(new Date());
function day(k){return S.days[k]||{}}
function setDay(k,f){S=load();const d=Object.assign({},day(k));f(d);S.days[k]=d;if(k<S.start)S.start=k;save();render()}
const KT=d=>Array.isArray(d.KT)?d.KT:[];
const workFrac=d=>{const a=KT(d);if(a.length)return a.filter(x=>x.d).length/a.length;return d.K?1:0};
const frac=(d,t)=>t.tick?workFrac(d):Math.min(1,(d[t.k]||0)/t.max);
const doneT=(d,t)=>frac(d,t)>=1;
let kEdit=null;// {k,i} i=-1 new
function escH(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function workRow(k,d){const a=KT(d),n=a.filter(x=>x.d).length,leg=!a.length&&d.K,t=TASKS[3],cnt=leg?'1/1':n+'/'+a.length,fr=workFrac(d);
 const inp=(i,v)=>`<div class="sk ke"><input class=kin data-k=${k} data-i=${i} maxlength=60 enterkeyhint=done placeholder="Work subtask" value="${escH(v)}"></div>`;
 let h=`<div class="task wkr"><div style="flex:1;margin-right:14px"><div style="display:flex;justify-content:space-between"><span>${t.n}</span><span style="color:${t.c};font-size:15px;font-weight:600">${cnt}</span></div><div class=tb><i style="width:${100*fr}%;background:${t.c}"></i></div></div>${a.length<4&&!(kEdit&&kEdit.k===k&&kEdit.i<0)?`<button class=sbt data-a=kadd data-k=${k} style="background:${t.c};color:#000">+</button>`:'<span style="width:44px"></span>'}</div>`;
 h+='<div class=sks>'+a.map((x,i)=>kEdit&&kEdit.k===k&&kEdit.i===i?inp(i,x.t):`<div class="sk${x.d?' done':''}" data-k=${k} data-i=${i}><span class="tn stx" data-a=kedit data-k=${k} data-i=${i}>${escH(x.t)}</span><button class=c data-a=ktog data-k=${k} data-i=${i}>${x.d?'✓':''}</button></div>`).join('')+(kEdit&&kEdit.k===k&&kEdit.i<0?inp(-1,''):'')+'</div>';
 return h}
function kSave(el){if(!el||el.dataset.done)return;el.dataset.done=1;const k=el.dataset.k,i=+el.dataset.i,v=el.value.trim();kEdit=null;
 setDay(k,d=>{const a=KT(d).map(x=>Object.assign({},x));if(i<0){if(v&&a.length<4){a.push({t:v,d:0});if(!KT(d).length&&d.K)d.K=0}}else if(v)a[i].t=v;d.KT=a})}
function kDel(k,i){setDay(k,d=>{const a=KT(d).slice();a.splice(i,1);d.KT=a})}
const nDone=d=>TASKS.filter(t=>doneT(d,t)).length;
const slips=d=>(d.s?1:0)+(d.g?1:0);
function esc(s){return s}
// rates over keys (only those in range [start..today])
function counted(keys,okToday){const t=TODAY();return keys.filter(k=>(k<t||(k===t&&okToday(day(k)))))}
function taskRate(keys){const c=counted(keys,d=>nDone(d)===4);if(!c.length)return null;return Math.round(100*c.reduce((a,k)=>{const d=day(k);return a+TASKS.reduce((b,t)=>b+frac(d,t),0)},0)/(4*c.length))}
function slipRate(keys){const c=counted(keys,d=>slips(d)>0);if(!c.length)return null;return Math.round(100*c.reduce((a,k)=>a+slips(day(k)),0)/(2*c.length))}
const pct=v=>v==null?'—':v+'%';
function stats(f){const t=TODAY();let tot=0,clean=0,streak=0;const n=diff(S.start,t);
 for(let i=0;i<=n;i++){const k=add(S.start,i),d=day(k);if(d[f])tot++;else if(k<t)clean++}
 if(day(t)[f])streak=0;else{for(let k=add(t,-1);k>=S.start&&!day(k)[f];k=add(k,-1))streak++}
 return{tot,clean,streak,days:n+1}}
// rings
function ringT(d,empty){const all=!empty&&nDone(d)===4,r=12,sw=3.5,sz=32,C=2*Math.PI*r,seg=C/4,gap=3.2,L=seg-gap-sw;
 return `<svg width=${sz} height=${sz}>`+TASKS.map((t,i)=>{const off=-(i*seg+gap/2+sw/2),fr=empty?0:frac(d,t);
 let o=`<circle cx=16 cy=16 r=${r} fill=none stroke="${TR}" stroke-width=${sw} stroke-linecap=round stroke-dasharray="${L.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${off}" transform="rotate(-90 16 16)"/>`;
 if(fr>0)o+=`<circle cx=16 cy=16 r=${r} fill=none stroke="${all?GREEN:t.c}" stroke-width=${sw} stroke-linecap=round stroke-dasharray="${(L*fr).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${off}" transform="rotate(-90 16 16)"/>`;return o}).join('')+'</svg>'}
function ringH(d,empty,sz=32,r=12,sw=3.5){const C=2*Math.PI*r,seg=C/2,gap=3.2,h=sz/2;
 return `<svg width=${sz} height=${sz}>`+['s','g'].map((f,i)=>`<circle cx=${h} cy=${h} r=${r} fill=none stroke="${!empty&&d[f]?RED:TR}" stroke-width=${sw} stroke-linecap=round stroke-dasharray="${(seg-gap-sw).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${-(i*seg+gap/2+sw/2)}" transform="rotate(180 ${h} ${h})"/>`).join('')+'</svg>'}
function cell(k,kind,cls=''){const t=TODAY(),fut=k>t||k<S.start,d=day(k);
 return `<div class="mc ${cls}${k===t?' td':''}">${kind==='t'?ringT(d,fut):ringH(d,fut)}<b>${dt(k).getDate()}</b></div>`}
function monday(k){const w=(dt(k).getDay()+6)%7;return add(k,-w)}
function week(kind){const m=monday(TODAY()),t=TODAY();return '<div class=wk7>'+[...'MTWTFSS'].map((L,i)=>{const k=add(m,i);return `<div><div class="k${k===t?' kt':''}" style="margin-bottom:4px">${L}</div>${cell(k,kind)}</div>`}).join('')+'</div>'}
const weekKeys=()=>{const m=monday(TODAY());return[0,1,2,3,4,5,6].map(i=>add(m,i))};
// hold helpers
const HOLD=new Map();
function header(title,sub,arrows){return `<div class=wrap><div style="display:flex;justify-content:space-between;align-items:center"><h1>${title}</h1>${arrows||''}</div><div class=sub>${sub}</div></div>`}
function arrows(k){const t=TODAY();return `<span class=arw style="margin-left:0"><button data-a=prev data-k=${k}>‹</button><button data-a=next data-k=${k} ${k>=t?'disabled':''}>›</button></span>`}
function fullDate(k){const d=dt(k);return DOW[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]}
function nav(on){return `<button class=nbtn data-a=nav><span class=ar>›</span><div class=nd><i class="${on==0?'on':''}"></i><i class="${on==1?'on':''}"></i></div></button>`}
function slipBtn(k,f,label){const on=day(k)[f];return `<button class="tg hold${on?' on':''}" data-h=slip data-k=${k} data-f=${f}><i class=f></i><span>${on?'Slipped ✓':label||'Hold to slip'}</span></button>`}
// views
function vToday(){const k=TODAY(),d=day(k),s=stats('s'),g=stats('g'),n=nDone(d);
 const bar=(lab,sm,val,w,col)=>`<div style="margin:0 0 9px"><div class=bl><span>${lab}${sm?`<small> · ${sm}</small>`:''}</span><span style="display:flex;align-items:center"><b style="color:${col};font-size:22px">${val}</b></span></div><div class=bar><i style="width:${w}%;background:${col}"></i></div></div>`;
 return `<div class=sb></div>${header('Today',fullDate(k)+VER,arrows(k))}<div class=body><div class=fitwrap>
 <div class=card style="padding:14px 16px 4px">${bar('Tasks today','',n+'/4',n*25,'#8e8e93')}${bar('Smoked','slips / days',s.tot+'/'+s.days,100*s.tot/s.days,RED)}${bar('Gooned','',g.tot+'/'+g.days,100*g.tot/g.days,RED)}</div>
 <div class=lbl>Streaks</div><div class=streaks><div class=s><div class=nm>🚭 No smoking</div><div class=st>Smoking &amp; nicotine</div><div class="d grn">${s.streak}</div><div class=u>days · ${s.clean} total · ${s.tot} slips</div></div><div class=s><div class=nm>🧠 No gooning</div><div class=st>&nbsp;</div><div class="d cyan">${g.streak}</div><div class=u>days · ${g.clean} total · ${g.tot} slips</div></div></div>
 <div class=lbl>Today's tasks</div><div class=card style="padding:2px 16px">${TASKS.map(t=>t.tick?workRow(k,d):
 `<div class=task><div style="flex:1;margin-right:14px"><div style="display:flex;justify-content:space-between"><span>${t.n}</span><span style="color:${t.c};font-size:15px;font-weight:600">${d[t.k]||0}/${t.max}</span></div><div class=tb><i style="width:${100*(d[t.k]||0)/t.max}%;background:${t.c}"></i></div></div><button class=plus data-h=plus data-k=${k} data-t=${t.k} style="background:${t.c};color:${t.fg}">+1</button></div>`).join('')}</div></div></div>${nav(0)}`}
function vPast(k){const d=day(k),t=TODAY(),title=k===add(t,-1)?'Yesterday':(()=>{const x=dt(k);return DOW[x.getDay()].slice(0,3)+' '+x.getDate()+' '+MON[x.getMonth()].slice(0,3)})();
 return `<div class=sb></div>${header(title,fullDate(k)+VER,arrows(k))}<div class=body><div class=fitwrap><div class=lbl>Tasks · ${nDone(d)}/4 done</div><div class=card style="padding:2px 16px">${TASKS.map(tk=>tk.tick?workRow(k,d):
 `<div class=task><div style="flex:1;margin-right:14px"><div style="display:flex;justify-content:space-between"><span>${tk.n}</span><span style="color:${tk.c};font-size:15px;font-weight:600">${d[tk.k]||0}/${tk.max}</span></div><div class=tb><i style="width:${100*(d[tk.k]||0)/tk.max}%;background:${tk.c}"></i></div></div><div class=steps><button class=sbt data-a=minus data-k=${k} data-t=${tk.k}>−</button><button class=sbt data-h=plus data-k=${k} data-t=${tk.k} style="background:${tk.c};color:${tk.fg}">+</button></div></div>`).join('')}</div>
 <div class=lbl>Slips<span style="margin-left:8px;display:inline-flex">${ringH(d,false,24,9,3)}</span></div><div class=card style="padding:2px 16px">${[['s','🚭 Smoked'],['g','🧠 Gooned']].map(([f,n])=>`<div class=task><span>${n}<span style="font-size:13px;color:#8e8e93"> · ${d[f]?'slipped':'clean'}</span></span>${slipBtn(k,f)}</div>`).join('')}</div></div></div>${nav(0)}`}
function vStats(){const t=TODAY(),wk=weekKeys(),s=stats('s'),g=stats('g'),d=day(t);
 const sk=(ic,nm,o,col)=>`<div class="card sk"><div style="font-size:17px;font-weight:700">${ic} ${nm}</div><div style="display:flex;align-items:center;gap:10px;margin-top:6px"><div style="width:118px"><span style="font-size:40px;font-weight:700;line-height:.9;color:${col}">${o.streak}</span><span style="font-size:12px;color:#8e8e93;margin-left:6px;display:inline-block;line-height:1.1">day<br>streak</span></div><div class=srow><div class=mini><div class=v>${o.clean}</div><div class=k>Total clean</div></div><div class=mini><div class=v style="color:${RED}">${o.tot}</div><div class=k>Slips</div></div></div></div></div>`;
 const sb=(f,lab)=>`<div class="hold${d[f]?' on':''}" data-h=slip data-k=${t} data-f=${f}><i class=f></i><span>${lab}</span><em>${d[f]?'slipped today':'hold 3s'}</em></div>`;
 return `<div class=sb></div><div class=wrap><h1>Statistics</h1></div><div class=body><div class=fitwrap>
 <div class=card data-a=tmonth><div class=hd><b>Tasks · This week completion</b><span class=p style="color:${GREEN}">${pct(taskRate(wk))}</span></div>${week('t')}</div>
 <div class=card data-a=hmonth><div class=hd><b>Bad habits · This week slip rate</b><span class=p>${pct(slipRate(wk))}</span></div>${week('h')}</div>
 ${sk('🚭','No smoking',s,'#a3f94c')}${sk('🧠','No gooning',g,'#5ef0e5')}
 <div class=slipbar>${sb('g','🧠 Gooned')}${sb('s','🚭 Smoked')}</div>
 <div class=io><button data-a=export>Export backup</button><button data-a=import>Import</button></div></div></div>${nav(1)}`}
function months(){const t=TODAY(),a=dt(S.start<t?S.start:t),b=dt(t);const out=[];let y=a.getFullYear(),m=a.getMonth();const ey=b.getFullYear(),em=b.getMonth()+1;
 while(y<ey||(y===ey&&m<=em)){out.push([y,m]);m++;if(m>11){m=0;y++}}
 if(out.length<3){const[y0,m0]=out[0];out.unshift(m0?[y0,m0-1]:[y0-1,11])}return out}
function vMonth(kind){const t=TODAY(),ms=months(),cur=monday(t);
 const html=ms.map(([y,m])=>{const first=new Date(y,m,1),lead=(first.getDay()+6)%7,n=new Date(y,m+1,0).getDate();let cells=Array(lead).fill('<div></div>'),rows='';
  for(let i=1;i<=n;i++){const k=key(new Date(y,m,i));cells.push(cell(k,kind));if(cells.length===7||i===n){while(cells.length<7)cells.push('<div></div>');const wkRow=cells.some((c,j)=>{return false});const rowFirst=key(new Date(y,m,i-((cells.filter(c=>c!=='<div></div>').length)-1)));rows+=`<div class="row${monday(rowFirst)===cur?' wk':''}">${cells.join('')}</div>`;cells=[]}}
  return `<div class=mblk data-y=${y} data-m=${m}><div class=mh>${MON[m]} ${y}</div>${rows}</div>`}).join('');
 return `<div class=sb></div><div class=wrap><h1>Statistics</h1><div class=sub>${kind==='t'?'Tasks':'Bad habits'}</div></div><div class=dh>${[...'MTWTFSS'].map(x=>`<div>${x}</div>`).join('')}</div>
 <div class=mscroll data-a=close>${html}</div><div class=pc><span id=mst></span><b id=msv></b></div>${nav(1)}`}
function monthStat(kind,y,m){const n=new Date(y,m+1,0).getDate(),keys=[...Array(n)].map((_,i)=>key(new Date(y,m,i+1)));
 const el=document.getElementById('mst'),ev=document.getElementById('msv');if(!el)return;
 if(kind==='t'){el.textContent=MON[m]+' completion';ev.textContent=pct(taskRate(keys));ev.style.color=GREEN}else{el.textContent=MON[m]+' slip rate';ev.textContent=pct(slipRate(keys));ev.style.color='#fff'}}
function fit(app){const b=app.querySelector('.body');if(!b||view==='tmonth'||view==='hmonth')return;const w=b.querySelector('.fitwrap');if(!w)return;w.style.zoom=1;const avail=b.clientHeight-parseFloat(getComputedStyle(b).paddingBottom)-parseFloat(getComputedStyle(b).paddingTop),need=w.scrollHeight;if(need>avail)w.style.zoom=Math.max(.6,avail/need-.02)}
addEventListener('resize',()=>fit(document.getElementById('app')));
function render(anim){S=load();const app=document.getElementById('app');const keepScroll=app.querySelector('.body,.mscroll');const st=keepScroll?keepScroll.scrollTop:0;
 let h,cls='view'+((view==='today'||view==='past')?' v-day':'');
 if(view==='today')h=vToday();else if(view==='past')h=vPast(viewKey);else if(view==='stats')h=vStats();else h=vMonth(view==='tmonth'?'t':'h');
 app.innerHTML=`<div class="${cls}${anim?' '+anim:''}">${h}</div>`;
 const sc=app.querySelector('.body,.mscroll');fit(app);
 if(view==='tmonth'||view==='hmonth'){const kind=view==='tmonth'?'t':'h',blocks=[...sc.querySelectorAll('.mblk')];
  if(monthPos==null){const tb=sc.querySelector('.td');const row=tb&&tb.closest('.row');sc.scrollTop=row?Math.max(0,row.offsetTop-sc.offsetTop-150):0;monthPos=1}else sc.scrollTop=st;
  const upd=()=>{let cur=blocks[0];const top=sc.scrollTop+sc.clientHeight*0.35;for(const b of blocks){if(b.offsetTop-sc.offsetTop<=top)cur=b}monthStat(kind,+cur.dataset.y,+cur.dataset.m)};
  sc.addEventListener('scroll',upd,{passive:true});upd()}
 else if(!anim&&sc)sc.scrollTop=st}
// events
function act(a,el){const t=TODAY();
 if(a==='nav'){view=view==='today'?'stats':'today';monthPos=null;render()}
 else if(a==='prev'){const k=add(el.dataset.k,-1);view='past';viewKey=k;render('inL')}
 else if(a==='next'){const k=add(el.dataset.k,1);if(k>=t){view='today';render('inR')}else{viewKey=k;view='past';render('inR')}}
 else if(a==='tmonth'||a==='hmonth'){view=a;monthPos=null;render()}
 else if(a==='close'){view='stats';render()}
 else if(a==='kadd'){const ae=document.activeElement;if(ae&&ae.classList.contains('kin'))kSave(ae);kEdit={k:el.dataset.k,i:-1};render();focusK()}
 else if(a==='kedit'){kEdit={k:el.dataset.k,i:+el.dataset.i};render();focusK()}
 else if(a==='ktog'){const i=+el.dataset.i;setDay(el.dataset.k,d=>{const x=KT(d).map(y=>Object.assign({},y));if(x[i])x[i].d=x[i].d?0:1;d.KT=x})}
 else if(a==='minus'){setDay(el.dataset.k,d=>{d[el.dataset.t]=Math.max(0,(d[el.dataset.t]||0)-1)})}
 else if(a==='export'){const js=JSON.stringify(S,null,1),nm='habits-backup-'+t+'.json';const dl=()=>{const b=new Blob([js],{type:'application/json'});const u=URL.createObjectURL(b),x=document.createElement('a');x.href=u;x.download=nm;document.body.appendChild(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)};let f=null;try{f=new File([js],nm,{type:'application/json'})}catch(e){}if(f&&navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Habits backup'}).catch(e=>{if(e&&e.name!=='AbortError')dl()})}else dl()}
 else if(a==='import'){const i=document.createElement('input');i.type='file';i.accept='application/json,.json,text/plain';i.onchange=()=>{const f=i.files[0];if(!f)return;f.text().then(s=>{try{const o=JSON.parse(s);if(!o||!o.days||!o.start)throw 0;if(confirm('Replace all data with this backup?')){S=o;save();render()}}catch(e){alert('Not a valid backup file')}})};i.click()}}
let hold=null,sw=null;
function focusK(){const i=document.querySelector('.kin');if(i){i.focus();const n=i.value.length;try{i.setSelectionRange(n,n)}catch(e){}}}
document.addEventListener('keydown',e=>{if(e.target.classList&&e.target.classList.contains('kin')&&e.key==='Enter'){e.preventDefault();kSave(e.target)}});
document.addEventListener('focusout',e=>{if(e.target.classList&&e.target.classList.contains('kin'))setTimeout(()=>kSave(e.target),0)});
function goDay(n){const t=TODAY(),cur=view==='past'?viewKey:t,k=add(cur,n);if(k>t)return;if(k===t){view='today';render('inR')}else{view='past';viewKey=k;render(n<0?'inL':'inR')}}
let noClick=0,lastT=0;
function swS(x,y,t){const sk=t&&t.closest&&t.closest('.sk[data-i]');sw={x,y,nb:!!(t&&t.closest&&t.closest('.nbtn')),sk}}
function swM(x,y){if(!sw)return;if(sw.sk){const dx=Math.min(0,x-sw.x);if(Math.abs(x-sw.x)>Math.abs(y-sw.y)){sw.sk.style.transition='none';sw.sk.style.transform=`translateX(${dx}px)`;sw.sk.style.background=dx<-80?'#ff453a33':''}return}if(hold&&Math.hypot(x-sw.x,y-sw.y)>15){clearTimeout(hold.tm);if(hold.el)hold.el.classList.remove('go');hold=null}}
function swE(x,y){if(!sw)return;if(sw.sk){const r=sw.sk,dx=x-sw.x,dy=y-sw.y;sw=null;if(Math.abs(dx)>10)noClick=Date.now();if(dx<-80&&Math.abs(dx)>Math.abs(dy)){r.style.transition='transform .2s,opacity .2s';r.style.transform='translateX(-110%)';r.style.opacity=0;const k=r.dataset.k,i=+r.dataset.i;setTimeout(()=>kDel(k,i),200)}else{r.style.transition='transform .2s';r.style.transform=''}return}const dx=x-sw.x,dy=y-sw.y,nb=sw.nb;sw=null;const hz=Math.abs(dx)>40&&Math.abs(dx)>1.5*Math.abs(dy);if(!hz)return;noClick=Date.now();if(hold){clearTimeout(hold.tm);if(hold.el)hold.el.classList.remove('go');hold=null}
 if(nb){if(view==='today'&&dx<0){view='stats';monthPos=null;render('inR')}else if(view==='stats'&&dx>0){view='today';render('inL')}else if(view==='past'){view='today';render(dx>0?'inL':'inR')}return}
 if(view==='today'||view==='past'){if(dx>0)goDay(-1);else if(view==='past')goDay(1);else{view='stats';monthPos=null;render('inR')}}else if(view==='stats'&&dx>0){view='today';render('inL')}else if((view==='tmonth'||view==='hmonth')&&dx>0){view='stats';render('inL')}}
document.addEventListener('touchstart',e=>{lastT=Date.now();const t=e.touches[0];if(e.touches.length===1)swS(t.clientX,t.clientY,e.target);else sw=null},{passive:true,capture:true});
document.addEventListener('touchmove',e=>{lastT=Date.now();const t=e.touches[0];if(!t)return;swM(t.clientX,t.clientY);if(sw){const dx=t.clientX-sw.x,dy=t.clientY-sw.y;if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)&&e.cancelable)e.preventDefault()}},{passive:false,capture:true});
document.addEventListener('touchend',e=>{lastT=Date.now();const t=e.changedTouches[0];if(t)swE(t.clientX,t.clientY)},{passive:true,capture:true});
document.addEventListener('touchcancel',e=>{lastT=Date.now();const t=e.changedTouches[0];if(t)swE(t.clientX,t.clientY);sw=null},{passive:true,capture:true});
const viaTouch=e=>e.pointerType==='touch'||Date.now()-lastT<800;
document.addEventListener('pointerdown',e=>{if(!viaTouch(e))swS(e.clientX,e.clientY,e.target)},true);
document.addEventListener('pointermove',e=>{if(!viaTouch(e))swM(e.clientX,e.clientY)},true);
document.addEventListener('pointerup',e=>{if(!viaTouch(e))swE(e.clientX,e.clientY)},true);
function startHold(el,e){const h=el.dataset.h,k=el.dataset.k;
 if(h==='slip'){el.classList.add('go');hold={el,tm:setTimeout(()=>{hold=null;setDay(k,d=>{d[el.dataset.f]=d[el.dataset.f]?0:1});if(navigator.vibrate)navigator.vibrate(30)},3000),slip:1}}
 else if(h==='tick'){hold={el,fired:false,tm:0}}
 else{hold={el,fired:false,tm:setTimeout(()=>{hold.fired=true;setDay(k,d=>{if(h==='tick')d.K=0;else d[el.dataset.t]=0});if(navigator.vibrate)navigator.vibrate(20)},600)}}}
function endHold(cancel){if(!hold)return;const{el,tm,fired,slip}=hold;clearTimeout(tm);hold=null;
 if(slip){el.classList.remove('go');return}
 if(fired||cancel)return;const k=el.dataset.k;
 if(el.dataset.h==='tick')setDay(k,d=>{d.K=d.K?0:1});
 else{const tk=TASKS.find(x=>x.k===el.dataset.t);setDay(k,d=>{d[tk.k]=Math.min(tk.max,(d[tk.k]||0)+1)})}}
document.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-h]');if(h){e.preventDefault();startHold(h,e)}},{passive:false});
document.addEventListener('pointerup',()=>endHold(false));
document.addEventListener('pointercancel',()=>{if(hold&&hold.slip)endHold(true);else endHold(false)});
addEventListener('storage',e=>{if(e.key===SKEY)render()});addEventListener('pageshow',()=>render());addEventListener('focus',()=>render());
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('click',e=>{if(e.target.closest('[data-h]'))return;if(Date.now()-noClick<400&&e.target.closest('.nbtn,.sk'))return;const a=e.target.closest('[data-a]');if(a)act(a.dataset.a,a)});
// midnight rollover
let lastDay=TODAY();
function tick(){const t=TODAY();if(t!==lastDay){lastDay=t;if(view==='past'&&viewKey>=t)view='today';render()}}
setInterval(tick,20000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();render()}});
{const h=location.hash.slice(1);if(['stats','tmonth','hmonth'].includes(h))view=h}
render();

if('serviceWorker' in navigator){let rl=0;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(rl)return;rl=1;location.reload()});navigator.serviceWorker.getRegistration().then(r=>r&&r.update());document.addEventListener('visibilitychange',()=>{if(!document.hidden)navigator.serviceWorker.getRegistration().then(r=>r&&r.update())})}
