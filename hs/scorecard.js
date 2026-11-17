// ============================================
// Home Services landing page: industry tabs + Cash Leak Scorecard
// ============================================

(function () {
    // ---------- Industry tabs ----------
    const tabs = document.querySelectorAll('.industry-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.industry-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            tabs.forEach(t => t.setAttribute('aria-pressed', String(t === tab)));
            const seg = tab.closest('.ind-seg');
            if (seg) seg.classList.toggle('second', tab === tabs[tabs.length - 1]);
            const panel = document.getElementById('panel-' + tab.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });

    // ---------- Scorecard ----------
    const form = document.getElementById('scorecardForm');
    const results = document.getElementById('scorecardResults');
    if (!form || !results) return;

    // Rough benchmarks for route-based service businesses.
    // recurringShare: portion of revenue that is recurring/route revenue.
    const BENCH = {
        pest:       { label: 'pest control', recurringShare: 0.75, autopay: 70, arDays: 20, labor: 38, churn: 15 },
        landscape:  { label: 'landscaping',  recurringShare: 0.55, autopay: 60, arDays: 30, labor: 45, churn: 15 },
        electrical: { label: 'electrical',   recurringShare: 0.30, autopay: 40, arDays: 40, labor: 42, churn: 20 }
    };

    const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
    const round5k = n => Math.round(n / 5000) * 5000;

    function analyze(v) {
        const b = BENCH[v.industry];
        const recurringRev = v.revenue * b.recurringShare;
        const levers = [];

        // 1. Pricing: ~4% a year is typical; assume half is realistically recoverable.
        const yearsStale = Math.min(v.priceIncrease / 12, 2.5);
        const pricing = v.priceIncrease > 12 ? v.revenue * 0.04 * yearsStale * 0.5 : 0;
        levers.push({
            key: 'pricing', value: pricing, penalty: Math.min(25, Math.max(0, (v.priceIncrease - 12) * 1.0)),
            text: `It's been ${v.priceIncrease} months since your last price increase. Most ${b.label} operators raise prices every year. A measured increase could be worth about ${fmt(pricing)} a year.`
        });

        // 2. Labor efficiency: half of the gap to benchmark is recoverable.
        const laborGap = Math.max(0, v.laborPercent - b.labor);
        const labor = v.revenue * (laborGap / 100) * 0.5;
        levers.push({
            key: 'labor', value: labor, penalty: Math.min(25, laborGap * 2.5),
            text: `Labor is ${v.laborPercent}% of revenue against a typical ${b.labor}%. Route density and crew scheduling could recover about ${fmt(labor)} a year.`
        });

        // 3. Churn: each point above benchmark is lost recurring gross profit.
        const churnGap = Math.max(0, v.churnRate - b.churn);
        const churn = recurringRev * (churnGap / 100) * 0.5;
        levers.push({
            key: 'churn', value: churn, penalty: Math.min(20, churnGap * 2),
            text: `Customer churn of ${v.churnRate}% is above the ~${b.churn}% benchmark. Bringing it down could keep about ${fmt(churn)} a year in gross profit.`
        });

        // 4. Autopay: manual-pay customers cost collection time, late pay, and bad debt.
        const autopayGap = Math.max(0, b.autopay - v.autopay);
        const autopay = recurringRev * (autopayGap / 100) * 0.03;
        levers.push({
            key: 'autopay', value: autopay, penalty: Math.min(15, autopayGap * 0.3),
            text: `Only ${v.autopay}% of recurring customers are on autopay (target: ${b.autopay}%+). Moving more onto autopay cuts bad debt and collection time, worth about ${fmt(autopay)} a year.`
        });

        // 5. AR days: one-time cash release, not annual.
        const arGap = Math.max(0, v.arDays - b.arDays);
        const arCash = (v.revenue / 365) * arGap;
        const arPenalty = Math.min(15, arGap * 0.5);

        const annual = levers.reduce((s, l) => s + l.value, 0);
        const penalty = levers.reduce((s, l) => s + l.penalty, 0) + arPenalty;
        const score = Math.max(5, Math.min(100, Math.round(100 - penalty)));

        const top = levers.filter(l => l.value > 0).sort((a, b) => b.value - a.value).slice(0, 3);
        const callouts = top.map(l => l.text);
        if (arCash > 0) {
            callouts.push(`Customers take ${v.arDays} days to pay against a ~${b.arDays}-day target. Tightening collections would free up about ${fmt(arCash)} in cash, one time.`);
        }
        if (!callouts.length) {
            callouts.push('Your numbers are ahead of typical benchmarks. The next step is protecting those margins as you grow, or getting ready for a premium exit.');
        }

        let description;
        if (score >= 80) description = 'Strong. You run a tighter ship than most. The upside is in fine-tuning and exit readiness.';
        else if (score >= 60) description = 'Solid, with real cash on the table. A few targeted fixes would pay off quickly.';
        else if (score >= 40) description = 'Meaningful leaks. There is likely six figures of cash you could be keeping.';
        else description = 'Significant leaks. Fixing these is the fastest way to more cash without adding a single customer.';

        return { score, annual: round5k(annual), callouts, description };
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const v = {
            industry: form.industry.value,
            revenue: +form.revenue.value,
            autopay: +form.autopay.value,
            priceIncrease: +form.priceIncrease.value,
            arDays: +form.arDays.value,
            laborPercent: +form.laborPercent.value,
            churnRate: +form.churnRate.value
        };
        if (!BENCH[v.industry]) return;

        const r = analyze(v);
        document.getElementById('scoreValue').textContent = r.score;
        document.getElementById('scoreDescription').textContent = r.description;
        document.getElementById('cashEstimate').textContent = fmt(r.annual);

        const box = document.getElementById('callouts');
        box.innerHTML = '';
        r.callouts.forEach(t => {
            const d = document.createElement('div');
            d.className = 'callout-item';
            const p = document.createElement('p');
            p.textContent = t;
            d.appendChild(p);
            box.appendChild(d);
        });

        document.getElementById('hiddenScore').value = r.score;
        document.getElementById('hiddenEstimate').value = fmt(r.annual);
        document.getElementById('hiddenIndustry').value = v.industry;
        // Pass the raw inputs too so follow-up can be specific.
        const rf = document.getElementById('resultsForm');
        Object.entries(v).forEach(([k, val]) => {
            let inp = rf.querySelector(`input[name="input_${k}"]`);
            if (!inp) {
                inp = document.createElement('input');
                inp.type = 'hidden';
                inp.name = 'input_' + k;
                rf.appendChild(inp);
            }
            inp.value = val;
        });

        form.style.display = 'none';
        results.style.display = 'block';
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (typeof gtag !== 'undefined') {
            gtag('event', 'scorecard_complete', { event_category: 'hs_landing', industry: v.industry, score: r.score, value: r.annual });
        }
    });

    // Lead capture: submit to Formspree without leaving the page.
    const resultsForm = document.getElementById('resultsForm');
    const success = document.getElementById('formSuccess');
    resultsForm.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = resultsForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sending...';
        try {
            const res = await fetch(resultsForm.action, {
                method: 'POST',
                body: new FormData(resultsForm),
                headers: { Accept: 'application/json' }
            });
            if (!res.ok) throw new Error('Submit failed');
            resultsForm.style.display = 'none';
            success.style.display = 'block';
            if (typeof gtag !== 'undefined') {
                gtag('event', 'generate_lead', { event_category: 'hs_landing', event_label: 'scorecard_breakdown' });
            }
        } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Get My Full Breakdown';
            alert('Something went wrong. Please try again, or book a call directly.');
        }
    });

    document.getElementById('retakeBtn').addEventListener('click', () => {
        results.style.display = 'none';
        form.style.display = 'block';
        resultsForm.style.display = 'block';
        success.style.display = 'none';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
})();
