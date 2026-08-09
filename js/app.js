/* ============================================================
   Шлях Потоку / The Path of the Flow — мінімальний скрипт
   Лише декоративна анімація вихора. Навігація — чистий HTML.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- vortex canvas ---------- */
  const canvas = document.getElementById('vortex');
  if (canvas) {
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
  }

  /* ---------- progress bar ---------- */
  const progress = document.getElementById('progress');
  if (progress) {
    function onScroll() {
      const st = window.scrollY || document.documentElement.scrollTop;
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      progress.style.width = (st / max * 100) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

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

  /* ---------- пошук по змісту (тільки фільтр списку, кліки — нативні якорі) ---------- */
  const tocSearch = document.getElementById('toc-search');
  if (tocSearch) {
    const grid = document.getElementById('toc-grid');
    const clearBtn = document.getElementById('toc-clear');
    const links = grid ? Array.from(grid.querySelectorAll('a')) : [];
    let emptyMsg = null;
    function applyFilter() {
      const q = tocSearch.value.trim().toLowerCase();
      let visible = 0;
      links.forEach((a) => {
        const match = a.textContent.toLowerCase().indexOf(q) !== -1;
        a.classList.toggle('hidden', !match);
        if (match) visible++;
      });
      if (clearBtn) clearBtn.classList.toggle('show', q.length > 0);
      if (!emptyMsg) {
        emptyMsg = document.createElement('div');
        emptyMsg.className = 'toc-empty';
        emptyMsg.textContent = grid.dataset.empty || 'Нічого не знайдено';
        grid.appendChild(emptyMsg);
      }
      emptyMsg.classList.toggle('show', q.length > 0 && visible === 0);
    }
    tocSearch.addEventListener('input', applyFilter);
    if (clearBtn) clearBtn.addEventListener('click', () => { tocSearch.value = ''; applyFilter(); tocSearch.focus(); });
    // якщо прийшли з кнопки «Пошук» в шапці — фокусуємо поле
    if (location.hash === '#toc-search') setTimeout(() => { try { tocSearch.focus(); } catch (e) {} }, 300);
  }
})();
