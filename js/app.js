/* ============================================================
   Шлях Потоку / The Path of the Flow — спільний скрипт
   ============================================================ */
(function () {
  'use strict';

  /* ---------- vortex canvas ---------- */
  (function () {
    const canvas = document.getElementById('vortex');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, cx, cy, maxR;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = canvas.offsetWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
      cx = w / 2; cy = h / 2;
      maxR = Math.min(w, h) * 0.48;
    }
    resize();
    window.addEventListener('resize', resize);

    const N = 240;
    const parts = [];
    for (let i = 0; i < N; i++) {
      const r = 10 + Math.pow(Math.random(), 0.7) * maxR;
      parts.push({
        r: r,
        a: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        osc: 3 + Math.random() * 9,
        speed: (1 / (r + 55)) * 130
      });
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.35);
      g.addColorStop(0, 'rgba(86,200,196,0.10)');
      g.addColorStop(0.45, 'rgba(86,200,196,0.025)');
      g.addColorStop(1, 'rgba(86,200,196,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < N; i++) {
        const p = parts[i];
        const a = p.a + t * p.speed;
        const r = p.r + Math.sin(t * 0.8 + p.phase) * p.osc * (p.r / maxR);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.92;
        const k = 1 - (p.r / maxR) * 0.85;
        const size = (1.1 + k * 2.2) * (w / 900);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + (120 + k * 60) + ',' + (225 - k * 20) + ',' + (222 - k * 30) + ',' + (0.10 + k * 0.5) + ')';
        ctx.fill();
      }
      const corePulse = 0.5 + Math.sin(t * 1.1) * 0.5;
      const cr = (5 + corePulse * 4) * (w / 900);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 4);
      cg.addColorStop(0, 'rgba(190,255,250,' + (0.35 + corePulse * 0.25) + ')');
      cg.addColorStop(1, 'rgba(86,200,196,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    if (reduce) { draw(0.42); } else {
      (function loop(t) {
        draw(t / 1000);
        requestAnimationFrame(loop);
      })(0);
    }
  })();

  /* ---------- progress + nav scroll ---------- */
  const progress = document.getElementById('progress');
  function onScroll() {
    if (progress) {
      const st = window.scrollY || document.documentElement.scrollTop;
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      progress.style.width = (st / max * 100) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- panel: menu + search ---------- */
  const panel = document.getElementById('panel');
  const searchInput = document.getElementById('search-input');
  if (panel && searchInput) {
    const listEl = document.getElementById('panel-list');
    const resultsEl = document.getElementById('search-results');
    const countEl = document.getElementById('search-count');
    const btnSearch = document.getElementById('btn-search');
    const btnClose = document.getElementById('panel-close');

    /* build index from the page DOM */
    const sections = [];
    document.querySelectorAll('section[id]').forEach((sec) => {
      if (sec.classList.contains('hero')) return;
      const numEl = sec.querySelector('.num');
      const h2 = sec.querySelector('h2');
      const title = (numEl ? numEl.textContent.trim() + ' — ' : '') + (h2 ? h2.textContent.trim() : sec.querySelector('.rule-label')?.textContent.trim() || '');
      const text = Array.from(sec.querySelectorAll('p')).map((p) => p.textContent.trim()).join(' ');
      const hint = sec.dataset.menuHint || '';
      sections.push({ id: sec.id, title, text, hint });
    });

    function esc(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function snippet(full, q) {
      const i = full.toLowerCase().indexOf(q.toLowerCase());
      const start = Math.max(0, i - 60);
      const end = Math.min(full.length, i + q.length + 80);
      let sn = (start > 0 ? '…' : '') + full.slice(start, end) + (end < full.length ? '…' : '');
      sn = sn.replace(new RegExp('(' + esc(q) + ')', 'gi'), '<mark>$1</mark>');
      return sn;
    }

    function renderList(filter) {
      listEl.innerHTML = '';
      const q = (filter || '').trim().toLowerCase();
      sections.forEach((s) => {
        if (q && s.title.toLowerCase().indexOf(q) === -1) return;
        const item = document.createElement('a');
        item.className = 'panel-item';
        item.href = '#' + s.id;
        item.dataset.target = s.id;
        const [numPart, ...titleParts] = s.title.split(' — ');
        item.innerHTML =
          '<span class="pi-num">' + esc(numPart) + '</span>' +
          '<span class="pi-title">' + esc(titleParts.join(' — ')) +
          (s.hint ? '<span class="pi-hint">' + esc(s.hint) + '</span>' : '') + '</span>';
        listEl.appendChild(item);
      });
      // Кліки по пунктах змісту — нативні HTML-якорі (href="#id").
      // Браузер сам змінить hash → CSS :target закриє панель і прокрутить.
      // Жодного JS-перехоплення: це працює в будь-якому WebView.
    }

    function renderResults(q) {
      resultsEl.innerHTML = '';
      if (!q) return;
      const ql = q.toLowerCase();
      let n = 0;
      sections.forEach((s) => {
        const inTitle = s.title.toLowerCase().indexOf(ql);
        const inText = s.text.toLowerCase().indexOf(ql);
        if (inTitle === -1 && inText === -1) return;
        if (n >= 12) return;
        n++;
        const btn = document.createElement('a');
        btn.className = 'search-result';
        btn.href = '#' + s.id;
        btn.dataset.target = s.id;
        let snip;
        if (inTitle !== -1 && (inText === -1 || inTitle <= inText)) {
          snip = s.text.slice(0, 140) + (s.text.length > 140 ? '…' : '');
        } else {
          snip = snippet(s.text, q);
        }
        btn.innerHTML =
          '<div class="sr-title">' + esc(s.title) + '</div>' +
          '<div class="sr-snippet">' + snip + '</div>';
        // нативний якір (href="#id") — без JS-перехоплення
        resultsEl.appendChild(btn);
      });
      if (n === 0) {
        const empty = document.createElement('div');
        empty.className = 'search-empty';
        empty.textContent = panel.dataset.noResults || 'Нічого не знайдено';
        resultsEl.appendChild(empty);
      }
    }

    function update(q) {
      q = (q || '').trim();
      panel.classList.toggle('searching', q.length > 0);
      if (q.length > 0) {
        renderResults(q);
        countEl.textContent = (resultsEl.querySelectorAll('.search-result').length ? resultsEl.querySelectorAll('.search-result').length + ' / ' + sections.length + ' ' : '') + '';
        countEl.textContent = resultsEl.querySelectorAll('.search-result').length + ' / ' + sections.length + ' · ' + (panel.dataset.countLabel || 'розділів');
      } else {
        countEl.textContent = '';
        renderList('');
      }
    }

    function panelOpen() {
      panel.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function panelClose() {
      panel.classList.remove('open');
      document.body.style.overflow = '';
      searchInput.value = '';
      update('');
      try {
        if (location.hash === '#panel' || location.hash === '#close') {
          history.replaceState(null, '', location.pathname + location.search);
        }
      } catch (e) {}
    }

    function highlightIn(root, query) {
      const ql = query.toLowerCase();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.toLowerCase().indexOf(ql) !== -1) nodes.push(node);
      }
      nodes.forEach((node) => {
        const frag = document.createDocumentFragment();
        const re = new RegExp('(' + esc(query) + ')', 'gi');
        let last = 0, m;
        const text = node.textContent;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const mark = document.createElement('mark');
          mark.className = 'hit';
          mark.textContent = m[0];
          frag.appendChild(mark);
          last = m.index + m[0].length;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
      setTimeout(() => {
        root.querySelectorAll('mark.hit').forEach((m) => {
          const t = document.createTextNode(m.textContent);
          m.parentNode.replaceChild(t, m);
        });
      }, 3000);
    }

    /* active chapter tracking (menu highlight) */
    const secObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        document.querySelectorAll('.panel-item').forEach((i) => i.classList.remove('active'));
        const item = listEl.querySelector('.panel-item[data-target="' + e.target.id + '"]');
        if (item) item.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('section[id]').forEach((s) => {
      if (!s.classList.contains('hero')) secObserver.observe(s);
    });

    /* events
       Відкриття/закриття панелі та переходи по розділах — НАТИВНІ:
       - кнопка Пошук → <a href="#panel"> → CSS :target показує панель
       - пункт змісту → <a href="#chN"> → браузер сам скролить, :target зникає → панель закривається
       - ✕ → <a href="#close"> → :target зникає → панель закривається
       JS тут лише для зручності: фокус на полі, підсвітка слів, Escape. */
    btnSearch && btnSearch.addEventListener('click', () => {
      if (location.hash === '#panel') panelOpen();
      setTimeout(() => { try { searchInput.focus(); searchInput.select(); } catch (e) {} }, 250);
    });
    btnClose && btnClose.addEventListener('click', () => { panelClose(); });
    window.addEventListener('hashchange', () => {
      const h = location.hash;
      if (h === '#panel') { panelOpen(); }
      else { document.body.style.overflow = ''; panel.classList.remove('open'); }
    });
    searchInput.addEventListener('input', () => update(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') panelClose();
      if (e.key === 'Enter') {
        const first = resultsEl.querySelector('.search-result');
        if (first) first.click();
      }
    });
    panel.addEventListener('click', (e) => { if (e.target === panel) panelClose(); });

    document.addEventListener('keydown', (e) => {
      if ((e.key === '/' && !panel.classList.contains('open') && !/INPUT|TEXTAREA/i.test(document.activeElement.tagName)) ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        location.hash = 'panel';
      }
    });

    renderList('');
  }
})();
