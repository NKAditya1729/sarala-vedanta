/* मानसोल्लासः. One unit per ullāsa: #MNS.1 … #MNS.10; #MNS.2/7 jumps to kārikā 7, #MNS.2/s to the stotra verse.
   Three layers: the stotra (Śaṅkara), the kārikās (Sureśvara's Mānasollāsa), the ṭīkā (Mānasollāsavardhinī).
   Same reader as vishnu-sahasranama/vsn.js. */
(() => {
  const DIG = '०१२३४५६७८९';
  const deva = n => String(n).replace(/\d/g, d => DIG[d]);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('mns-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('mns-' + k, JSON.stringify(v)); } catch { /* private mode */ } }
  };
  const state = { pada: store.get('pada', false), script: store.get('script', 'devanagari'), size: store.get('size', 20),
    tika: store.get('tika', true), notes: store.get('notes', true), unit: 'MNS.1' };
  let index = null;
  const cache = {};
  const load = f => (cache[f] = cache[f] || fetch('data/' + f + '?v=1').then(r => { if (!r.ok) throw new Error(f); return r.json(); }));

  /* ---------- text ---------- */
  function item(x) {
    if (typeof x === 'string') return esc(x);
    if (!Array.isArray(x)) return `<sup class="fn" data-no-transliterate>${esc(x.n)}</sup>`;   // footnote mark
    const [sj, pd, m, at] = x;
    let h = `<span class="w${m ? ' m' : ''}${at && at.k ? ' pk' : ''}"><span class="sj">${esc(sj)}</span><span class="pd">${esc(pd)}</span></span>`;
    if (at && at.b) h = `<b>${h}</b>`;
    if (at && 'pr' in at) h = `<span class="slip" data-pr="${esc(at.pr || '—')}" title="${at.pr ? 'मुद्रितम् — ' + esc(at.pr) : 'मुद्रिते लुप्तम्; योजितम्'}">${h}</span>`;
    return h;
  }
  const line = l => l.map(item).join('');
  const vlines = b => b.lines.map(l => `<span class="vl">${line(l)}</span>`).join('');
  const pg = b => b.page ? `<span class="pg" data-no-transliterate>पृ. ${deva(b.page - 50)}</span>` : '';

  function block(b, prevPage) {
    const p = b.page && b.page !== prevPage ? pg(b) : '';
    switch (b.kind) {
      case 'title': return `<div class="ul-title">${b.lines.map(l => `<span class="vl">${line(l)}</span>`).join('')}</div>`;
      case 'stotra':
        return `<div class="stotra-box" id="v-s">${p}<span class="layer">श्रीदक्षिणामूर्तिस्तोत्रम् · ${deva(b.vno)}</span>${vlines(b)}</div>`;
      case 'karika': return `<div class="karika-box"${b.vno ? ` id="v-${b.vno}"` : ''}>${p}${vlines(b)}</div>`;
      case 'heading': return `<p class="${b.tk ? 'tk-head tk' : 'm-head'}">${p}${line(b.lines[0])}</p>`;
      case 'lead': return `<p class="m-lead">${line(b.lines[0])}</p>`;
      case 'tika': return `<p class="tika tk">${p}${b.lines.map(line).join(' ')}</p>`;
      case 'tquote': return `<div class="tquote tk">${p}${vlines(b)}</div>`;
      case 'note': return `<div class="notes tk">${b.lines.map(l => `<p>${line(l)}</p>`).join('')}</div>`;
      case 'colophon': return `<p class="colophon${b.tk ? ' tk' : ''}">${b.lines.map(line).join(' ')}</p>`;
      default: return `<p class="tika">${p}${b.lines.map(line).join(' ')}</p>`;
    }
  }

  /* ---------- page ---------- */
  async function render() {
    const status = $('#status'); status.hidden = false;
    let u;
    try { u = await load(state.unit + '.json'); } catch { status.innerHTML = '<p>पाठः न लब्धः। पुनः प्रयतताम्।</p>'; return; }
    let html = `<h1 class="chapter-heading">${esc(u.title)}</h1>${u.sub ? `<p class="chapter-sub">${esc(u.sub)}</p>` : ''}`;
    let page = null, tk = false;
    for (const b of u.blocks) {
      // the ṭīkā passages after each group of kārikās sit in one frame
      const isT = ['tika', 'tquote', 'note'].includes(b.kind) || (b.kind === 'heading' && b.tk);
      if (isT && !tk) html += '<section class="tika-group tk"><p class="tg-label">मानसोल्लासवर्धिनी</p>';
      if (!isT && tk) html += '</section>';
      tk = isT;
      html += block(b, page); if (b.page) page = b.page;
    }
    if (tk) html += '</section>';
    html += pager();
    const content = $('#content');
    content.innerHTML = html;
    transliterate(content);
    status.hidden = true;
    document.title = `${u.title} — मानसोल्लासः`;
    sidebar();
    store.set('last', state.unit);
  }

  /* ---------- navigation ---------- */
  function pager() {
    const i = index.findIndex(x => x.id === state.unit), prev = index[i - 1], next = index[i + 1];
    return `<nav class="unit-pager">${prev ? `<a href="#${prev.id}">← ${esc(prev.short)}</a>` : '<span></span>'}${next ? `<a href="#${next.id}">${esc(next.short)} →</a>` : '<span></span>'}</nav>`;
  }
  function sidebar() {
    $('#unit-list').innerHTML = index.map(x => `<a class="lesson-link${x.id === state.unit ? ' active' : ''}" href="#${x.id}">${esc(x.short)}<small>${esc(x.incipit)}</small></a>` +
      (x.id === state.unit ? `<div class="verse-nav"><a class="st" href="#${x.id}/s">स्तोत्रम्</a>${x.verses.map(v => `<a href="#${x.id}/${v}">${deva(v)}</a>`).join('')}</div>` : '')).join('');
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
      `<button data-tika aria-pressed="${state.tika}" title="टीकां दर्शयतु / केवलं स्तोत्रं वार्तिकं च">टीका</button>` +
      `<button data-notes aria-pressed="${state.notes}" title="सम्पादकस्य पादटिप्पण्यः">पादटिप्पण्यः</button></div>`;
    document.body.classList.toggle('no-tika', !state.tika);
    document.body.classList.toggle('no-notes', !state.notes);
    transliterate($('#chips'));
  }
  function bindControls() {
    $('#chips').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if ('tika' in b.dataset) { state.tika = !state.tika; store.set('tika', state.tika); }
      else if ('notes' in b.dataset) { state.notes = !state.notes; store.set('notes', state.notes); }
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
