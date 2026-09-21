/* Core helpers: dates, storage, daily plan derivation. Exposes window.APP. */
(function () {
  'use strict';
  const P = window.PLAN;
  const DOWS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DOWF = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MS = 86400000;

  const pk = (k) => { const a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2], 12); };
  const dk = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDays = (k, n) => { const d = pk(k); d.setDate(d.getDate() + n); return dk(d); };
  const diff = (a, b) => Math.round((pk(a) - pk(b)) / MS);
  const todayK = () => dk(new Date());
  const loc = (k) => { const d = diff(k, P.START); return d < 0 || d >= 252 ? null : { w: Math.floor(d / 7) + 1, dow: d % 7 }; };
  const dateOf = (w, dow) => addDays(P.START, (w - 1) * 7 + dow);
  const fmt = (k, y) => { const d = pk(k); return DOWS[(d.getDay() + 6) % 7] + ' ' + d.getDate() + ' ' + MONS[d.getMonth()] + (y ? ' ' + d.getFullYear() : ''); };
  const fmtDM = (k) => { const d = pk(k); return d.getDate() + ' ' + MONS[d.getMonth()]; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- storage ---------- */
  const LSK = 'wk36.v1';
  let DB;
  const fresh = () => ({ v: 1, logs: {}, wr: {}, meta: {} });
  function loadDB() {
    try { const o = JSON.parse(localStorage.getItem(LSK)); if (o && o.logs) { o.wr = o.wr || {}; o.meta = o.meta || {}; return o; } } catch (e) { /* ignore */ }
    return fresh();
  }
  DB = loadDB();
  let onFail = () => {};
  function saveDB() { try { localStorage.setItem(LSK, JSON.stringify(DB)); return true; } catch (e) { onFail(); return false; } }
  const LG = (k) => DB.logs[k] || {};
  function setF(k, f, v) {
    const l = DB.logs[k] || (DB.logs[k] = {});
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) delete l[f]; else l[f] = v;
    if (!Object.keys(l).length) delete DB.logs[k];
    saveDB();
  }
  function setEx(k, id, patch) {
    const l = LG(k), ex = Object.assign({}, l.ex || {});
    const cur = Object.assign({}, ex[id] || {}, patch);
    if (!cur.d) delete cur.d;
    if (!cur.n) delete cur.n;
    if (Object.keys(cur).length) ex[id] = cur; else delete ex[id];
    setF(k, 'ex', Object.keys(ex).length ? ex : undefined);
  }
  function setWR(w, f, v) {
    const r = DB.wr[w] || (DB.wr[w] = {});
    if (v === undefined || v === '' || v === null) delete r[f]; else r[f] = v;
    if (!Object.keys(r).length) delete DB.wr[w];
    saveDB();
  }

  /* ---------- plan for a date ---------- */
  const KIND = {
    rest: { label: 'Rest', cls: 'rest' }, run: { label: 'Run', cls: 'run' }, long: { label: 'Long run', cls: 'run' },
    bb: { label: 'Basketball', cls: 'bb' }, strA: { label: 'Strength A', cls: 'str' }, strB: { label: 'Strength B', cls: 'str' },
    mob: { label: 'Mobility', cls: 'str' }, rec: { label: 'Recovery', cls: 'rest' }, race: { label: 'Race day', cls: 'race' },
    choice: { label: 'Choose', cls: 'choice' },
  };
  function dayPlan(k) {
    const l = loc(k);
    if (!l) return null;
    const wk = P.WEEKS[l.w - 1], w = l.w, dow = l.dow;
    const b = { k, w, dow, wk };
    if (dow === 0) return Object.assign(b, { kind: 'rest' });
    if (dow === 1) return Object.assign(b, { kind: 'choice', title: 'Basketball or run', run: wk.r1, options: [['bb', 'Basketball'], ['run', 'Run'], ['rest', 'Rest']] });
    if (dow === 2) return Object.assign(b, { kind: 'strA', mode: w >= 35 ? 'light' : wk.smode, optional: w === 36 });
    if (dow === 3) return Object.assign(b, { kind: 'run', run: wk.r2 });
    if (dow === 4) return Object.assign(b, w === 36 ? { kind: 'mob' } : { kind: 'strB', mode: wk.smode });
    if (dow === 5) return Object.assign(b, w === 36 ? { kind: 'rest', note: 'Rest day before the race. Gentle mobility is fine.' } : { kind: 'long', run: wk.lg });
    if (w === 36) return Object.assign(b, { kind: 'race', run: '21.1 km' });
    return Object.assign(b, { kind: 'choice', title: 'Basketball or recovery', options: [['bb', 'Basketball'], ['rec', 'Recovery'], ['rest', 'Rest']] });
  }
  function effKind(pl, lg) {
    if (!pl) return null;
    if (pl.kind !== 'choice') return pl.kind;
    return lg.did || 'choice';
  }
  const SEV = { g: 0, y: 1, r: 2 };
  const sev = (v) => (v == null ? null : v <= 2 ? 'g' : v <= 4 ? 'y' : 'r');
  const worse = (a, b) => (a == null ? b : b == null ? a : SEV[b] > SEV[a] ? b : a);
  const setsFor = (e, mode) => {
    if (e.grp !== 'A' && e.grp !== 'B') return e.rx.s;
    if (mode === 'reduced') return Math.max(2, e.rx.s - 1);
    if (mode === 'light') return Math.min(2, e.rx.s);
    return e.rx.s;
  };
  const rxText = (e, mode) => ((e.grp === 'A' || e.grp === 'B' || e.grp === 'M' || e.grp === 'W') && setsFor(e, mode) > 1 ? setsFor(e, mode) + ' × ' + e.rx.r : e.rx.r);
  const parseMin = (s) => { const m = String(s || '').match(/(\d+)(?:\s*[–-]\s*(\d+))?/); return m ? (m[2] ? (+m[1] + +m[2]) / 2 : +m[1]) : 0; };
  const strengthNote = (w) => (P.STRENGTH_NOTES.find((n) => w >= n[0] && w <= n[1]) || [0, 0, ''])[2];

  window.APP = {
    P, DOWS, DOWF, MONS, pk, dk, addDays, diff, todayK, loc, dateOf, fmt, fmtDM, esc, KIND,
    get DB() { return DB; }, set DB(v) { DB = v; }, saveDB, LG, setF, setEx, setWR, dayPlan, effKind, sev, worse, SEV,
    setsFor, rxText, parseMin, strengthNote, fresh, onFail: (fn) => { onFail = fn; },
  };
})();
