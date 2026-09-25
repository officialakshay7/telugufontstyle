/* generator.js — Telugu font style engine */
document.addEventListener('DOMContentLoaded', () => {
  const inp    = document.getElementById('inputText');
  const grid   = document.getElementById('fontGrid');
  const prevBtn= document.getElementById('prevPage');
  const nextBtn= document.getElementById('nextPage');
  const curEl  = document.getElementById('curPage');
  const totEl  = document.getElementById('totPages');
  const cntEl  = document.getElementById('styleCount');
  if (!inp || !grid) return;

  /* ── BASE FONTS — every font below supports the Telugu script on Google Fonts ── */
  const BASE = [
    {n:'రామభద్ర',          f:'Ramabhadra',            t:'display'},
    {n:'మండలి',            f:'Mandali',               t:'sans'},
    {n:'ఎన్టీఆర్',          f:'NTR',                   t:'calli'},
    {n:'గురజాడ',          f:'Gurajada',              t:'calli'},
    {n:'నోటో సాన్స్',        f:'Noto Sans Telugu',      t:'sans'},
    {n:'పొన్నాల',           f:'Ponnala',               t:'display'},
    {n:'సురవరం',           f:'Suravaram',             t:'calli'},
    {n:'టిరో తెలుగు',        f:'Tiro Telugu',           t:'serif'},
    {n:'బాలూ తమ్ముడు',      f:'Baloo Tammudu 2',       t:'display'},
    {n:'హింద్ గుంటూరు',      f:'Hind Guntur',           t:'sans'},
    {n:'లక్కిరెడ్డి',          f:'Lakki Reddy',           t:'calli'},
    {n:'రవి ప్రకాష్',        f:'Ravi Prakash',          t:'display'},
    {n:'పెద్దన',            f:'Peddana',               t:'serif'},
    {n:'అనేక్',             f:'Anek Telugu',           t:'sans'},
    {n:'నాట్స్',            f:'NATS',                  t:'calli'},
    {n:'ధూర్జటి',           f:'Dhurjati',              t:'display'},
    {n:'శ్రీ కృష్ణదేవరాయ',   f:'Sree Krushnadevaraya',  t:'serif'},
    {n:'మల్లన్న',            f:'Mallanna',              t:'sans'},
    {n:'గిడుగు',            f:'Gidugu',                t:'display'},
    {n:'సిరివెన్నెల',         f:'Sirivennela',           t:'calli'},
    {n:'సురన్న',            f:'Suranna',               t:'serif'},
    {n:'తిమ్మన',            f:'Timmana',               t:'display'},
    {n:'తెనాలి రామకృష్ణ',    f:'Tenali Ramakrishna',    t:'sans'},
    {n:'రామరాజ',           f:'Ramaraja',              t:'serif'},
    {n:'ఆకాయ తెలివిగల',     f:'Akaya Telivigala',      t:'display'},
    {n:'చతుర',             f:'Chathura',              t:'sans'},
    {n:'నోటో సెరిఫ్',        f:'Noto Serif Telugu',     t:'serif'},
  ];

  const EFFECTS = [
    {k:'3d',      cls:'style-3d',        suffix:' 3D',      on:['Ramabhadra','NTR','Baloo Tammudu 2','Ponnala','NATS','Ravi Prakash','Gidugu','Dhurjati','Akaya Telivigala']},
    {k:'shadow',  cls:'style-shadow',    suffix:' Shadow',  on:['Mandali','Hind Guntur','Anek Telugu','Noto Sans Telugu','Gurajada','Suravaram','Mallanna','Timmana','Sirivennela']},
    {k:'outline', cls:'style-outline',   suffix:' Outline', on:['Ramabhadra','NTR','Baloo Tammudu 2','NATS','Ponnala','Ravi Prakash','Akaya Telivigala','Dhurjati']},
    {k:'hearts',  cls:'style-hearts',    suffix:' ♥',       on:['Gurajada','Lakki Reddy','Sirivennela','Suravaram','Tenali Ramakrishna','Timmana','Akaya Telivigala','Ravi Prakash']},
    {k:'stars',   cls:'style-stars',     suffix:' ★',       on:['Gurajada','Lakki Reddy','Sirivennela','Suravaram','Tenali Ramakrishna','Timmana','Ponnala','Baloo Tammudu 2']},
    {k:'brackets',cls:'style-brackets',  suffix:' 【】',    on:['Noto Sans Telugu','Hind Guntur','Mandali','Anek Telugu','Chathura','Mallanna','Ramabhadra','Gidugu']},
    {k:'under',   cls:'style-underline', suffix:' Line',    on:['Hind Guntur','Mandali','Noto Serif Telugu','Tiro Telugu','Peddana','Suranna','Mallanna','Ramaraja']},
    {k:'bold',    cls:'style-bold',      suffix:' Bold',    on:['Noto Sans Telugu','Hind Guntur','Anek Telugu','Mandali','Noto Serif Telugu','Chathura','Tenali Ramakrishna','Mallanna']},
    {k:'italic',  cls:'style-italic',    suffix:' Italic',  on:['Tiro Telugu','Noto Serif Telugu','Peddana','Ramaraja','Suranna','Sree Krushnadevaraya','Mandali','Hind Guntur']},
  ];

  /* Build full styles list */
  const STYLES = [];
  BASE.forEach(b => STYLES.push({lbl:b.n, fam:b.f, cls:'', tag:b.t}));
  EFFECTS.forEach(e => {
    BASE.filter(b => e.on.includes(b.f)).forEach(b => {
      STYLES.push({lbl:b.n+e.suffix, fam:b.f, cls:e.cls, tag:'effect'});
    });
  });

  const PER = 12;
  let page = 1;
  const tot = () => Math.ceil(STYLES.length / PER);
  const loaded = new Set();

  if (cntEl) cntEl.textContent = STYLES.length;

  function loadFont(fam) {
    if (loaded.has(fam)) return;
    loaded.add(fam);
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fam) + '&display=swap';
    document.head.appendChild(l);
  }

  /* English → Telugu (phonetic) using the shared engine in /assets/js/translit.js */
  const DEFAULT_TEXT = 'అందమైన తెలుగు';
  function getText() {
    var raw = inp.value.trim();
    if (!raw) return DEFAULT_TEXT;
    var T = window.TeluguTranslit;
    if (!T || T.hasTelugu(raw) || !/[A-Za-z]/.test(raw)) return raw;
    return T.toTelugu(raw) || raw;
  }

  const TAG_LABELS = {display:'Display', serif:'Serif', sans:'Sans', calli:'Calligraphy', effect:'Effect'};

  function render() {
    grid.classList.remove('loading');
    grid.innerHTML = '';
    const t = getText();
    const slice = STYLES.slice((page-1)*PER, page*PER);

    slice.forEach(s => {
      loadFont(s.fam);
      const card = document.createElement('div');
      card.className = 'font-card';

      const meta = document.createElement('div'); meta.className = 'fc-meta';
      const nm = document.createElement('span'); nm.className = 'fc-name'; nm.textContent = s.lbl;
      const tg = document.createElement('span'); tg.className = `fc-tag ${s.tag}`; tg.textContent = TAG_LABELS[s.tag] || s.tag;
      meta.append(nm, tg);

      const prev = document.createElement('div');
      prev.className = 'fc-preview' + (s.cls ? ' '+s.cls : '');
      prev.style.fontFamily = `'${s.fam}', sans-serif`;
      prev.textContent = t;

      const btns = document.createElement('div'); btns.className = 'fc-btns';

      /* Copy */
      const cpBtn = mkBtn('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy');
      cpBtn.onclick = async () => {
        const cur = getText(); /* always use the text currently in the box */
        try { await navigator.clipboard.writeText(cur); }
        catch { const ta=document.createElement('textarea');ta.value=cur;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta); }
        cpBtn.classList.add('copied'); cpBtn.textContent = '✓ Copied';
        setTimeout(() => { cpBtn.classList.remove('copied'); cpBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy'; }, 2000);
      };

      /* Font DL */
      const ftBtn = mkBtn('↓ Font');
      ftBtn.onclick = () => {
        const specUrl = 'https://fonts.google.com/specimen/' + s.fam.replace(/ /g, '+');
        window.open(specUrl, '_blank', 'noopener,noreferrer');
        const orig = ftBtn.textContent;
        ftBtn.textContent = '↗ Opened';
        setTimeout(() => { ftBtn.textContent = orig; }, 2000);
      };

      /* Image DL */
      const imgBtn = mkBtn('⬡ Image');
      imgBtn.onclick = async () => {
        if (typeof html2canvas === 'undefined') { alert('Please wait a moment and try again.'); return; }
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:fixed;left:-9999px;top:0;padding:14px 40px 40px;background:#FDFCFA';
        const p = document.createElement('p');
        p.style.cssText = `font-family:'${s.fam}',sans-serif;font-size:2.5rem;color:#1C1917;margin:0;line-height:1.5`;
        if (s.cls) p.classList.add(s.cls);
        p.textContent = getText(); wrap.appendChild(p); document.body.appendChild(wrap);
        await document.fonts.load(`1rem "${s.fam}"`);
        const cv = await html2canvas(wrap, {backgroundColor:'#FDFCFA',scale:3,logging:false});
        document.body.removeChild(wrap);
        const a = document.createElement('a');
        a.href = cv.toDataURL('image/png');
        a.download = 'telugu-font-'+(s.fam+(s.cls?'-'+s.cls.replace('style-',''):'')).replace(/[^\w]+/g,'-').toLowerCase()+'.png';
        a.click();
      };

      /* Transparent PNG */
      const tpngBtn = mkBtn('⬡ Transparent');
      tpngBtn.title = 'Download with transparent background';
      tpngBtn.onclick = async () => {
        if (typeof html2canvas === 'undefined') { alert('Please wait and try again.'); return; }
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:fixed;left:-9999px;top:0;padding:14px 40px 40px;background:transparent';
        const p2 = document.createElement('p');
        const tc = document.getElementById('textColorPicker');
        p2.style.cssText = `font-family:'${s.fam}',sans-serif;font-size:2.5rem;color:${tc?tc.value:'#1C1917'};margin:0;line-height:1.5`;
        if (s.cls) p2.classList.add(s.cls);
        p2.textContent = getText(); wrap.appendChild(p2); document.body.appendChild(wrap);
        await document.fonts.load(`1rem "${s.fam}"`);
        const cv = await html2canvas(wrap, {backgroundColor:null, scale:3, logging:false});
        document.body.removeChild(wrap);
        const a = document.createElement('a');
        a.href = cv.toDataURL('image/png');
        a.download = 'telugu-font-transparent-'+(s.fam+(s.cls?'-'+s.cls.replace('style-',''):'')).replace(/[^\w]+/g,'-').toLowerCase()+'.png';
        a.click();
        tpngBtn.textContent = '✓ Done';
        setTimeout(() => { tpngBtn.textContent = '⬡ Transparent'; }, 2000);
      };

      btns.append(cpBtn, ftBtn, imgBtn, tpngBtn);
      card.append(meta, prev, btns);
      grid.appendChild(card);
    });

    var rs = document.getElementById('rangeStart'), re = document.getElementById('rangeEnd');
    if (rs) rs.textContent = (page-1)*PER + 1;
    if (re) re.textContent = Math.min(page*PER, STYLES.length);
    if (curEl) curEl.textContent = page;
    if (totEl) totEl.textContent = tot();
    if (prevBtn) prevBtn.disabled = page === 1;
    if (nextBtn) nextBtn.disabled = page === tot();

    // Re-apply size and colour after render
    _reapplyControls();
  }

  function mkBtn(html) {
    const b = document.createElement('button');
    b.className = 'fc-btn'; b.innerHTML = html; return b;
  }

  /* Live text update */
  inp.addEventListener('input', () => {
    const t = getText();
    document.querySelectorAll('.fc-preview').forEach(el => { el.textContent = t; });
  });

  /* Pagination */
  if (prevBtn) prevBtn.onclick = () => {
    if (page > 1) { page--; render(); document.getElementById('generator')?.scrollIntoView({behavior:'smooth', block:'start'}); }
  };
  if (nextBtn) nextBtn.onclick = () => {
    if (page < tot()) { page++; render(); document.getElementById('generator')?.scrollIntoView({behavior:'smooth', block:'start'}); }
  };

  /* Input helpers */
  document.getElementById('pasteBtn')?.addEventListener('click', async () => {
    try { inp.value = await navigator.clipboard.readText(); inp.dispatchEvent(new Event('input')); } catch {}
  });
  document.getElementById('clearBtn')?.addEventListener('click', () => {
    inp.value = ''; inp.dispatchEvent(new Event('input'));
  });

  /* ── SIZE + COLOUR CONTROLS ─────────────────────────────── */
  function _reapplyControls() {
    var slider   = document.getElementById('fontSizeSlider');
    var textPick = document.getElementById('textColorPicker');
    var bgPick   = document.getElementById('bgColorPicker');
    if (slider && slider.value !== '32') {
      document.querySelectorAll('.fc-preview').forEach(function(el) {
        el.style.fontSize = slider.value + 'px';
      });
    }
    if (textPick && textPick.value !== '#1c1917' && textPick.value !== '#1C1917') {
      document.querySelectorAll('.fc-preview').forEach(function(el) {
        el.style.color = textPick.value;
      });
    }
    if (bgPick && bgPick.value !== '#fdfcfa' && bgPick.value !== '#FDFCFA') {
      document.querySelectorAll('.font-card').forEach(function(el) {
        el.style.background = bgPick.value;
      });
    }
  }

  (function initControls() {
    var slider   = document.getElementById('fontSizeSlider');
    var sLabel   = document.getElementById('fontSizeVal');
    var textPick = document.getElementById('textColorPicker');
    var bgPick   = document.getElementById('bgColorPicker');

    if (slider) {
      slider.addEventListener('input', function() {
        if (sLabel) sLabel.textContent = this.value + 'px';
        document.querySelectorAll('.fc-preview').forEach(function(el) {
          el.style.fontSize = slider.value + 'px';
        });
      });
    }
    if (textPick) {
      textPick.addEventListener('input', function() {
        document.querySelectorAll('.fc-preview').forEach(function(el) {
          el.style.color = textPick.value;
        });
      });
    }
    if (bgPick) {
      bgPick.addEventListener('input', function() {
        document.querySelectorAll('.font-card').forEach(function(el) {
          el.style.background = bgPick.value;
        });
      });
    }
  })();

  /* Pre-fill from ?text= (used by the voice typing tool's "Open in generator" button) */
  try {
    var qp = new URLSearchParams(window.location.search).get('text');
    if (qp) inp.value = qp.slice(0, 500);
  } catch (e) {}

  /* Init */
  render();
});