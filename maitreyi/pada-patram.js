/* भाष्यपदव्याकरणपरिचयः v2 — graded grammar cards (R-029).  Data: runtime/grammar-v2/<unit>.json + common.json.
 * A click on any word of a covered unit opens its card in the study panel; the panel's grammar section becomes an index. */
(function(root){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const deva=s=>String(s??'').replace(/[0-9]/g,c=>'०१२३४५६७८९'[c]);
const LAKARA={'लट्':'वर्तमानकालः','लिट्':'परोक्षभूतकालः','लुट्':'अनद्यतनभविष्यत्कालः','लृट्':'भविष्यत्कालः','लोट्':'आज्ञा/प्रार्थना','लङ्':'अनद्यतनभूतकालः','विधिलिङ्':'विधिः/सम्भावना','लुङ्':'भूतकालः','लृङ्':'हेतुहेतुमद्भावः','आशीर्लिङ्':'आशीः'};
const ISSUE='https://github.com/NKAditya1729/vedantic-archive/issues/new';
const script=document.currentScript,base=new URL('.',script?.src||location.href),cache=new Map();
let manifest=null,hooks={},history=[],current=null;
const get=k=>{try{return JSON.parse(sessionStorage.getItem('gv-'+k));}catch{return null;}};
const put=(k,v)=>{try{sessionStorage.setItem('gv-'+k,JSON.stringify(v));}catch{}};
function json(p){if(!cache.has(p))cache.set(p,fetch(new URL(p,base)).then(r=>{if(!r.ok)throw Error(p);return r.json();}).catch(e=>{cache.delete(p);throw e;}));return cache.get(p);}
const ready=json('runtime/grammar-v2/manifest.json').then(m=>manifest=m).catch(()=>manifest={units:{}});
const uidOf=id=>/^(BU|MK)\./.test(id)?id:'BU.'+id;
async function covers(id){await ready;return !!manifest.units[uidOf(id)];}
async function unit(id){await ready;const uid=uidOf(id);const [u,c]=await Promise.all([json(manifest.units[uid]),json(manifest.common)]);return {u,c,uid};}

// ---------------------------------------------------------------- pieces
const row=(k,v)=>`<tr><th scope="row">${esc(k)}</th><td>${v??'—'}</td></tr>`;
const table=rows=>`<table class="gv-slots"><tbody>${rows.join('')}</tbody></table>`;
const level=(key,title,body,open)=>{const s=get('lv-'+key);const o=s==null?open:s;return `<details class="gv-level" data-gv-level="${key}"${o?' open':''}><summary>${o?'▾':'▸'} ${esc(title)}</summary>${body}</details>`;};
const flagBadge=f=>`<span class="gv-flag gv-flag-${f==='निश्चितम्'?'n':f==='सम्भाव्यम्'?'s':'p'}">[${esc(f)}]</span>`;
const occLink=(oid,label)=>`<a href="#" class="gv-o" data-gv-occ="${esc(oid)}">${esc(label)}</a>`;
function quoteLine(u,sid,oid){
 const toks=sid.includes('.M.')?u.mula_sentences[sid]:Object.keys(u.occ).filter(k=>u.occ[k].sent===sid);
 return toks.map(t=>t===oid?`<b>${esc(u.occ[t].pada)}</b>`:occLink(t,u.occ[t].pada)).join(' ');
}
function junctionLine(u,jid,self){const j=u.junctions[jid];if(!j)return '';
 const pair=`‘${esc(j.l)} ${esc(j.r)}’`,steps=j.steps.map(s=>s[0]).join(' · ');
 let printed='';if(j.status==='विसन्धिः')printed=` — विसन्धिः (मुद्रणे); सन्धौ ‘${esc(j.joined)}’`;else if(j.status==='विकल्पः')printed=' — मुद्रणे वैकल्पिकम् रूपम्';
 return `<a href="#" class="gv-j" data-gv-junction="${esc(jid)}">${pair}</a> — ${esc(j.group)}${j.clause?': '+esc(j.clause):''}${steps?' — '+steps:''}${printed}`;}

// ---------------------------------------------------------------- the card (SPEC-v2 §4)
function cardHTML(u,c,oid){
 const o=u.occ[oid],L=u.lemmas[o.lemma],F=L.forms[o.form]||{},t=F.tags||{},tin=L.cls==='तिङन्तम्',avy=L.cls==='अव्ययम्';
 const freq=L.n?` · अस्मिन् ग्रन्थे ${deva(L.n)} वारम्`:'';
 const head=`<header class="gv-head"><h3 class="gv-word">${esc(o.pada)}</h3><p class="gv-loc">${o.loc}</p><p class="gv-flagline">${flagBadge(o.flag)}${freq}</p></header>`;
 const linga=avy||tin?'—':(String(L.linga||'').startsWith('त्रिलिङ्गम्')?`त्रिलिङ्गम् (अत्र ${esc(t.linga)})`:esc(t.linga||L.linga||'—'));
 const vk=o.vk?`${esc(o.vk[0])} — ${o.vk[1]}${o.vk[2]?` (यथा ${o.vk[2]})`:''}`:'—';
 const rel=o.rel?`${esc(o.rel[0])} — ${o.rel[1]}${o.rel[2]&&u.occ[o.rel[2]]?' '+occLink(o.rel[2],'↗'):''}`:'—';
 const dh=L.dhatu?`${L.dhatu}${L.familiar?' — '+esc(L.familiar):''}`:'—';
 const members=L.members?`${L.members.map(esc).join(' · ')}${L.members_note?' — '+L.members_note:''}`:'—';
 const l1=tin?[row('अर्थः',o.artha),row('धातुः',dh),row('अवयवाः','—'),row('पदजातिः',esc(L.padajati)),row('लकारः · पुरुषः · वचनम्',`${esc(t.lakara)} (${esc(LAKARA[t.lakara]||'')}) · ${esc(t.purusha)} · ${esc(t.vacana)}`),row('प्रयोगः',o.prayoga),row('सम्बन्धः',rel),row('प्रयोगभूमिका','—'),row('कोशः',L.kosha)]
  :[row('अर्थः',o.artha),row('धातुः',['कृदन्तम्','समस्तपदम्'].includes(L.cls)?dh:'—'),row('अवयवाः',L.cls==='समस्तपदम्'?members:'—'),row('पदजातिः',esc(L.padajati)),row('लिङ्गम्',linga),row('विभक्तिः · वचनम्',avy?'—':`${esc(t.vibhakti)} · ${esc(t.vacana)}`),row('विभक्तिः किमर्थम्?',avy?'—':vk),row('सम्बन्धः',rel),row('प्रयोगभूमिका',avy?(o.bhumika||'—'):'—'),row('कोशः',L.kosha)];
 const slotVal=s=>{const k=s.replace('*','');
  if(k==='निष्पत्तिः')return esc(F.nish||L.l2[k]||'—');
  if(k==='विभक्तिप्रत्ययः')return F.vp||'—';
  if(k==='विभक्त्यर्थः')return o.va||'—';
  if(k==='रचनाप्रकारः')return (o.pat||[]).length?o.pat.map(p=>`<a href="#" data-gv-pattern="${esc(p)}">[${esc(c.patterns[p]?.name||p)}]</a>`).join(' · '):'—';
  if(k==='सन्धिः')return (o.j||[]).length?o.j.map(j=>junctionLine(u,j)).join('<br>'):'—';
  if(k==='प्रयोगः'&&!tin)return L.l2[k]||'—';
  return L.l2[k]||'—';};
 const l2=table((u.slots.l2[L.cls]||[]).map(s=>row(s.replace('*',''),slotVal(s))));
 const l3=F.l3?.length?`<table class="gv-l3"><thead><tr><th>रूपम्</th><th>सूत्रम्</th><th>कार्यम्</th></tr></thead><tbody>${F.l3.map(r=>`<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`:`<p>${esc(L.l3note||'प्रक्रिया नास्ति — निपातः अविकारी')}।</p>`;
 const ex=L.ex?.length?table(L.ex.map(([k,v])=>row(k.replace(/<[^>]+>/g,''),v))):'<p>—</p>';
 const others=(L.occ||[]).filter(x=>x!==oid);
 const more=others.length?`<p class="gv-more">अस्मिन् मन्त्रे अन्यत्र: ${others.map(x=>occLink(x,u.occ[x].pada+' ('+(u.occ[x].side==='मूलम्'?'मूलम्':'भाष्यम्')+')')).join(' · ')}</p>`:'';
 const sent=u.sentences[o.sent]?level('sent','वाक्यरचना',sentenceBody(u,c,o.sent,oid),false):'';
 return `<article class="gv-card" data-gv-card="${esc(oid)}">${head}${level('l1','स्तरः १ · पदपरिचयः',table(l1),true)}${level('l2','स्तरः २ · निष्पत्तिः',l2,false)}${level('l3','स्तरः ३ · प्रक्रिया',l3,false)}${level('ex','उदाहरणानि',ex+more,false)}${sent}${footer(oid)}</article>`;
}
function footer(id){return `<footer class="gv-foot"><a href="#" data-gv-pari>परिभाषासूची ↗</a> · <a href="${ISSUE}?title=${encodeURIComponent('व्याकरणपत्रम् '+id)}" target="_blank" rel="noopener">दोषं सूचयतु ↗</a> · <a href="#" data-gv-indices>व्याकरणसूच्यः ↗</a></footer>`;}

// ---------------------------------------------------------------- वाक्यरचनापत्रम् (§7)
function sentenceBody(u,c,sid,oid){const S=u.sentences[sid];if(!S)return '<p>—</p>';
 const n=deva(+sid.match(/s(\d+)$/)[1]),side=sid.includes('.M.')?'मूलम्':'भाष्यम्';
 return `<p class="gv-sent-head">${esc(u.label)} · ${side}, वाक्यम् ${n}</p><p class="gv-sent-text">${quoteLine(u,sid,oid)}</p>${table([row('क्रियापदम् किम्?',S.kriya),...S.rows.filter(([q])=>!q.startsWith('क्रियापदम्')).map(([q,a])=>row(q.replace(/<[^>]+>/g,''),a)),row('पूर्ववाक्यसम्बन्धः',S.purva||'—'),row('दण्डान्वयः',esc(S.anvaya).replace(/\[([^\]]+)\]/g,'<span class="gv-adh">[$1]</span>')),row('वाक्यस्य भूमिका',`${esc(S.role)}${S.role_note?' — '+S.role_note:''}`),row('रचनाप्रकाराः',(S.pat||[]).length?S.pat.map(p=>`<a href="#" data-gv-pattern="${esc(p)}">[${esc(c.patterns[p]?.name||p)}]</a>`).join(' · '):'—')])}<p class="gv-flagline">${flagBadge(S.flag)}</p>`;}

// ---------------------------------------------------------------- सन्धिपत्रम् (§4.7)
function junctionHTML(u,jid){const j=u.junctions[jid];if(!j)return '<p>—</p>';
 const left=u.occ[j.left],n=deva(+(left?.sent||'').match(/s(\d+)$/)?.[1]||0);
 const same=Object.entries(u.junctions).filter(([k,x])=>k!==jid&&x.group===j.group&&x.l!==j.l).slice(0,3);
 const steps=j.steps.length?j.steps.map(s=>`${esc(s[1])} — ${s[0]}`).join('<br>'):'नास्ति';
 const l3=j.steps.length?`<table class="gv-l3"><thead><tr><th>रूपम्</th><th>सूत्रम्</th><th>कार्यम्</th></tr></thead><tbody><tr><td>${esc(j.l)} + ${esc(j.r)}</td><td>—</td><td>पदद्वयम्</td></tr>${j.steps.map(s=>`<tr><td>${esc(s[2])} + ${esc(s[3])}</td><td>${s[0]}</td><td>${esc(s[1])}</td></tr>`).join('')}<tr><td>${esc(j.joined)}</td><td>—</td><td>रूपसिद्धिः</td></tr></tbody></table>`:'<p>प्रक्रिया नास्ति।</p>';
 const printed=j.status==='विसन्धिः'?`विसन्धिः (मुद्रणे) — मूले ‘${esc(j.surface)}’; सन्धौ ‘${esc(j.joined)}’`:j.status==='अवसानम्'?'अवसानम् — विरामः':j.status==='विकल्पः'?`मुद्रणे वैकल्पिकम् रूपम् ‘${esc(j.surface)}’`:`मुद्रणे ‘${esc(j.surface)}’`;
 return `<article class="gv-card gv-junction"><header class="gv-head"><h3 class="gv-word">${esc(j.l)} + ${esc(j.r)} → ${esc(j.joined)}</h3><p class="gv-loc">${esc(u.label)} · ${esc(j.side)}, वाक्यम् ${n} · ${printed}</p><p class="gv-flagline">${flagBadge('निश्चितम्')}</p></header>
 ${table([row('स्तरः १ · नाम',`${esc(j.group)}${j.clause?' — '+esc(j.clause):''}`),row('स्तरः २ · चरणाः',steps),row('वैकल्पिकम्',j.alts?.length?j.alts.map(esc).join(' · '):'नास्ति')])}
 ${level('j3','स्तरः ३ · प्रक्रिया',l3,true)}${level('jex','उदाहरणानि',same.length?`<p>अयम् एव सन्धिः — अत्रैव: ${same.map(([k,x])=>`<a href="#" data-gv-junction="${esc(k)}">${esc(x.l)} + ${esc(x.r)}</a>`).join(' · ')}</p>`:'<p>—</p>',false)}
 <p class="gv-more">पदे: ${occLink(j.left,j.l)} · ${occLink(j.right,j.r)}</p>${footer(jid)}</article>`;}

// ---------------------------------------------------------------- indices
function indexHTML(u,side){
 const occs=Object.entries(u.occ).filter(([,o])=>o.side===side);
 const groups={};for(const [k,j] of Object.entries(u.junctions))if(j.side===side)(groups[j.group]??=[]).push(k);
 const sandhi=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length).map(([g,ks])=>`<details class="gv-ix"><summary>${esc(g)} (${deva(ks.length)})</summary><p>${ks.map(k=>`<a href="#" data-gv-junction="${esc(k)}">${esc(u.junctions[k].l)} + ${esc(u.junctions[k].r)}</a>`).join(' · ')}</p></details>`).join('');
 const sam=occs.filter(([,o])=>u.lemmas[o.lemma].cls==='समस्तपदम्').map(([k,o])=>occLink(k,o.pada)).join(' · ')||'—';
 const by={};for(const [k,o] of occs)(by[o.lemma]??=[]).push(k);
 const pada=Object.entries(by).map(([lid,ks])=>ks.length===1?occLink(ks[0],u.occ[ks[0]].pada):`<details class="gv-ix gv-inline"><summary>${[...new Set(ks.map(k=>u.occ[k].pada))].map(esc).join(' / ')} ×${deva(ks.length)}</summary>${ks.map(k=>occLink(k,u.occ[k].pada+' ('+deva(+u.occ[k].sent.match(/s(\d+)$/)[1])+')')).join(' · ')}</details>`).join(' · ');
 const sents=Object.keys(u.sentences).filter(s=>s.includes(side==='मूलम्'?'.M.':'.B.')).map(s=>`<a href="#" data-gv-sent="${esc(s)}">¶ ${deva(+s.match(/s(\d+)$/)[1])}</a>`).join(' · ');
 const sub=(t,b,open)=>`<details class="study-subsection gv-sub"${open?' open':''}><summary>${t}</summary><div class="study-subsection-content">${b}</div></details>`;
 return `<p class="gv-note">प्रतिपदम् व्याकरणपत्रम् — पाठे यत् किमपि पदम् स्पृशतु, अथवा अत्र चिनोतु।</p>${sub('पदविवरणम्',`<p class="gv-tokens">${pada}</p>`,true)}${sub('सन्धिविवरणम्',sandhi||'—')}${sub('समासः',`<p>${sam}</p>`)}${sub('वाक्यरचना',`<p>${sents}</p>`)}<p class="gv-more"><a href="#" data-gv-indices>व्याकरणसूच्यः ↗</a> · <a href="#" data-gv-pari>परिभाषासूची ↗</a></p>`;}
function indicesHTML(c,u){const ix=c.indices,lab=k=>esc(k.replace(/<[^>]+>/g,''));
 const list=(obj,linker)=>Object.entries(obj).map(([k,ids])=>`<details class="gv-ix"><summary>${linker?linker(k):lab(k)} (${deva(ids.length)})</summary><p>${ids.filter(i=>u.occ[i]).map(i=>occLink(i,u.occ[i].pada)).join(' · ')}</p></details>`).join('');
 const sut=k=>`<a href="${esc(ix['सूत्रलिङ्काः'][k])}" target="_blank" rel="noopener">[${esc(k)}]</a>`;
 return `<section class="gv-indices"><h3>व्याकरणसूच्यः</h3>
 <details class="gv-ix-group" open><summary>बहुवारं दृश्यमानाः शब्दाः</summary><p>${ix['बहुवारं दृश्यमानाः शब्दाः'].map(([w,n])=>`${esc(w)} ×${deva(n)}`).join(' · ')}</p></details>
 <details class="gv-ix-group"><summary>धात्वनुक्रमणी</summary>${list(ix['धात्वनुक्रमणी'],k=>k)}</details>
 <details class="gv-ix-group"><summary>प्रत्ययानुक्रमणी</summary>${list(ix['प्रत्ययानुक्रमणी'])}</details>
 <details class="gv-ix-group"><summary>सूत्रानुक्रमणी</summary>${list(ix['सूत्रानुक्रमणी'],sut)}</details>
 <details class="gv-ix-group"><summary>रचनाप्रकारानुक्रमणी</summary>${Object.entries(c.patterns).map(([pid,p])=>`<details class="gv-ix"><summary>${esc(p.name)}</summary><p>${esc(p.text)} ${p.sutras.join(' · ')}</p><p>${(ix['रचनाप्रकारानुक्रमणी'][pid]||[]).filter(i=>u.occ[i]).map(i=>occLink(i,u.occ[i].pada)).join(' · ')||'—'}</p></details>`).join('')}</details></section>`;}
function paribhashaHTML(c){return `<section class="gv-pari"><h3>परिभाषासूची</h3>${Object.entries(c.paribhasha).map(([g,items])=>`<details class="gv-ix-group" open><summary>${esc(g)}</summary><dl>${items.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>`).join('')}</section>`;}
function patternHTML(c,u,pid){const p=c.patterns[pid];if(!p)return '<p>—</p>';const ids=(c.indices['रचनाप्रकारानुक्रमणी'][pid]||[]).filter(i=>u.occ[i]);
 return `<section class="gv-pari"><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p><p>${p.sutras.join(' · ')||''}</p><p>${ids.map(i=>occLink(i,u.occ[i].pada)).join(' · ')||'—'}</p></section>`;}

// ---------------------------------------------------------------- panel
function show(html,title,uid,state){
 const back=`<nav class="gv-nav">${history.length?'<button data-gv-back>← पूर्वपत्रम्</button>':''}<button data-gv-study="${esc(uid)}">← अध्ययनसाहाय्यम्</button></nav>`;
 if(current)history.push(current);if(history.length>30)history.shift();current=state;
 hooks.openPanel?.(title,back+html);
}
async function openToken(id,tokenIds,{replace=false}={}){
 const {u,c,uid}=await unit(id);
 const ids=tokenIds.filter(t=>u.occ[t]);if(!ids.length)return false;
 const choose=ids.length>1?`<nav class="word-choices gv-choices" aria-label="सन्धिस्थाने पदानि">पदम् — ${ids.map(t=>`<button data-gv-occ="${esc(t)}">${esc(u.occ[t].pada)}</button>`).join(' ')}</nav>`:'';
 if(replace)current=null;
 show(choose+cardHTML(u,c,ids[0]),u.occ[ids[0]].pada+' · व्याकरणपत्रम्',uid,{kind:'occ',uid,id:ids[0]});
 document.querySelectorAll('.gv-marked').forEach(e=>e.classList.remove('gv-marked'));
 document.querySelectorAll(ids.map(t=>`[data-grammar-tokens~="${CSS.escape(t)}"]`).join(',')).forEach(e=>e.classList.add('gv-marked'));
 return true;}
async function openState(s){const {u,c,uid}=await unit(s.uid);
 if(s.kind==='occ')show(cardHTML(u,c,s.id),u.occ[s.id].pada+' · व्याकरणपत्रम्',uid,s);
 else if(s.kind==='j')show(junctionHTML(u,s.id),'सन्धिपत्रम्',uid,s);
 else if(s.kind==='sent')show(`<article class="gv-card">${sentenceBody(u,c,s.id,null)}${footer(s.id)}</article>`,'वाक्यरचनापत्रम्',uid,s);
 else if(s.kind==='ix')show(indicesHTML(c,u),'व्याकरणसूच्यः',uid,s);
 else if(s.kind==='pari')show(paribhashaHTML(c),'परिभाषासूची',uid,s);
 else if(s.kind==='pat')show(patternHTML(c,u,s.id),'रचनाप्रकारः',uid,s);}
async function index(id,side){const {u}=await unit(id);return indexHTML(u,side);}

document.addEventListener('click',async e=>{
 const a=e.target.closest('[data-gv-occ],[data-gv-junction],[data-gv-sent],[data-gv-pari],[data-gv-indices],[data-gv-pattern],[data-gv-back],[data-gv-study],[data-gv-mark]');if(!a)return;
 e.preventDefault();e.stopPropagation();
 const uid=current?.uid||a.closest('[data-gv-unit]')?.dataset.gvUnit||hooks.unit?.();if(!uid&&!a.dataset.gvStudy)return;
 if(a.dataset.gvBack!=null){const prev=history.pop();current=null;if(prev)await openState(prev);return;}
 if(a.dataset.gvStudy){const u=a.dataset.gvStudy;history=[];current=null;hooks.back?.(u.replace(/^BU\./,''));return;}
 if(a.dataset.gvMark){const sid=a.dataset.gvMark;await openState({kind:'sent',uid:uidOf(a.dataset.gvUnit),id:sid});return;}
 const U=uidOf(uid);
 if(a.dataset.gvOcc)await openState({kind:'occ',uid:U,id:a.dataset.gvOcc});
 else if(a.dataset.gvJunction)await openState({kind:'j',uid:U,id:a.dataset.gvJunction});
 else if(a.dataset.gvSent)await openState({kind:'sent',uid:U,id:a.dataset.gvSent});
 else if(a.dataset.gvPari!=null)await openState({kind:'pari',uid:U});
 else if(a.dataset.gvIndices!=null)await openState({kind:'ix',uid:U});
 else if(a.dataset.gvPattern)await openState({kind:'pat',uid:U,id:a.dataset.gvPattern});
},true);
document.addEventListener('toggle',e=>{const d=e.target;if(d.matches?.('details.gv-level')){put('lv-'+d.dataset.gvLevel,d.open);const s=d.querySelector(':scope>summary');if(s)s.textContent=s.textContent.replace(/^[▸▾]/,d.open?'▾':'▸');}},true);

// ¶ after every bhāṣya sentence of a covered unit (opens its वाक्यरचनापत्रम्)
async function markSentences(rootEl){await ready;for(const s of rootEl.querySelectorAll('.bhashya-sentence[id]')){if(s.nextElementSibling?.classList.contains('gv-pilcrow'))continue;const uid=s.id.replace(/\.B\..*$/,'');if(!manifest.units[uid])continue;s.insertAdjacentHTML('afterend',`<button class="gv-pilcrow" data-gv-mark="${esc(s.id)}" data-gv-unit="${esc(uid)}" aria-label="वाक्यरचना" title="वाक्यरचना">¶</button>`);}}
function watch(){const el=document.getElementById('lesson-content');if(!el)return;let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>markSentences(el),60);}).observe(el,{childList:true,subtree:true});markSentences(el);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();

root.PadaPatram={init(h){hooks=h;},covers,openToken,index,ready};
})(window);
