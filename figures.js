/* Side-view stick-figure engine. Poses are defined with joint angles, then
   auto-grounded, so every exercise is a few keyframes that animate smoothly.
   Angles are in degrees from "straight down"; positive = toward the front (right).
   t = torso lean from vertical (0 upright, +forward, ±90 horizontal),
   a/b/c = thigh/shin/foot, e/f = upper arm/forearm. Suffix 2 = far side. */
(function (root) {
  const GY = 152, X0 = 120, W = 240, H = 170, SW = 4.5, S = 0.84; // S scales the figure; prop/pin sizes below are in 'design units' (x S)
  const L = { torso: 50 * S, neck: 17 * S, thigh: 44 * S, shin: 44 * S, foot: 14 * S, ua: 26 * S, fa: 24 * S, head: 8.5 * S };
  const rad = (d) => (d * Math.PI) / 180;
  const dn = (d) => [Math.sin(rad(d)), Math.cos(rad(d))];
  const upv = (d) => [Math.sin(rad(d)), -Math.cos(rad(d))];
  const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const DEF = { t: 0, h: 0, a: 0, b: 0, c: 90, e: 6, f: 8, hx: 0 };
  const KEYS = ['t', 'h', 'a', 'b', 'c', 'e', 'f', 'a2', 'b2', 'c2', 'e2', 'f2', 'hx'];

  function full(p) {
    const q = Object.assign({}, DEF, p);
    ['a', 'b', 'c', 'e', 'f'].forEach((k) => { q[k + '2'] = p[k + '2'] !== undefined ? p[k + '2'] : q[k]; });
    return q;
  }
  const swap = (p) => {
    const q = full(p), o = Object.assign({}, q);
    ['a', 'b', 'c', 'e', 'f'].forEach((k) => { o[k] = q[k + '2']; o[k + '2'] = q[k]; });
    return o;
  };

  function geom(q, fig) {
    const hip = [0, 0];
    const sh = add(hip, upv(q.t), L.torso);
    const head = add(sh, upv(q.t + q.h), L.neck);
    const P = { hip, sh, head };
    ['', '2'].forEach((s) => {
      P['knee' + s] = add(hip, dn(q['a' + s]), L.thigh);
      P['ankle' + s] = add(P['knee' + s], dn(q['b' + s]), L.shin);
      P['toe' + s] = add(P['ankle' + s], dn(q['c' + s]), L.foot);
      P['elbow' + s] = add(sh, dn(q['e' + s]), L.ua);
      P['wrist' + s] = add(P['elbow' + s], dn(q['f' + s]), L.fa);
    });
    // place on the page
    const ap = P[fig.anchor || 'ankle'];
    const ox = X0 + (fig.ax || 0) * S + q.hx * S - ap[0];
    let oy;
    if (fig.pin) oy = GY - fig.pin.h * S - SW / 2 - P[fig.pin.pt][1];
    else {
      let low = -1e9;
      Object.keys(P).forEach((k) => { if (k !== 'head' && P[k][1] > low) low = P[k][1]; });
      oy = GY - SW / 2 - low;
    }
    Object.keys(P).forEach((k) => { P[k] = [P[k][0] + ox, P[k][1] + oy]; });
    return P;
  }

  const f1 = (n) => n.toFixed(1);
  const pt = (p) => f1(p[0]) + ',' + f1(p[1]);

  function draw(fig, q, C) {
    C = C || {};
    const col = Object.assign({ body: 'var(--fig-body)', far: 'var(--fig-far)', hl: 'var(--fig-hl)', prop: 'var(--fig-prop)', floor: 'var(--fig-floor)', bg: 'var(--fig-bg)' }, C);
    const P = geom(q, fig);
    const hl = fig.hl || [];
    const seg = (a, b, group, far, w) => {
      const c = hl.indexOf(group) >= 0 ? col.hl : far ? col.far : col.body;
      return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" style="stroke:' + c + '" stroke-width="' + (w || SW) + '" stroke-linecap="round"/>';
    };
    let s = '';
    // scene
    s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" style="fill:' + col.bg + '"/>';
    const pr = fig.props || {};
    if (pr.mat) s += '<rect x="24" y="' + GY + '" width="192" height="5" rx="2.5" style="fill:' + col.prop + '" opacity=".35"/>';
    if (pr.box) s += '<rect x="' + f1(X0 + pr.box[0] * S) + '" y="' + f1(GY - pr.box[2] * S) + '" width="' + f1(pr.box[1] * S) + '" height="' + f1(pr.box[2] * S) + '" rx="3" style="fill:' + col.prop + '" opacity=".45"/>';
    if (pr.wall) {
      const wx = X0 + pr.wall[0] * S, sideL = pr.wall[1] === 'L';
      s += '<rect x="' + (sideL ? wx - 8 : wx) + '" y="14" width="8" height="' + (GY - 14) + '" style="fill:' + col.prop + '" opacity=".35"/>';
    }
    s += '<line x1="12" y1="' + GY + '" x2="228" y2="' + GY + '" style="stroke:' + col.floor + '" stroke-width="2" stroke-linecap="round"/>';
    // far side
    s += seg(P.sh, P.elbow2, 'arms', true) + seg(P.elbow2, P.wrist2, 'arms', true);
    s += seg(P.hip, P.knee2, 'thighs', true) + seg(P.knee2, P.ankle2, 'shins', true) + seg(P.ankle2, P.toe2, 'feet', true);
    // trunk
    s += seg(P.hip, P.sh, 'torso', false, 6.5);
    // near side
    s += seg(P.hip, P.knee, 'thighs') + seg(P.knee, P.ankle, 'shins') + seg(P.ankle, P.toe, 'feet');
    s += seg(P.sh, P.elbow, 'arms') + seg(P.elbow, P.wrist, 'arms');
    s += '<circle cx="' + f1(P.head[0]) + '" cy="' + f1(P.head[1]) + '" r="' + f1(L.head) + '" style="fill:' + col.bg + ';stroke:' + col.body + '" stroke-width="3.5"/>';
    if (pr.db) s += '<circle cx="' + f1(P.wrist[0]) + '" cy="' + f1(P.wrist[1]) + '" r="6" style="fill:' + col.prop + '"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (fig.label || 'exercise demo') + '">' + s + '</svg>';
  }

  const ease = (x) => (1 - Math.cos(Math.PI * x)) / 2;
  const HOLD = 0.45, MOVE = 0.95;
  function poseAt(fig, sec) {
    const seq = fig.seq;
    const seg = HOLD + MOVE;
    const cyc = seg * seq.length;
    const t = ((sec % cyc) + cyc) % cyc;
    const i = Math.floor(t / seg), w = t - i * seg;
    const A = fig.frames[seq[i]], B = fig.frames[seq[(i + 1) % seq.length]];
    const k = w < HOLD ? 0 : ease((w - HOLD) / MOVE);
    const q = {};
    KEYS.forEach((key) => { q[key] = A[key] + (B[key] - A[key]) * k; });
    return q;
  }

  /* ---------------- Poses ---------------- */
  const FIGS = {};
  const def = (id, o) => {
    o.frames = o.frames.map(full);
    o.seq = o.seq || (o.frames.length === 2 ? [0, 1] : o.frames.map((_, i) => i));
    o.label = o.label || id;
    FIGS[id] = o;
  };

  def('boxsquat', {
    anchor: 'ankle', hl: ['thighs'], props: { box: [-52, 46, 38], db: true },
    frames: [{ t: 4, e: 12, f: 152 }, { t: 24, a: 88, b: -22, e: 8, f: 150 }],
  });
  def('rdl', {
    anchor: 'ankle', hl: ['thighs'], props: { db: true },
    frames: [{ t: 2, e: 0, f: 0 }, { t: 62, a: 14, b: 4, e: -22, f: -12 }],
  });
  def('stepup', {
    anchor: 'ankle', hl: ['thighs'], pin: { pt: 'ankle', h: 30 }, props: { box: [-20, 64, 30] },
    frames: [{ t: 16, a: 68, b: -22, c: 90, a2: -8, b2: -8, e: -10, f: 10 }, { t: 4, a: 2, b: 2, a2: 62, b2: -8, c2: 70, e: -10, f: 10 }],
  });
  def('slcalf', {
    anchor: 'ankle', hl: ['shins'], props: { wall: [54] },
    frames: [
      { t: 0, a: 0, b: 0, c: 90, a2: -4, b2: -108, c2: 60, e: 78, f: 84 },
      { t: 0, a: 0, b: 0, c: 40, a2: -4, b2: -108, c2: 60, e: 78, f: 84 },
    ],
  });
  def('sideplank', {
    anchor: 'wrist', ax: 62, hl: ['torso'], props: { mat: true },
    frames: [
      { t: 70, h: -35, a: -88, b: -88, c: 40, e: 45, f: 90, e2: 180, f2: 180 },
      { t: 80, h: -45, a: -80, b: -80, c: 20, e: 0, f: 90, e2: 180, f2: 180 },
    ],
  });
  def('deadbug', {
    anchor: 'hip', hl: ['torso'], props: { mat: true },
    frames: [
      { t: -90, a: 180, b: 90, c: 90, e: 180, f: 180 },
      { t: -90, a: 180, b: 90, c: 90, e: 180, f: 180, e2: -90, f2: -90, a2: 100, b2: 100, c2: 90 },
      { t: -90, a: 100, b: 100, c: 90, e: -90, f: -90, a2: 180, b2: 90, c2: 90, e2: 180, f2: 180 },
    ],
    seq: [0, 1, 0, 2],
  });
  def('bridge', {
    anchor: 'ankle', ax: 38, hl: ['thighs'], props: { mat: true },
    frames: [
      { t: -90, a: 130, b: 50, c: 90, e: 88, f: 88 },
      { t: -118, a: 118, b: 0, c: 90, e: 88, f: 88 },
    ],
  });
  def('revlunge', {
    anchor: 'ankle', hl: ['thighs'],
    frames: [
      { t: 0, a: 0, b: 0, c: 90, a2: 0, b2: 0, c2: 90, e: 10, f: 30 },
      { t: 4, a: 86, b: -4, c: 90, a2: -6, b2: -106, c2: -10, e: 10, f: 30 },
    ],
  });
  def('bkcalf', {
    anchor: 'ankle', hl: ['shins'],
    frames: [
      { t: 14, a: 42, b: -20, c: 90, e: 60, f: 70 },
      { t: 14, a: 42, b: -20, c: 40, e: 60, f: 70 },
    ],
  });
  def('birddog', {
    anchor: 'wrist', ax: 50, hl: ['torso'], props: { mat: true },
    frames: [
      { t: 83, a: 0, b: -90, c: -90, e: 0, f: 0 },
      { t: 83, a: 0, b: -90, c: -90, e: 0, f: 0, e2: 92, f2: 92, a2: -84, b2: -84, c2: -90 },
      { t: 83, a: -84, b: -84, c: -90, e: 92, f: 92, a2: 0, b2: -90, c2: -90, e2: 0, f2: 0 },
    ],
    seq: [0, 1, 0, 2],
  });
  def('wallsit', {
    anchor: 'hip', hl: ['thighs'], props: { wall: [-5, 'L'] },
    frames: [
      { t: 0, a: 22, b: 22, c: 90, e: 30, f: 60 },
      { t: 0, a: 90, b: 0, c: 90, e: 30, f: 60 },
    ],
  });
  def('ankle', {
    anchor: 'ankle', hl: ['shins'], props: { wall: [24] },
    frames: [
      { t: 0, a: 6, b: 2, c: 90, a2: -10, b2: -10, c2: 90, e: 10, f: 100 },
      { t: 8, a: 40, b: -26, c: 90, a2: -10, b2: -10, c2: 90, e: 10, f: 100 },
    ],
  });
  def('calfstretch', {
    anchor: 'wrist', hl: ['shins'], props: { wall: [8] },
    frames: [
      { t: 0, a: 4, b: 4, c: 90, a2: -6, b2: -6, c2: 90, e: 88, f: 88 },
      { t: 18, a: 40, b: -6, c: 90, a2: -22, b2: -22, c2: 90, e: 88, f: 88 },
    ],
  });
  def('hipflexor', {
    anchor: 'ankle', hl: ['thighs'], props: { mat: true },
    frames: [
      { t: 0, a: 90, b: 0, c: 90, a2: 0, b2: -90, c2: -90, e: 10, f: 30 },
      { t: 0, a: 100, b: 8, c: 90, a2: -16, b2: -90, c2: -90, e: 10, f: 30 },
    ],
  });
  def('legswing', {
    anchor: 'ankle', hl: ['thighs'],
    frames: [
      { t: -4, a: 0, b: 0, c: 90, a2: 52, b2: 52, c2: 90, e: 50, f: 40, e2: -40, f2: -20 },
      { t: 6, a: 0, b: 0, c: 90, a2: -34, b2: -34, c2: 90, e: 50, f: 40, e2: -40, f2: -20 },
    ],
  });
  def('walklunge', {
    anchor: 'ankle2', hl: ['thighs'],
    frames: [
      { t: 0, a: 0, b: 0, c: 90, a2: 0, b2: 0, c2: 90, e: 10, f: 40 },
      { t: 2, a: 86, b: -4, c: 90, a2: -6, b2: -106, c2: -10, e: 10, f: 40 },
    ],
  });
  def('calfdouble', {
    anchor: 'ankle', hl: ['shins'],
    frames: [{ t: 0, a: 0, b: 0, c: 90, e: 4, f: 6 }, { t: 0, a: 0, b: 0, c: 40, e: 4, f: 6 }],
  });
  def('shuffle', {
    anchor: 'ankle', hl: ['thighs'],
    frames: [
      { t: 30, a: 62, b: -30, c: 90, e: 50, f: 80 },
      { t: 26, a: 50, b: -24, c: 90, a2: 60, b2: -26, e: 50, f: 80 },
    ],
  });

  const runA = { t: 8, a: 62, b: -16, c: 60, a2: -28, b2: -70, c2: 50, e: -50, f: -20, e2: 42, f2: 100 };
  def('runform', { anchor: 'hip', hl: ['torso'], frames: [runA, swap(runA)] });
  const buildA = { t: 16, a: 72, b: -22, c: 55, a2: -34, b2: -84, c2: 45, e: -64, f: -30, e2: 52, f2: 108 };
  def('buildup', { anchor: 'hip', hl: ['thighs'], frames: [buildA, swap(buildA)] });


  def('gobletsquat', {
    anchor: 'ankle', hl: ['thighs'], props: { db: true },
    frames: [{ t: 4, e: 12, f: 152 }, { t: 22, a: 96, b: -24, e: 8, f: 150 }],
  });
  def('splitsquat', {
    anchor: 'ankle', ax: 20, hl: ['thighs'], props: { box: [-96, 46, 34] },
    frames: [
      { t: 4, a: 12, b: 2, c: 90, a2: -32, b2: -75, c2: -20, e: 10, f: 40 },
      { t: 6, a: 66, b: -8, c: 90, a2: -22, b2: -104, c2: -20, e: 10, f: 40 },
    ],
  });
  def('stepdown', {
    anchor: 'ankle', hl: ['thighs'], pin: { pt: 'ankle', h: 14 }, props: { box: [-24, 60, 14] },
    frames: [
      { t: 2, a: 2, b: 2, c: 90, a2: 6, b2: 6, c2: 90, e: 30, f: 60 },
      { t: 10, a: 62, b: -32, c: 90, a2: 28, b2: -40, c2: 80, e: 30, f: 60 },
    ],
  });
  def('slbalance', {
    anchor: 'ankle', hl: ['shins'],
    frames: [
      { t: 0, a: 0, b: 0, c: 90, a2: 30, b2: -25, c2: 90, e: 40, f: 40, e2: -40, f2: -40 },
      { t: 2, a: 2, b: 2, c: 90, a2: 34, b2: -30, c2: 90, e: 55, f: 55, e2: -55, f2: -55 },
    ],
  });
  def('sldl', {
    anchor: 'ankle', hl: ['thighs'],
    frames: [
      { t: 2, a: 0, b: 0, c: 90, e: 0, f: 0 },
      { t: 78, a: 6, b: 2, c: 90, a2: -80, b2: -80, c2: -60, e: -10, f: -5 },
    ],
  });
  def('tibraise', {
    anchor: 'hip', ax: 10, hl: ['shins'], props: { wall: [-3, 'L'] },
    frames: [
      { t: -4, a: 22, b: 22, c: 90, e: 10, f: 30 },
      { t: -4, a: 22, b: 22, c: 128, e: 10, f: 30 },
    ],
  });
  def('bandwalk', {
    anchor: 'ankle', hl: ['thighs'],
    frames: [
      { t: 16, a: 40, b: -22, c: 90, a2: 46, b2: -28, c2: 90, e: 30, f: 90 },
      { t: 14, a: 34, b: -18, c: 90, a2: 30, b2: -14, c2: 90, e: 30, f: 90 },
    ],
  });

  const api = { FIGS, W, H, GY, poseAt, draw, geom, full, swap, L };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FIG = api;
})(typeof window !== 'undefined' ? window : globalThis);
