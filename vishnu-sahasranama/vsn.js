/* विष्णुसहस्रनामभाष्यम्. One unit per page: #VSN.0 (पूर्वभागः), #VSN.1 … #VSN.10 (शतानि), #VSN.11 (उत्तरभागः); #VSN.3/४० jumps to a verse. */
(() => {
  const DIG = '०१२३४५६७८९';
  const deva = n => String(n).replace(/\d/g, d => DIG[d]);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('vsn-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('vsn-' + k, JSON.stringify(v)); } catch { /* private mode */ } }
  };
  const state = { pada: store.get('pada', false), script: store.get('script', 'devanagari'), size: store.get('size', 20),
    bhashya: store.get('bhashya', true), print: store.get('print', false), unit: 'VSN.0', verse: null };
  let index = null;
  const cache = {};
  const load = f => (cache[f] = cache[f] || fetch('data/' + f + '?v=1').then(r => { if (!r.ok) throw new Error(f); return r.json(); }));

  /* ---------- text ---------- */
  function item(x) {
    if (typeof x === 'string') return esc(x);
    const [sj, pd, m, at] = x;
    let h = `<span class="w${m ? ' m' : ''}"><span class="sj">${esc(sj)}</span><span class="pd">${esc(pd)}</span></span>`;
    if (at && at.b) h = `<b>${h}</b>`;
    if (at && 'pr' in at) h = `<span class="slip" data-pr="${esc(at.pr || '—')}" title="${at.pr ? 'मुद्रितम् — ' + esc(at.pr) : 'मुद्रिते लुप्तम्; योजितम्'}">${h}</span>`;
    return h;
  }
  const line = l => l.map(item).join('');
  const vlines = b => b.lines.map(l => `<span class="vl">${line(l)}</span>`).join('');
  const pg = b => b.page ? `<span class="pg" data-no-transliterate>पृ. ${deva(b.page)}</span>` : '';

  function block(b, prevPage) {
    const p = b.page && b.page !== prevPage ? pg(b) : '';
    switch (b.kind) {
      case 'title': return `<p class="title-line">${line(b.lines[0])}</p>`;
      case 'tradhead': return `<p class="trad-head">${line(b.lines[0])}<small>पाठपरम्परातः — भाष्यमुद्रणे नास्ति</small></p>`;
      case 'mula':
        return `<div class="mula-box" id="v-${b.vno || b.id}">${p}${b.speaker ? `<span class="uvaca">${esc(b.speaker)}</span>` : ''}${vlines(b)}</div>`;
      case 'verse': return `<div class="verse-box${b.trad ? ' trad' : ''}">${p}${vlines(b)}</div>`;
      case 'quote': return `<div class="quote bh">${p}${vlines(b)}</div>`;
      case 'right': return `<p class="right-line bh">${line(b.lines[0])}</p>`;
      case 'colophon': return `<p class="colophon">${line(b.lines[0])}</p>`;
      default: return `<p class="original${b.trad ? '' : ' bh'}">${p}${b.lines.map(line).join(' ')}</p>`;
    }
  }

  /* ---------- page ---------- */
  async function render() {
    const status = $('#status'); status.hidden = false;
    let u;
    try { u = await load(state.unit + '.json'); } catch { status.innerHTML = '<p>पाठः न लब्धः। पुनः प्रयतताम्।</p>'; return; }
    let html = `<h1 class="chapter-heading">${esc(u.title)}</h1>${u.sub ? `<p class="chapter-sub">${esc(u.sub)}</p>` : ''}`;
    let page = null;
    for (const b of u.blocks) { html += block(b, page); if (b.page) page = b.page; }
    html += pager();
    const content = $('#content');
    content.innerHTML = html;
    transliterate(content);
    status.hidden = true;
    document.title = `${u.title} — विष्णुसहस्रनामभाष्यम्`;
    sidebar();
    store.set('last', state.unit);
  }

  /* ---------- navigation ---------- */
  function pager() {
    const i = index.findIndex(x => x.id === state.unit), prev = index[i - 1], next = index[i + 1];
    return `<nav class="unit-pager">${prev ? `<a href="#${prev.id}">← ${esc(prev.short)}</a>` : '<span></span>'}${next ? `<a href="#${next.id}">${esc(next.short)} →</a>` : '<span></span>'}</nav>`;
  }
  function sidebar() {
    $('#unit-list').innerHTML = index.map(x => `<a class="lesson-link${x.id === state.unit ? ' active' : ''}" href="#${x.id}">${esc(x.short)}</a>` +
      (x.id === state.unit && x.verses.length ? `<div class="verse-nav">${x.verses.map(v => `<a href="#${x.id}/${v}">${deva(v)}</a>`).join('')}</div>` : '')).join('');
    transliterate($('#sidebar'));
  }
  function route() {
    const [id, v] = decodeURIComponent(location.hash.slice(1)).split('/');
    const known = x => index.some(u => u.id === x);
    const next = known(id) ? id : (known(store.get('last')) ? store.get('last') : index[0].id);
    closeMenu();
    const same = next === state.unit && $('#content').innerHTML;
    state.unit = next;
    (same ? Promise.resolve() : render()).then(() => {
      const el = v && document.getElementById('v-' + v);
      if (el) { el.scrollIntoView({ block: 'start', behavior: same ? 'smooth' : 'instant' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); }
      else if (!same) window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

  /* ---------- controls ---------- */
  function chips() {
    $('#chips').innerHTML = '<div class="chip-row">' +
      `<button data-bh aria-pressed="${state.bhashya}" title="भाष्यं दर्शयतु / केवलं मूलम्">भाष्यम्</button>` +
      `<button data-print aria-pressed="${state.print}" title="शोधितस्थलेषु मुद्रितपाठं दर्शयतु">मुद्रितपाठः</button></div>`;
    document.body.classList.toggle('no-bhashya', !state.bhashya);
    document.body.classList.toggle('show-print', state.print);
    transliterate($('#chips'));
  }
  function bindControls() {
    $('#chips').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if ('bh' in b.dataset) { state.bhashya = !state.bhashya; store.set('bhashya', state.bhashya); }
      else if ('print' in b.dataset) { state.print = !state.print; store.set('print', state.print); }
      chips();
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
