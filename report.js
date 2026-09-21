/* Weekly stats + report text generator. Exposes APP.report */
(function () {
  'use strict';
  const A = window.APP, P = A.P;
  const n1 = (x) => Math.round(x * 10) / 10;
  const ZN = { g: 'Green', y: 'Yellow', r: 'Above yellow range' };

  function painVals(k) {
    const l = A.LG(k), nx = A.LG(A.addDays(k, 1));
    return { kAm: l.kAm, kPost: l.kPost, kNext: nx.kAm, aAm: l.aAm, aPost: l.aPost, aNext: nx.aAm };
  }
  function actual(pl, lg) {
    const kind = A.effKind(pl, lg), K = A.KIND;
    const stTxt = { done: 'done', partial: 'partly done', skipped: 'skipped' }[lg.st];
    if (kind === 'choice') return lg.st === 'skipped' ? 'Skipped' : 'Not logged';
    if (kind === 'rest') return pl.kind === 'rest' ? 'Rest' : 'Rest (no session)';
    if (lg.st === 'skipped') return K[kind].label + ' — skipped';
    const bits = [];
    if (lg.min) bits.push(lg.min + ' min');
    if (lg.dist) bits.push(lg.dist + ' km');
    if (lg.min && lg.dist && /run|long|race/.test(kind)) { const pc = lg.min / lg.dist; bits.push('avg pace ' + Math.floor(pc) + ':' + String(Math.round((pc % 1) * 60)).padStart(2, '0') + '/km'); }
    if (lg.rpe) bits.push('RPE ' + lg.rpe + '/10');
    if (lg.fat) bits.push('fatigue ' + lg.fat + '/10');
    if (kind === 'bb' && lg.bbi) bits.push(lg.bbi + ' intensity');
    if (/^str|mob|bb/.test(kind) && kind !== 'bb') {
      const ids = kind === 'strA' ? P.SESSIONS.A : kind === 'strB' ? P.SESSIONS.B : P.SESSIONS.M;
      const c = ids.filter((id) => lg.ex && lg.ex[id] && lg.ex[id].d).length;
      if (c) bits.push(c + '/' + ids.length + ' exercises ticked');
    }
    if (!stTxt && !bits.length) return 'Not logged';
    return K[kind].label + ' — ' + [stTxt].concat(bits).filter(Boolean).join(', ');
  }
  function planned(pl) {
    const w = pl.wk;
    switch (pl.kind) {
      case 'rest': return 'Rest';
      case 'choice': return pl.dow === 1 ? 'Basketball or run (' + w.r1 + ')' : 'Basketball or recovery';
      case 'strA': return 'Strength A' + (pl.mode !== 'full' ? ' (' + pl.mode + ')' : '');
      case 'strB': return 'Strength B + mobility' + (pl.mode !== 'full' ? ' (' + pl.mode + ')' : '');
      case 'mob': return 'Mobility';
      case 'run': return 'Run ' + w.r2;
      case 'long': return 'Long run ' + w.lg;
      case 'race': return 'RACE — 21.1 km';
      default: return '';
    }
  }

  function weekStats(wn) {
    const S = { runs: 0, runMin: 0, runKm: 0, longest: 0, bb: 0, bbMin: 0, bbInt: [], str: 0, exDone: 0, exTot: 0, mob: 0, skipped: 0, unlogged: [], peak: null, flags: [], days: [] };
    for (let dow = 0; dow < 7; dow++) {
      const k = A.dateOf(wn, dow), pl = A.dayPlan(k), lg = A.LG(k), kind = A.effKind(pl, lg);
      const did = lg.st === 'done' || lg.st === 'partial';
      if (lg.st === 'skipped') S.skipped++;
      if ((kind === 'run' || kind === 'long') && (did || lg.min)) { S.runs++; S.runMin += lg.min || 0; S.runKm += lg.dist || 0; S.longest = Math.max(S.longest, lg.min || 0); }
      if (kind === 'bb' && did) { S.bb++; S.bbMin += lg.min || 0; if (lg.bbi) S.bbInt.push(lg.bbi); }
      if ((kind === 'strA' || kind === 'strB') && did) S.str++;
      if (kind === 'mob' && did) S.mob++;
      if (kind === 'strA' || kind === 'strB') {
        const ids = P.SESSIONS[kind === 'strA' ? 'A' : 'B'];
        S.exTot += ids.length; S.exDone += ids.filter((id) => lg.ex && lg.ex[id] && lg.ex[id].d).length;
      }
      const pv = painVals(k);
      const vals = Object.keys(pv).map((x) => pv[x]).filter((v) => v != null);
      let worst = null; vals.forEach((v) => { worst = A.worse(worst, A.sev(v)); });
      if (worst) S.peak = A.worse(S.peak, worst);
      (lg.red || []).forEach((id) => { const f = P.RED_FLAGS.find((r) => r[0] === id); S.flags.push(A.fmt(k) + ': ' + (f ? f[1] : id)); });
      const empty = !Object.keys(lg).length && pl.kind !== 'rest';
      if (empty) S.unlogged.push(A.DOWS[dow]);
      S.days.push({ k, dow, pl, lg, pv, worst, vals: vals.length });
    }
    S.runKm = n1(S.runKm);
    return S;
  }

  const AI_PROMPT = [
    'I am training for a half-marathon on ' + A.fmt(P.RACE, true) + ' while also playing basketball. Below is my training report for one week. Please review it like a cautious running and strength coach.',
    '',
    'Rules from my plan:',
    '- Pain overrides the calendar. Green = 0–2/10 and back to baseline by next morning. Yellow = 3–4/10 or clearly increased next-morning pain/stiffness (reduce the next workout). Red = rapid/significant pain, limp, swelling, giving way, significant weakness, inability to walk normally, sudden Achilles pop/sharp pain, or progressive worsening (stop and get medical assessment).',
    '- Progress only when knee and Achilles response is acceptable. Do not automatically make up missed sessions.',
    '- Basketball counts as a substantial lower-body session. Monday is complete rest.',
    '- The plan is a roadmap, not a rigid prescription; the primary goal is to finish healthy.',
    '',
    'Please answer:',
    '1. Was the week completed well enough to progress?',
    '2. Any yellow/red signals or patterns (for example pain after a specific session type)?',
    '3. Should next week progress, hold or deload? Give concrete changes to run durations, basketball and strength.',
    '4. Anything I should track differently next week.',
    'If any red-flag sign is present, tell me to see a clinician rather than train through it.',
  ].join('\n');

  const cell = (v) => (v == null ? '–' : String(v));
  const table = (head, rows) => ['| ' + head.join(' | ') + ' |', '| ' + head.map(() => '---').join(' | ') + ' |'].concat(rows.map((r) => '| ' + r.join(' | ') + ' |')).join('\n');

  function summaryLine(S) {
    return 'Runs logged: ' + S.runs + ' (' + S.runMin + ' min, ' + S.runKm + ' km, longest ' + S.longest + ' min) · Basketball: ' + S.bb + (S.bb ? ' (' + S.bbMin + ' min' + (S.bbInt.length ? ', ' + S.bbInt.join('/') : '') + ')' : '') + ' · Strength sessions: ' + S.str + ' · Mobility: ' + S.mob + ' · Peak pain zone: ' + (S.peak ? ZN[S.peak] : 'no pain data');
  }

  function build(wn, o) {
    o = o || {};
    const wk = P.WEEKS[wn - 1], S = weekStats(wn), out = [];
    const s = A.dateOf(wn, 0), e = A.dateOf(wn, 6);
    if (o.prompt) { out.push(AI_PROMPT, '', '---', ''); }
    out.push('# Weekly training report — Week ' + wn + ' of 36');
    out.push(A.fmt(s, true) + ' to ' + A.fmt(e, true) + ' · Phase: ' + P.PHASES[wk.ph].name + (wk.deload ? ' (deload week)' : '') + ' · ' + (36 - wn) + ' weeks until race week');
    out.push('', '## Roadmap targets for this week');
    out.push('- Runs: ' + wk.runs + ' — Tue ' + wk.r1 + ' (only if not playing basketball) / Thu ' + wk.r2 + ' / Sat ' + (wk.lg || 'race weekend'));
    out.push('- Basketball: ' + wk.bb);
    out.push('- Strength: ' + wk.str);
    out.push('- Focus: ' + wk.focus);
    out.push('', '## What happened');
    out.push(table(['Day', 'Planned', 'Actual', 'Notes'], S.days.map((d) => [A.DOWS[d.dow] + ' ' + A.fmtDM(d.k), planned(d.pl), actual(d.pl, d.lg), (d.lg.note || '').replace(/\|/g, '/').replace(/\n/g, ' ') || '–'])));
    out.push('', '## Totals');
    out.push('- Running: ' + S.runs + ' run(s), ' + S.runMin + ' min, ' + S.runKm + ' km, longest ' + S.longest + ' min');
    out.push('- Basketball: ' + S.bb + ' session(s), ' + S.bbMin + ' min' + (S.bbInt.length ? ', intensity: ' + S.bbInt.join(', ') : ''));
    out.push('- Strength: ' + S.str + ' session(s); exercises ticked ' + S.exDone + '/' + S.exTot + '; mobility sessions ' + S.mob);
    out.push('- Skipped sessions: ' + S.skipped + ' · Days with nothing logged: ' + (S.unlogged.length ? S.unlogged.join(', ') : 'none'));

    out.push('', '## Knee and Achilles (0–10)');
    const rows = S.days.filter((d) => d.vals).map((d) => [A.DOWS[d.dow] + ' ' + A.fmtDM(d.k), cell(d.pv.kAm), cell(d.pv.kPost), cell(d.pv.kNext), cell(d.pv.aAm), cell(d.pv.aPost), cell(d.pv.aNext), d.worst ? ZN[d.worst] : '–']);
    if (rows.length) {
      out.push('AM = that morning before training; After = right after the session; Next AM = next morning\'s check.');
      out.push(table(['Day', 'Knee AM', 'Knee after', 'Knee next AM', 'Achilles AM', 'Achilles after', 'Achilles next AM', 'Zone'], rows));
    } else out.push('No pain data logged.');
    out.push('Red-flag symptoms reported: ' + (S.flags.length ? S.flags.join('; ') : 'none'));

    const wr = A.DB.wr[wn] || {};
    out.push('', '## Weekly review');
    out.push('- General fatigue (1–10): ' + (wr.fat || 'not logged'));
    out.push('- Schedule constraints: ' + (wr.sched || 'none noted'));
    out.push('- Notes: ' + (wr.note || 'none'));

    const loads = [];
    S.days.forEach((d) => {
      const ex = d.lg.ex || {};
      Object.keys(ex).forEach((id) => { if (ex[id].n && P.EX[id]) loads.push('- ' + A.DOWS[d.dow] + ' ' + P.EX[id].name + ': ' + ex[id].n); });
    });
    if (loads.length) out.push('', '## Strength log', loads.join('\n'));

    if (o.trend && wn > 1) {
      const pw = weekStats(wn - 1);
      out.push('', '## Previous week (Week ' + (wn - 1) + ') for comparison', summaryLine(pw));
    }
    if (wn < 36) {
      const nx = P.WEEKS[wn];
      out.push('', '## Roadmap for next week (Week ' + (wn + 1) + ') — adjust as needed');
      out.push('- Runs: Tue ' + nx.r1 + ' / Thu ' + nx.r2 + ' / Sat ' + (nx.lg || 'race weekend') + ' · Basketball: ' + nx.bb + ' · Strength: ' + nx.str + ' · Focus: ' + nx.focus);
    }
    if (o.json) {
      const data = S.days.map((d) => ({ date: d.k, planned: planned(d.pl), log: d.lg }));
      out.push('', '## Raw data (JSON)', '```json', JSON.stringify({ week: wn, days: data, review: wr }, null, 1), '```');
    }
    return out.join('\n');
  }

  A.report = { build, weekStats, summaryLine, hasData: (wn) => weekStats(wn).days.some((d) => Object.keys(d.lg).length) || !!A.DB.wr[wn] };
})();
