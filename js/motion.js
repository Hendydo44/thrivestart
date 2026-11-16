// ============================================
// ThriveStart v2 motion: reveals, counters, charts, sticky timeline, toggle
// Everything degrades to final state with no JS or reduced motion.
// ============================================
(function () {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.add('js');
    if (reduce) root.classList.add('reduce');

    // ---------- Scroll progress ----------
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const max = root.scrollHeight - root.clientHeight;
            bar.style.transform = 'scaleX(' + (max > 0 ? root.scrollTop / max : 0) + ')';
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---------- Ticker: duplicate content for a seamless loop ----------
    document.querySelectorAll('.ticker-track').forEach(t => { t.innerHTML += t.innerHTML; });

    // ---------- Counters ----------
    function countUp(el) {
        const to = parseFloat(el.dataset.count);
        const pre = el.dataset.prefix || '';
        const suf = el.dataset.suffix || '';
        if (reduce) { el.textContent = pre + to + suf; return; }
        const dur = 1400;
        const t0 = performance.now();
        const step = now => {
            const p = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = pre + Math.round(to * eased) + suf;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // ---------- Ledger scan ----------
    function scan(el) {
        const rows = [...el.querySelectorAll('tbody tr')];
        if (reduce) { rows.forEach(r => r.classList.add('done')); return; }
        rows.forEach((r, i) => {
            setTimeout(() => {
                rows.forEach(x => x.classList.remove('now'));
                r.classList.add('now', 'done');
                if (i === rows.length - 1) setTimeout(() => r.classList.remove('now'), 700);
            }, 350 + i * 520);
        });
    }

    // ---------- Before / After ----------
    function setBA(wrap, after) {
        wrap.classList.toggle('after', after);
        wrap.querySelectorAll('[data-ba]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.ba === 'a') === after)));
    }
    document.querySelectorAll('.ba-wrap').forEach(wrap => {
        wrap.querySelectorAll('[data-ba]').forEach(btn => {
            btn.addEventListener('click', () => { wrap.dataset.touched = '1'; setBA(wrap, btn.dataset.ba === 'a'); });
        });
    });

    // ---------- Reveal observer ----------
    const fire = el => {
        const a = el.dataset.anim;
        if (a === 'scan') scan(el);
        if (a === 'ba' && !el.dataset.touched) setTimeout(() => { if (!el.dataset.touched) setBA(el, true); }, reduce ? 0 : 1400);
    };
    const targets = document.querySelectorAll('.reveal, .stagger, [data-anim]');
    if (!('IntersectionObserver' in window)) {
        targets.forEach(el => { el.classList.add('in'); fire(el); });
        document.querySelectorAll('[data-count]').forEach(countUp);
        return;
    }
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            fire(e.target);
            io.unobserve(e.target);
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));

    const cio = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            countUp(e.target);
            cio.unobserve(e.target);
        });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

    // ---------- Sticky timeline ----------
    document.querySelectorAll('.tl').forEach(tl => {
        const steps = [...tl.querySelectorAll('.tl-step')];
        const count = tl.querySelector('.tl-count b');
        const when = tl.querySelector('.tl-when');
        const name = tl.querySelector('.tl-name');
        const fill = tl.querySelector('.tl-fill');
        const set = i => {
            steps.forEach((s, j) => s.classList.toggle('active', j === i));
            const s = steps[i];
            if (count) count.textContent = String(i + 1).padStart(2, '0');
            if (when) when.textContent = s.dataset.when || '';
            if (name) name.textContent = s.dataset.name || '';
            if (fill) fill.style.transform = 'scaleX(' + (i + 1) / steps.length + ')';
        };
        set(0);
        const sio = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) set(steps.indexOf(e.target)); });
        }, { rootMargin: '-45% 0px -45% 0px' });
        steps.forEach(s => sio.observe(s));
    });
})();
