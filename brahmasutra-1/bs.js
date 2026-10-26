/* ब्रह्मसूत्रभाष्यम् — चतुःसूत्री. One unit per page: #BS.0 (अध्यासभाष्यम्), #BS.1.1.1 … #BS.1.1.4. */
(() => {
  const COMMS = [['BM', 'भामती'], ['NY', 'न्यायनिर्णयः'], ['PP', 'पञ्चपादिका'], ['RP', 'भाष्यरत्नप्रभा']];
  const LABEL = Object.fromEntries([...COMMS, ['NM', 'न्यायमाला']]);
  const TABS = [['sangati', 'भाष्यसङ्गतिः'], ['sarala', 'सरलभाष्यव्याख्या'], ['swami', 'स्वामिविवरणम्']];
  const DIG = '०१२३४५६७८९';
  const deva = n => String(n).replace(/\d/g, d => DIG[d]);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bs-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('bs-' + k, JSON.stringify(v)); } catch { /* private mode */ } }
  };
  const state = {
    comms: new Set(store.get('comms', ['RP'])), nm: store.get('nm', false), parshve: store.get('parshve', true),
    ex: store.get('ex', true), pada: store.get('pada', false), script: store.get('script', 'devanagari'),
    size: store.get('size', 20), study: store.get('study', false), tab: store.get('tab', 'sangati'), unit: 'BS.0'
  };
  let index = null, unitData = null;
  const cache = {};
  const load = f => (cache[f] = cache[f] || fetch('data/' + f).then(r => { if (!r.ok) throw new Error(f); return r.json(); }));

  /* ---------- text ---------- */
  const item = x => typeof x === 'string' ? esc(x)
    : `<span class="w${x[2] ? ' m' : ''}"><span class="sj">${esc(x[0])}</span><span class="pd">${esc(x[1])}</span></span>`;
  const sent = (pid, s) => `<span class="s${s.k === 'pratika' ? ' k-P' : ''}" id="s-${pid}-${s.n}">${s.t.map(item).join('')}</span>`;
  const sents = (pid, ss) => ss.map(s => sent(pid, s)).join(' ');
  const ex = (e, label = 'सरलव्याख्या') => `<div class="px"><span class="px-label">${label}</span>${e.html}</div>`;

  function commPara(p) {
    let html = '', done = 0;
    for (const e of p.ex || []) {
      const ss = p.s.filter(s => s.n >= e.from && s.n <= e.to);
      html += `<p class="ctext">${sents(p.id, ss)}</p>` + ex(e);
      done = Math.max(done, e.to);
    }
    const rest = p.s.filter(s => s.n > done);
    if (rest.length) html += `<p class="ctext">${sents(p.id, rest)}</p>` + (state.ex ? '<p class="todo">अस्य भागस्य सरलव्याख्या सज्जीक्रियते।</p>' : '');
    return `<div class="cpara" id="c-${p.id}">${html}</div>`;
  }
  function commBlocks(comms, pid) {
    return COMMS.filter(([k]) => state.comms.has(k)).map(([k, label]) => {
      const ps = (comms[k] || {})[pid] || [];
      if (!ps.length) return '';
      return `<details class="vy-block" open data-side="${k}"><summary>${label}</summary>${ps.map(commPara).join('')}</details>`;
    }).join('');
  }
  const pair = (left, right) => `<div class="pair"><div class="left">${left}</div><div class="right">${right}</div></div>`;

  /* ---------- page ---------- */
  async function render() {
    const status = $('#status'); status.hidden = false;
    let u;
    try { u = await load(state.unit + '.json'); } catch { status.innerHTML = '<p>पाठः न लब्धः। पुनः प्रयतताम्।</p>'; return; }
    const comms = {};
    await Promise.all([...state.comms].map(k => load(`${state.unit}-${k}.json`).then(d => { comms[k] = d; }).catch(() => { comms[k] = {}; })));
    unitData = u;
    let html = `<h1 class="chapter-heading">${esc(u.title)}</h1><p class="chapter-sub">${esc(u.sub)}</p>`;
    const av = u.paras.filter(p => p.kind === 'avatarika');
    for (const p of av) html += pair(`<p class="original avatarika" id="p-${p.id}">${sents(p.id, p.s)}</p>`, commBlocks(comms, p.id));
    if (u.sutra) html += pair(`<div class="mula-box sutra-box" id="p-${u.sutra.id}">${sents(u.sutra.id, u.sutra.s)}<span class="verse-ref">${esc(u.ref)}</span></div>`, '');
    if (state.nm && u.nm.length) html += pair('', `<details class="vy-block nm-block" open><summary>न्यायमाला</summary>${u.nm.map(commPara).join('')}</details>`);
    for (const p of u.paras.filter(p => p.kind !== 'avatarika'))
      html += pair(`<p class="original" id="p-${p.id}">${sents(p.id, p.s)}</p>`, commBlocks(comms, p.id));
    html += pager();
    const content = $('#content');
    content.innerHTML = html;
    transliterate(content);
    status.hidden = true;
    document.title = `${u.title} — ब्रह्मसूत्रभाष्यम्`;
    $('#as-link').href = 'https://advaitasharada.sringeri.net/read/brahmasutra-bhashya/1/' + (u.sutra ? '#' + u.sutra.id : '');
    sidebar(); study();
    store.set('last', state.unit);
  }

  /* ---------- अध्ययनसाहाय्यम् ---------- */
  function study() {
    const box = $('#study');
    box.hidden = !state.study;
    document.body.classList.toggle('study-open', state.study);
    if (!state.study || !unitData) return;
    $('#study-title').textContent = `अध्ययनसाहाय्यम् — ${unitData.title}`;
    $('#study-tabs').innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" aria-pressed="${state.tab === k}">${l}</button>`).join('');
    const secs = (unitData.study || {})[state.tab] || [];
    const note = { sangati: 'भाष्यस्य प्रत्येकं वाक्यं क्रमेण विव्रियते — शङ्करभगवत्पादानां भाष्यं, व्याख्यातॄणां व्याख्यानानि च अनुसृत्य।',
      sarala: 'भाष्यस्य भागशः सङ्ग्रहः सरलसंस्कृतेन।',
      swami: 'पूज्यस्वामिदयानन्दसरस्वतीनां «ब्रह्मसूत्रम् (चतुस्सूत्री)» इति ग्रन्थे यथा भाष्यं विवृतं, तथा सरलसंस्कृतेन सङ्गृहीतम्।' }[state.tab];
    let html = `<p class="study-note">${note}</p>`;
    if (!secs.length) html += '<p class="todo">अयं भागः सज्जीक्रियते।</p>';
    for (const s of secs) {
      const where = s.para ? `<a href="#" data-go="${s.para}" data-n="${s.from || ''}">भाष्ये पश्यतु ↗</a>` : '';
      const refs = (s.refs || []).length ? `<div class="refs">आधारः — ${s.refs.map(r => `<a href="#" data-ref="${r}">${LABEL[r.slice(0, 2)] || r} ${deva(r.replace(/^\D+_C\d+_(S\d+_)?[PQ]0*/, ''))}</a>`).join('')}</div>` : '';
      html += `<div class="sec">${s.head ? `<div class="sec-head"><span>${esc(s.head)}</span>${where}</div>` : ''}${s.html}${refs}</div>`;
    }
    const body = $('#study-body');
    body.innerHTML = html;
    transliterate(box);
  }
  function flash(el) { if (!el) return; el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); }

  /* ---------- navigation ---------- */
  function pager() {
    const i = index.findIndex(x => x.id === state.unit), prev = index[i - 1], next = index[i + 1];
    return `<nav class="unit-pager">${prev ? `<a href="#${prev.id}">← ${esc(prev.short)}</a>` : '<span></span>'}${next ? `<a href="#${next.id}">${esc(next.short)} →</a>` : '<span></span>'}</nav>`;
  }
  function sidebar() {
    $('#unit-list').innerHTML = index.map(x => `<a class="lesson-link${x.id === state.unit ? ' active' : ''}" href="#${x.id}">${esc(x.short)}</a>`).join('');
    transliterate($('#sidebar'));
  }
  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    state.unit = index.some(x => x.id === id) ? id : (index.some(x => x.id === store.get('last')) ? store.get('last') : index[0].id);
    closeMenu();
    render().then(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }

  /* ---------- controls ---------- */
  function chips() {
    $('#chips').innerHTML = '<div class="chip-row"><span>व्याख्याः —</span>' +
      COMMS.map(([k, l]) => `<button data-comm="${k}" aria-pressed="${state.comms.has(k)}">${l}</button>`).join('') +
      `<button data-nm aria-pressed="${state.nm}">न्यायमाला</button></div>` +
      `<div class="chip-row"><button class="ex-chip" data-ex aria-pressed="${state.ex}" title="व्याख्यानां वाक्यशः सरलव्याख्या">सरलव्याख्या</button>` +
      `<button class="parshve" aria-pressed="${state.parshve}" title="भाष्यं वामतः, व्याख्याः दक्षिणतः">पार्श्वे</button>` +
      `<button class="study-chip" data-study aria-pressed="${state.study}">अध्ययनसाहाय्यम्</button></div>`;
    document.body.classList.toggle('parshve', state.parshve);
    document.body.classList.toggle('ex', state.ex);
    transliterate($('#chips'));
  }
  function bindControls() {
    $('#chips').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.comm) { const k = b.dataset.comm; state.comms.has(k) ? state.comms.delete(k) : state.comms.add(k); store.set('comms', [...state.comms]); render(); }
      else if ('nm' in b.dataset) { state.nm = !state.nm; store.set('nm', state.nm); render(); }
      else if ('ex' in b.dataset) { state.ex = !state.ex; store.set('ex', state.ex); render(); }
      else if ('study' in b.dataset) { state.study = !state.study; store.set('study', state.study); study(); }
      else if (b.classList.contains('parshve')) { state.parshve = !state.parshve; store.set('parshve', state.parshve); }
      chips();
    });
    $('#study-close').addEventListener('click', () => { state.study = false; store.set('study', false); chips(); study(); });
    $('#study-tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.tab = b.dataset.tab; store.set('tab', state.tab); study(); $('#study-body').scrollTop = 0; });
    $('#study-body').addEventListener('click', async e => {
      const a = e.target.closest('a'); if (!a) return;
      if (a.dataset.go) { e.preventDefault(); if (innerWidth <= 900) { state.study = false; chips(); study(); } flash(document.getElementById(a.dataset.n ? `s-${a.dataset.go}-${a.dataset.n}` : `p-${a.dataset.go}`)); }
      if (a.dataset.ref) {
        e.preventDefault(); const k = a.dataset.ref.slice(0, 2);
        if (!state.comms.has(k)) { state.comms.add(k); store.set('comms', [...state.comms]); chips(); await render(); }
        if (innerWidth <= 900) { state.study = false; chips(); study(); }
        flash(document.getElementById('c-' + a.dataset.ref));
      }
    });
    const pada = $('#pada-toggle');
    const applyPada = () => { document.body.classList.toggle('pada', state.pada); pada.setAttribute('aria-pressed', state.pada); };
    pada.addEventListener('click', () => { state.pada = !state.pada; store.set('pada', state.pada); applyPada(); });
    applyPada();
    const applySize = () => document.documentElement.style.setProperty('--font-size', state.size + 'px');
    $('#size-down').addEventListener('click', () => { state.size = Math.max(15, state.size - 1); store.set('size', state.size); applySize(); });
    $('#size-up').addEventListener('click', () => { state.size = Math.min(30, state.size + 1); store.set('size', state.size); applySize(); });
    applySize();
    const script = $('#script'); script.value = state.script;
    script.addEventListener('change', () => { state.script = script.value; store.set('script', state.script); chips(); render(); });
    $('#menu').addEventListener('click', () => { const open = !$('#sidebar').classList.contains('open'); $('#sidebar').classList.toggle('open', open); $('#menu').setAttribute('aria-expanded', open); });
    window.addEventListener('hashchange', route);
  }
  function closeMenu() { $('#sidebar').classList.remove('open'); $('#menu').setAttribute('aria-expanded', 'false'); }

  /* display-only transliteration: the data stays in Devanagari */
  function transliterate(root) {
    document.body.dataset.script = state.script;
    if (state.script === 'devanagari' || !window.Sanscript) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) {
      const n = walk.currentNode;
      if (n.parentElement.closest('[data-no-transliterate],select')) continue;
      if (/[ऀ-ॿ]/.test(n.nodeValue)) n.nodeValue = Sanscript.t(n.nodeValue, 'devanagari', state.script);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try { index = await load('index.json'); } catch { $('#status').innerHTML = '<p>अनुक्रमणिका न लब्धा।</p>'; return; }
    bindControls(); chips(); route();
  });
})();
