/* Views, routing and events. */
(function () {
  'use strict';
  const A = window.APP, P = A.P, FG = window.FIG, esc = A.esc, KIND = A.KIND;
  const $ = (s) => document.querySelector(s);
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const UI = { open: {}, paused: {}, prompt: true, trend: true, json: false, repW: null };
  const TIP_KEY = 'wk36.tip';

  /* ---------- small builders ---------- */
  const zone = (v) => (v <= 2 ? 'z-g' : v <= 4 ? 'z-y' : 'z-r');
  const chips = (f, cur, from, to, zoned, five) => {
    let h = '<div class="chips' + (five ? ' five' : '') + '">';
    for (let v = from; v <= to; v++) h += '<button class="chip ' + (zoned ? zone(v) : 'z-n') + '" data-act="set" data-f="' + f + '" data-v="' + v + '" aria-pressed="' + (cur === v) + '">' + v + '</button>';
    return h + '</div>';
  };
  const status = (lg) => '<div class="seg" role="group" aria-label="Session status">' + [['done', 'Done', 'g'], ['partial', 'Partly', 'y'], ['skipped', 'Skipped', '']].map((s) => '<button class="' + s[2] + '" data-act="set" data-f="st" data-v="' + s[0] + '" aria-pressed="' + (lg.st === s[0]) + '">' + s[1] + '</button>').join('') + '</div>';
  const num = (f, label, val, step) => '<label class="field"><span>' + label + '</span><input class="txt" type="number" inputmode="decimal" min="0" step="' + (step || 1) + '" data-bind="' + f + '" value="' + esc(val) + '"></label>';
  const dayLabel = (k) => A.fmt(k);
  const goDay = (k) => { location.hash = k === A.todayK() ? '#/today' : '#/day/' + k; };
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
  A.onFail(() => toast('Couldn’t save — storage may be full or blocked. Export a backup.'));

  /* ---------- figures ---------- */
  const fig = (id) => FG.FIGS[id];
  const fid = (id) => (P.EX[id] && P.EX[id].fig) || id;
  const thumb = (id) => { const f = fig(fid(id)); return '<span class="thumb" aria-hidden="true">' + FG.draw(f, f.frames[Math.min(1, f.frames.length - 1)]) + '</span>'; };
  function figBlock(eid) {
    const id = fid(eid), f = fig(id);
    if (REDUCED) {
      return '<div class="figpair"><div class="figbox"><figcaption>Start</figcaption>' + FG.draw(f, f.frames[0]) + '</div><div class="figbox"><figcaption>End</figcaption>' + FG.draw(f, f.frames[Math.min(1, f.frames.length - 1)]) + '</div></div>';
    }
    const p = !!UI.paused[id];
    return '<div class="figbox"><div class="figfill" data-anim="' + id + '">' + FG.draw(f, f.frames[0]) + '</div><button class="figctl" data-act="pause" data-fig="' + id + '">' + (p ? 'Play' : 'Pause') + '</button></div>';
  }
  let raf = 0;
  function startFigs() {
    cancelAnimationFrame(raf);
    const items = [].slice.call(document.querySelectorAll('[data-anim]')).map((el) => ({ el, f: fig(el.dataset.anim), id: el.dataset.anim }));
    if (!items.length) return;
    const t0 = performance.now();
    const loop = (now) => {
      items.forEach((it) => { if (it.el.isConnected && !UI.paused[it.id]) it.el.innerHTML = FG.draw(it.f, FG.poseAt(it.f, (now - t0) / 1000)); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function exRow(k, id, mode, opts) {
    const e = P.EX[id], lg = A.LG(k), st = (lg.ex && lg.ex[id]) || {}, key = (k || 'm') + '|' + id, open = !!UI.open[key];
    let h = '<div class="ex' + (open ? ' open' : '') + (st.d ? ' done' : '') + '">';
    h += '<div class="ex-row">';
    if (opts.tick) h += '<button class="tick" data-act="tick" data-ex="' + id + '" aria-pressed="' + !!st.d + '" aria-label="Mark ' + esc(e.name) + ' done"><i>✓</i></button>';
    h += '<button class="ex-main" data-act="toggleEx" data-key="' + key + '" aria-expanded="' + open + '">' + thumb(id) + '<span class="ex-t"><b>' + esc(e.name) + '</b><small>' + esc(A.rxText(e, mode)) + '</small></span><span class="chev"></span></button></div>';
    if (open) h += exBody(k, id, mode, opts);
    return h + '</div>';
  }
  function exBody(k, id, mode, opts) {
    const e = P.EX[id], st = (k && A.LG(k).ex && A.LG(k).ex[id]) || {};
    let h = '<div class="ex-body">' + figBlock(id);
    h += '<ul class="cues">' + e.cues.map((c) => '<li>' + esc(c) + '</li>').join('') + '</ul>';
    if (e.easier || e.harder) h += '<dl class="rx">' + (e.easier ? '<dt>Easier</dt><dd>' + esc(e.easier) + '</dd>' : '') + (e.harder ? '<dt>Harder</dt><dd>' + esc(e.harder) + '</dd>' : '') + '<dt>Works</dt><dd>' + esc(e.area) + '</dd></dl>';
    if (opts.note && (e.grp === 'A' || e.grp === 'B')) h += '<label class="field" style="margin-top:10px"><span>Load and reps (for your report)</span><input class="txt" data-bind="exn" data-ex="' + id + '" placeholder="e.g. 12 kg × 8, 8, 7" value="' + esc(st.n || '') + '"></label>';
    h += '<a class="vid" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(e.video) + '" target="_blank" rel="noopener">Watch real footage (needs internet)</a>';
    return h + '</div>';
  }
  function exGroup(k, title, ids, mode, note) {
    return '<section class="card"><h3>' + esc(title) + '</h3>' + (note ? '<p class="hint">' + esc(note) + '</p>' : '') + ids.map((id) => exRow(k, id, mode, { tick: true, note: true })).join('') + '</section>';
  }

  /* ---------- day view ---------- */
  const numParts = (s) => { const m = String(s || '').match(/^([\d–.-]+)\s*(min|km)\s*(.*)$/); return m ? { n: m[1], u: m[2], rest: m[3] } : { n: '', u: '', rest: s || '' }; };
  const effortText = (rest) => {
    const r = (rest || '').toLowerCase(), t = [];
    if (r.indexOf('easy') >= 0) t.push('Easy: you can speak in full sentences.');
    if (r.indexOf('controlled') >= 0) t.push('Controlled: steady and comfortably hard, well short of race effort.');
    if (r.indexOf('stride') >= 0) t.push('Strides: short relaxed accelerations with full walking recovery.');
    if (r.indexOf('pickup') >= 0) t.push('Pickups: a few relaxed surges, never a sprint.');
    return t.join(' ');
  };
  function hero(pl, lg) {
    const kind = A.effKind(pl, lg), K = KIND[kind], wk = pl.wk;
    let big = '', unit = '', txt = false, p = '', label = K.label;
    if (kind === 'rest') { big = 'Rest'; txt = true; p = pl.note || 'Complete rest. Don’t make up missed sessions.'; label = pl.kind === 'rest' ? 'Rest day' : 'Rest'; }
    else if (kind === 'choice') { big = 'Your call'; txt = true; label = pl.title; p = wk.bb + '.' + (pl.dow === 1 ? ' Scheduled run if you don’t play: ' + wk.r1 + '.' : ' Recovery = easy walk or mobility.'); }
    else if (kind === 'run' || kind === 'long' || kind === 'race') {
      const src = pl.kind === 'choice' ? wk.r1 : pl.run, np = numParts(src);
      big = np.n || src; unit = np.u; p = effortText(np.rest) || (kind === 'race' ? 'Primary objective: finish healthy.' : '');
      if (np.rest && kind !== 'race') p = np.rest.charAt(0).toUpperCase() + np.rest.slice(1) + '. ' + p;
      if (kind === 'race') label = 'Race day';
    } else if (kind === 'bb') { big = 'Hoops'; txt = true; p = wk.bb + '. Counts as a substantial lower-body session; do the ~10-minute warm-up first.'; }
    else if (kind === 'strA' || kind === 'strB' || kind === 'mob') {
      const n = kind === 'strA' ? P.SESSIONS.A.length : kind === 'strB' ? P.SESSIONS.B.length : P.SESSIONS.M.length;
      big = String(n); unit = 'exercises';
      const m = { full: 'Controlled reps, no failure.', reduced: 'Reduced week: one fewer set than usual.', light: 'Light: two easy sets, or swap for mobility.', mobility: 'Mobility only.' }[pl.mode || 'mobility'];
      p = m + (pl.optional ? ' Optional this week.' : '') + (kind === 'strA' ? ' If Tuesday basketball was very hard, reduce volume or shorten the session.' : '');
      if (kind === 'strB' && pl.mode !== 'light') p += ' Finish with mobility.';
    } else if (kind === 'rec') { big = 'Easy'; txt = true; p = 'Easy walk, mobility, or full rest.'; }
    let h = '<section class="hero ' + K.cls + '"><div class="kind">' + esc(label) + '</div><div class="wk">Week ' + pl.w + ' of 36 · ' + esc(P.PHASES[wk.ph].name) + (wk.deload ? ' · deload' : '') + '</div>';
    h += '<div class="big' + (txt ? ' txt' : '') + '"><b>' + esc(big) + '</b>' + (unit ? '<span>' + unit + '</span>' : '') + '</div><p>' + esc(p) + '</p>';
    if (pl.kind === 'choice') h += '<div class="opts" role="group" aria-label="What did you do?">' + pl.options.map((o) => '<button data-act="set" data-f="did" data-v="' + o[0] + '" aria-pressed="' + (lg.did === o[0]) + '">' + o[1] + '</button>').join('') + '</div>';
    return h + '</section>';
  }
  function session(pl, lg, k) {
    const kind = A.effKind(pl, lg), wk = pl.wk;
    if (kind === 'rest' || kind === 'choice') return '';
    if (kind === 'strA') return exGroup(k, 'Strength A', P.SESSIONS.A, pl.mode, A.strengthNote(pl.w)) + logCard(lg, 'Strength A', '');
    if (kind === 'strB') return exGroup(k, 'Strength B', P.SESSIONS.B, pl.mode, A.strengthNote(pl.w)) + (pl.mode === 'light' ? '' : exGroup(k, 'Optional mobility', P.SESSIONS.M, 'full', 'Friday is “Strength B / Mobility”. Ankle rocks are a simple add-on.')) + logCard(lg, 'Strength B', '');
    if (kind === 'mob') return exGroup(k, 'Mobility', P.SESSIONS.M, 'full') + logCard(lg, 'Mobility', '');
    if (kind === 'bb') return exGroup(k, 'Warm-up (about 10 minutes)', P.SESSIONS.W, 'full', 'About 5 min general movement, 3 min mobility/activation, 2 min basketball preparation. With the Achilles symptomatic, avoid high-volume maximal jumping or repeated maximal cuts.') + logCard(lg, 'Basketball', '<div class="two">' + num('min', 'Minutes played', lg.min) + '</div><div class="zone"><b>Intensity</b></div><div class="seg">' + ['Easy', 'Moderate', 'Hard'].map((x) => '<button data-act="set" data-f="bbi" data-v="' + x.toLowerCase() + '" aria-pressed="' + (lg.bbi === x.toLowerCase()) + '">' + x + '</button>').join('') + '</div>');
    if (kind === 'rec') return logCard(lg, 'Recovery', '');
    // run / long / race
    const rpe = '<div class="zone"><b>Effort (1 easy – 10 max)</b></div>' + chips('rpe', lg.rpe, 1, 10, false, true);
    const guide = '<section class="card"><h3>How it should feel</h3>' + exRow(k, 'runform', 'full', { tick: false }) + '</section>';
    return guide + logCard(lg, kind === 'race' ? 'Race' : kind === 'long' ? 'Long run' : 'Run', '<div class="two">' + num('min', 'Minutes', lg.min) + num('dist', 'Distance (km)', lg.dist, 0.1) + '</div>' + rpe);
  }
  function logCard(lg, title, extra) {
    return '<section class="card"><h3>Log ' + esc(title.toLowerCase()) + '</h3>' + status(lg) + (extra ? '<div style="margin-top:12px">' + extra + '</div>' : '') + '</section>';
  }
  function pain(pl, lg) {
    const kind = A.effKind(pl, lg);
    const hasSession = ['run', 'long', 'bb', 'strA', 'strB', 'race'].indexOf(kind) >= 0;
    const vals = [lg.kAm, lg.aAm, lg.kPost, lg.aPost];
    let worst = null; vals.forEach((v) => { worst = A.worse(worst, A.sev(v)); });
    const red = (lg.red || []).length > 0;
    const block = (title, kf, af) => '<div class="zone"><b>' + title + '</b></div><small>Knee</small>' + chips(kf, lg[kf], 0, 10, true) + '<small style="display:block;margin-top:8px">Achilles</small>' + chips(af, lg[af], 0, 10, true);
    let h = '<section class="card"><h3>Knee and Achilles</h3><p class="hint">Green 0–2 · Yellow 3–4 · above 4 is above the yellow range. This morning’s check also counts as the next-morning check for yesterday.</p>';
    h += block('This morning', 'kAm', 'aAm');
    if (hasSession) h += '<hr class="sep">' + block('Right after the session', 'kPost', 'aPost');
    h += '<hr class="sep"><div class="zone" style="margin-top:0"><b>General fatigue (1 fresh – 10 wrecked)</b></div>' + chips('fat', lg.fat, 1, 10, false, true);
    h += '<details class="flags"' + (red ? ' open' : '') + '><summary>Red-flag symptoms</summary>' + P.RED_FLAGS.map((r) => '<label class="check"><input type="checkbox" data-act="red" data-id="' + r[0] + '"' + ((lg.red || []).indexOf(r[0]) >= 0 ? ' checked' : '') + '><span>' + esc(r[1]) + '</span></label>').join('') + '</details>';
    if (red) h += '<div class="banner r">Red: stop the relevant activity and seek medical assessment.</div>';
    else if (worst === 'g') h += '<div class="banner g">Green: continue if movement quality is normal and pain is back to baseline by next morning.</div>';
    else if (worst === 'y') h += '<div class="banner y">Yellow: reduce the next workout’s intensity or volume. Easy or recovery work can replace hard work.</div>';
    else if (worst === 'r') h += '<div class="banner r">Above the yellow range. If it’s rapid, significant or getting worse, stop and get assessed.</div>';
    return h + '</section>';
  }
  function tip() {
    if (localStorage.getItem(TIP_KEY) || !('standalone' in navigator) || navigator.standalone) return '';
    return '<section class="card tip"><span>Install it: tap Share, then <b>Add to Home Screen</b>. It works offline once opened.</span><button data-act="hideTip">Got it</button></section>';
  }
  function viewDay(k) {
    const pl = A.dayPlan(k), lg = A.LG(k), today = A.todayK();
    const top = (t, s) => '<div class="top"><button class="iconbtn" data-act="day" data-d="-1" aria-label="Previous day">‹</button><div class="title"><b>' + t + '</b><span>' + s + '</span></div><button class="iconbtn" data-act="day" data-d="1" aria-label="Next day">›</button></div>';
    if (!pl) {
      const before = A.diff(k, P.START) < 0;
      return '<div class="stack" data-k="' + k + '">' + top(A.fmt(k), before ? 'Before the plan' : 'After race day') + '<section class="card"><h3>' + (before ? 'Week 1 starts ' + A.fmt(P.START, true) : 'The 36-week plan ended on race day') + '</h3><p class="muted" style="margin-top:6px">' + (before ? 'That is ' + A.diff(P.START, today) + ' days from today.' : 'Well done. Your logs are still under Plan and Report.') + '</p></section><a class="btn ghost" style="display:grid;place-items:center" href="#/plan">Open the plan</a></div>';
    }
    const cd = A.diff(P.RACE, k);
    let h = '<div class="stack" data-k="' + k + '">' + top(A.fmt(k) + (k === today ? ' · today' : ''), cd > 0 ? cd + ' days to race' : 'Race day');
    h += tip() + hero(pl, lg) + session(pl, lg, k) + pain(pl, lg);
    h += '<section class="card"><h3>Notes</h3><textarea class="area" data-bind="note" placeholder="Anything worth telling your future self or the AI coach">' + esc(lg.note || '') + '</textarea></section>';
    h += '<a class="btn ghost" style="display:grid;place-items:center" href="#/week/' + pl.w + '">See week ' + pl.w + '</a>';
    if (k !== today) h += '<a class="btn ghost" style="display:grid;place-items:center" href="#/today">Jump to today</a>';
    return h + '</div>';
  }

  /* ---------- plan ---------- */
  const phCol = (ph) => 'var(' + P.PHASES[ph].color + ')';
  function curWeek() { const l = A.loc(A.todayK()); return l ? l.w : A.diff(A.todayK(), P.START) < 0 ? 0 : 37; }
  function chart() {
    const cw = curWeek();
    let s = '<svg viewBox="0 0 360 118" role="img" aria-label="Long-run minutes by week across the 36 weeks, with dips for deload weeks and a taper before race day">';
    P.WEEKS.forEach((w, i) => {
      const race = w.n === 36, h = race ? 84 : Math.max(9, (w.lm / 130) * 78), x = i * 10, y = 92 - h;
      s += '<rect x="' + x + '" y="' + y + '" width="8" height="' + h + '" rx="2" style="fill:' + phCol(w.ph) + '" opacity="' + (w.n <= cw ? 1 : 0.55) + '"/>';
      if (w.n === cw) s += '<polygon points="' + (x + 4) + ',' + (y - 3) + ' ' + (x) + ',' + (y - 11) + ' ' + (x + 8) + ',' + (y - 11) + '" style="fill:var(--ink)"/>';
    });
    [1, 12, 24, 36].forEach((n) => { s += '<text x="' + ((n - 1) * 10 + 4) + '" y="108" text-anchor="middle">' + n + '</text>'; });
    return s + '</svg>';
  }
  function dots(w) {
    let h = '<span class="dots" aria-hidden="true">';
    for (let d = 1; d < 7; d++) { const st = A.LG(A.dateOf(w, d)).st; h += '<i class="dot ' + (st || '') + '"></i>'; }
    return h + '</span>';
  }
  const cm = (s) => (s || '').replace(/\s*min.*$/, '');
  const compact = (w) => cm(w.r1) + ' · ' + cm(w.r2) + ' · ' + (w.lg ? cm(w.lg) : 'race') + (w.lg ? ' min' : '');
  function viewPlan() {
    const cw = curWeek();
    let h = '<div class="stack"><div><h1>36 weeks</h1><p class="muted" style="margin-top:6px">' + A.fmt(P.START, true) + ' to race day, ' + A.fmt(P.RACE, true) + '. Finish healthy.</p></div>';
    h += '<div class="chart" id="chart">' + chart() + '<div class="legend">' + Object.keys(P.PHASES).map((k) => '<span><i style="background:' + phCol(k) + '"></i>' + P.PHASES[k].name + '</span>').join('') + '</div><p class="small" style="margin-top:6px">Bar height is long-run minutes. Short bars are deload weeks.</p></div></div>';
    let last = '';
    P.WEEKS.forEach((w) => {
      if (w.ph !== last) { h += '<div class="phase-h"><h2>' + P.PHASES[w.ph].name + '</h2></div>'; last = w.ph; }
      h += '<a class="wrow' + (w.n === cw ? ' now' : '') + '" href="#/week/' + w.n + '"><span class="wn">' + w.n + '</span><span class="wd"><b>' + esc(compact(w)) + (w.deload ? '<span class="tag">deload</span>' : '') + '</b><small>' + A.fmtDM(A.dateOf(w.n, 0)) + ' – ' + A.fmtDM(A.dateOf(w.n, 6)) + '</small></span>' + dots(w.n) + '</a>';
    });
    return h;
  }
  function viewWeek(n) {
    n = Math.min(36, Math.max(1, +n || 1));
    const wk = P.WEEKS[n - 1], cw = curWeek(), wr = A.DB.wr[n] || {}, today = A.todayK();
    let h = '<div class="stack" data-w="' + n + '"><a class="back" href="#/plan">‹ All weeks</a>';
    h += '<div><h1>Week ' + n + '</h1><p class="muted" style="margin-top:6px">' + esc(P.PHASES[wk.ph].name) + (wk.deload ? ' · deload' : '') + ' · ' + A.fmtDM(A.dateOf(n, 0)) + ' – ' + A.fmtDM(A.dateOf(n, 6)) + '</p></div>';
    h += '<section class="card"><h3>Targets</h3><dl class="kv"><dt>Tue run</dt><dd>' + esc(wk.r1) + ' <small>(if not playing)</small></dd><dt>Thu run</dt><dd>' + esc(wk.r2) + '</dd><dt>Sat</dt><dd>' + esc(wk.lg || 'Rest; race on Sunday') + '</dd><dt>Runs</dt><dd>' + esc(wk.runs) + '</dd><dt>Basketball</dt><dd>' + esc(wk.bb) + '</dd><dt>Strength</dt><dd>' + esc(wk.str) + '</dd><dt>Focus</dt><dd>' + esc(wk.focus) + '</dd></dl><hr class="sep"><p class="small">' + esc(A.strengthNote(n)) + '</p></section>';
    h += '<div>';
    for (let d = 0; d < 7; d++) {
      const k = A.dateOf(n, d), pl = A.dayPlan(k), lg = A.LG(k), kind = A.effKind(pl, lg), K = KIND[kind];
      const plannedTxt = A.report ? '' : '';
      const sub = kind === 'choice' ? pl.title : K.label;
      const st = lg.st ? { done: 'Done', partial: 'Partly', skipped: 'Skipped' }[lg.st] : '';
      h += '<a class="drow' + (k === today ? ' today' : '') + '" href="#/day/' + k + '"><span class="swatch ' + K.cls + '"></span><span class="dk">' + A.DOWS[d] + '<small>' + A.fmtDM(k) + '</small></span><span class="wd grow"><b style="font-weight:650">' + esc(sub) + '</b><small style="display:block">' + esc(dayHint(pl, lg)) + '</small></span><span class="small">' + st + '</span></a>' + plannedTxt;
    }
    h += '</div>';
    h += '<section class="card"><h3>Weekly review</h3><p class="hint">Look back before progressing. Adjust next week from this, and don’t make up missed sessions.</p><div class="zone" style="margin-top:0"><b>General fatigue (1 fresh – 10 wrecked)</b></div>' + chips('wr.fat', wr.fat, 1, 10, false, true) + '<label class="field" style="margin-top:12px"><span>Schedule constraints</span><input class="txt" data-bind="wr.sched" value="' + esc(wr.sched || '') + '" placeholder="Travel, work, weather…"></label><label class="field" style="margin-top:12px"><span>Notes</span><textarea class="area" data-bind="wr.note" placeholder="How the week felt overall">' + esc(wr.note || '') + '</textarea></label></section>';
    h += '<a class="btn" style="display:grid;place-items:center" href="#/report" data-act="reportFor" data-w="' + n + '">Create this week’s report</a></div>';
    return h;
  }
  function dayHint(pl, lg) {
    const kind = A.effKind(pl, lg);
    if (kind === 'run') return pl.run; if (kind === 'long') return pl.run;
    if (kind === 'choice') return pl.dow === 1 ? 'Run if not playing: ' + pl.wk.r1 : 'Basketball or recovery';
    if (kind === 'bb') return lg.min ? lg.min + ' min' + (lg.bbi ? ', ' + lg.bbi : '') : 'Basketball';
    if (kind === 'strA' || kind === 'strB') return 'Sets and reps inside';
    if (kind === 'race') return '21.1 km';
    return '';
  }

  /* ---------- moves ---------- */
  function viewMoves() {
    let h = '<div class="stack"><div><h1>Moves</h1><p class="muted" style="margin-top:6px">Tap an exercise to see it move. Lists come from your Weekly Training Plan.</p></div>';
    P.GROUPS.forEach((g) => {
      const ids = Object.keys(P.EX).filter((id) => P.EX[id].grp === g[0]);
      h += '<section class="card"><h3>' + g[1] + '</h3>' + ids.map((id) => exRow(null, id, 'full', { tick: false })).join('') + '</section>';
    });
    return h + '</div>';
  }

  /* ---------- report ---------- */
  function defaultReportWeek() {
    const l = A.loc(A.todayK());
    if (!l) return A.diff(A.todayK(), P.START) < 0 ? 1 : 36;
    return l.dow <= 1 && l.w > 1 ? l.w - 1 : l.w;
  }
  function reportText() { return A.report.build(UI.repW, { prompt: UI.prompt, trend: UI.trend, json: UI.json }); }
  function viewReport() {
    if (!UI.repW) UI.repW = defaultReportWeek();
    const w = UI.repW, has = A.report.hasData(w), lb = A.DB.meta.lastBackup;
    const tg = (id, label, on) => '<label class="toggle"><input type="checkbox" data-act="opt" data-id="' + id + '"' + (on ? ' checked' : '') + '><span>' + label + '</span></label>';
    let h = '<div class="stack"><div><h1>Report</h1><p class="muted" style="margin-top:6px">A plain-text summary you can paste into an AI chat for analysis.</p></div>';
    h += '<div class="top" style="margin-bottom:0"><button class="iconbtn" data-act="repWeek" data-d="-1" aria-label="Previous week"' + (w <= 1 ? ' disabled' : '') + '>‹</button><div class="title"><b>Week ' + w + '</b><span>' + A.fmtDM(A.dateOf(w, 0)) + ' – ' + A.fmtDM(A.dateOf(w, 6)) + '</span></div><button class="iconbtn" data-act="repWeek" data-d="1" aria-label="Next week"' + (w >= 36 ? ' disabled' : '') + '>›</button></div>';
    if (!has) h += '<div class="notice">Nothing is logged for this week yet, so the report only contains the plan.</div>';
    h += '<section class="card">' + tg('prompt', 'Include instructions for the AI', UI.prompt) + tg('trend', 'Include last week for comparison', UI.trend) + tg('json', 'Include raw data (JSON)', UI.json) + '</section>';
    h += '<div class="btns"><button class="btn full" data-act="copy">Copy report</button><button class="btn ghost" data-act="share">Share…</button><button class="btn ghost" data-act="save">Save file</button></div>';
    h += '<pre class="report" id="reportText" tabindex="0">' + esc(reportText()) + '</pre>';
    h += '<section class="card"><h3>Your data</h3><p class="hint">Everything is stored on this phone only. Deleting the app icon deletes the data, so export a backup now and then.' + (lb ? ' Last backup: ' + new Date(lb).toLocaleDateString() + '.' : ' No backup yet.') + '</p><div class="btns"><button class="btn ghost" data-act="export">Export backup</button><label class="btn ghost" style="display:grid;place-items:center;cursor:pointer">Import backup<input type="file" accept="application/json,.json" data-act="import" class="sr"></label><button class="btn danger full" data-act="reset">Erase all data</button></div></section></div>';
    return h;
  }
  async function shareFile(name, text, type) {
    const file = new File([text], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return true; } catch (e) { if (e.name === 'AbortError') return true; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return true;
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* ignore */ } ta.remove(); return ok;
    }
  }

  /* ---------- router ---------- */
  function route() { const p = (location.hash.replace(/^#\/?/, '') || 'today').split('/'); return { name: p[0], arg: p[1] }; }
  const TABS = { today: 'today', day: 'today', plan: 'plan', week: 'plan', moves: 'moves', report: 'report' };
  let lastRoute = '';
  function render(keepScroll) {
    const r = route(); let h = '', title = '36 Weeks';
    if (r.name === 'today') h = viewDay(A.todayK());
    else if (r.name === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(r.arg || '')) h = viewDay(r.arg);
    else if (r.name === 'plan') { h = viewPlan(); title = 'Plan'; }
    else if (r.name === 'week') { h = viewWeek(r.arg); title = 'Week ' + r.arg; }
    else if (r.name === 'moves') { h = viewMoves(); title = 'Moves'; }
    else if (r.name === 'report') { h = viewReport(); title = 'Report'; }
    else { location.hash = '#/today'; return; }
    const y = window.scrollY;
    $('#app').innerHTML = h;
    document.title = title + ' · 36 Weeks';
    document.querySelectorAll('.tabs a').forEach((a) => { if (a.dataset.tab === TABS[r.name]) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (keepScroll) window.scrollTo(0, y); else if (location.hash !== lastRoute) window.scrollTo(0, 0);
    lastRoute = location.hash;
    startFigs();
  }

  /* ---------- events ---------- */
  const ctxK = (el) => { const c = el.closest('[data-k]'); return c && c.dataset.k; };
  const ctxW = (el) => { const c = el.closest('[data-w]'); return c && +c.dataset.w; };
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, k = ctxK(el);
    if (el.type === 'checkbox' || el.type === 'file') return;
    if (act === 'set') {
      const f = el.dataset.f, v = /^\d+$/.test(el.dataset.v) ? +el.dataset.v : el.dataset.v;
      if (f.indexOf('wr.') === 0) { const w = ctxW(el), cur = (A.DB.wr[w] || {})[f.slice(3)]; A.setWR(w, f.slice(3), cur === v ? null : v); }
      else A.setF(k, f, A.LG(k)[f] === v ? null : v);
      render(true);
    } else if (act === 'day') goDay(A.addDays(k, +el.dataset.d));
    else if (act === 'toggleEx') { UI.open[el.dataset.key] = !UI.open[el.dataset.key]; render(true); }
    else if (act === 'tick') { const id = el.dataset.ex, cur = ((A.LG(k).ex || {})[id] || {}).d; A.setEx(k, id, { d: cur ? 0 : 1 }); render(true); }
    else if (act === 'pause') { UI.paused[el.dataset.fig] = !UI.paused[el.dataset.fig]; render(true); }
    else if (act === 'hideTip') { localStorage.setItem(TIP_KEY, '1'); render(true); }
    else if (act === 'reportFor') UI.repW = +el.dataset.w;
    else if (act === 'repWeek') { UI.repW = Math.min(36, Math.max(1, UI.repW + +el.dataset.d)); render(true); }
    else if (act === 'copy') toast((await copyText(reportText())) ? 'Report copied. Paste it into your AI chat.' : 'Couldn’t copy. Long-press the text to select it.');
    else if (act === 'share') { const t = reportText(); if (navigator.share) { try { await navigator.share({ title: 'Week ' + UI.repW + ' training report', text: t }); } catch (err) { /* cancelled */ } } else toast((await copyText(t)) ? 'Sharing isn’t available here; copied instead.' : 'Sharing isn’t available here.'); }
    else if (act === 'save') { await shareFile('week-' + UI.repW + '-report.md', reportText(), 'text/markdown'); }
    else if (act === 'export') { A.DB.meta.lastBackup = new Date().toISOString(); A.saveDB(); await shareFile('36-weeks-backup-' + A.todayK() + '.json', JSON.stringify(A.DB), 'application/json'); render(true); }
    else if (act === 'reset') { if (confirm('Erase ALL logs on this phone? This cannot be undone.') && confirm('Really erase everything? Export a backup first if unsure.')) { A.DB = A.fresh(); A.saveDB(); render(true); toast('All data erased.'); } }
  });
  document.addEventListener('change', (e) => {
    const el = e.target, act = el.dataset.act;
    if (act === 'red') { const k = ctxK(el), cur = (A.LG(k).red || []).slice(), i = cur.indexOf(el.dataset.id); if (el.checked && i < 0) cur.push(el.dataset.id); if (!el.checked && i >= 0) cur.splice(i, 1); A.setF(k, 'red', cur); render(true); }
    else if (act === 'opt') { UI[el.dataset.id] = el.checked; render(true); }
    else if (act === 'import') {
      const f = el.files[0]; if (!f) return;
      f.text().then((t) => {
        const o = JSON.parse(t); if (!o || typeof o.logs !== 'object') throw new Error('bad');
        const n = Object.keys(o.logs).length;
        if (confirm('Replace ALL data on this phone with this backup (' + n + ' logged days)?')) { o.wr = o.wr || {}; o.meta = o.meta || {}; A.DB = o; A.saveDB(); render(true); toast('Backup restored.'); }
      }).catch(() => toast('That file isn’t a valid backup.'));
    }
  });
  document.addEventListener('input', (e) => {
    const el = e.target, b = el.dataset.bind; if (!b) return;
    if (b.indexOf('wr.') === 0) { A.setWR(ctxW(el), b.slice(3), el.value.trim()); return; }
    const k = ctxK(el);
    if (b === 'exn') A.setEx(k, el.dataset.ex, { n: el.value.trim() });
    else if (b === 'min' || b === 'dist') { const v = parseFloat(el.value); A.setF(k, b, isFinite(v) && v >= 0 ? v : null); }
    else A.setF(k, b, el.value);
  });
  document.addEventListener('click', (e) => {
    const c = e.target.closest('#chart svg'); if (!c) return;
    const r = c.getBoundingClientRect(), n = Math.floor(((e.clientX - r.left) / r.width) * 36) + 1;
    if (n >= 1 && n <= 36) location.hash = '#/week/' + n;
  });
  window.addEventListener('hashchange', () => render(false));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && route().name === 'today') render(true); });

  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('./sw.js').catch(() => {});
  render(false);
})();
