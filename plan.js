/* Plan data — from the "36-Week Roadmap" and the "Weekly Training Plan" (Phase 1) documents.
   Week 1 starts Mon 21 Sep 2026 (race day Sun 30 May 2027 is the last day of week 36).
   Strength A/B exercises and the warm-up come from the Weekly Training Plan. */
(function () {
  const RACE = '2027-05-30';
  const START = '2026-09-21';

  const PHASES = {
    F: { name: 'Foundation', color: '--ph-f' },
    A: { name: 'Aerobic development', color: '--ph-a' },
    H: { name: 'Half-marathon specific', color: '--ph-h' },
    T: { name: 'Taper', color: '--ph-t' },
    R: { name: 'Race week', color: '--ph-r' },
  };

  // [week, phase, runsLabel, run1(Tue), run2(Thu), long(Sat), longMin(for chart), basketball, strength, focus, deload]
  const R = (n, ph, runs, r1, r2, lg, lm, bb, str, focus, deload) =>
    ({ n, ph, runs, r1, r2, lg, lm, bb, str, focus, deload: !!deload });

  const WEEKS = [
    R(1, 'F', '2 runs', '30 min', '30 min', '45 min', 45, 'Up to 2 BB exposures', 'Strength A + B', 'Establish routine; easy running only.'),
    R(2, 'F', '2 runs', '35 min', '35 min', '50 min', 50, 'Up to 2 BB', 'A + B', 'Small increase; monitor next morning.'),
    R(3, 'F', '2 runs', '35–40 min', '40 min', '55–60 min', 57, 'Up to 2 BB', 'A + B', 'Highest initial build week.'),
    R(4, 'F', '2 runs', '30 min', '30 min', '45–50 min', 47, 'Up to 2 BB', 'A + B, reduced if needed', 'Deliberately easier week.', 1),
    R(5, 'F', '2 runs', '30–35 min', '35 min', '50 min', 50, '1–2 BB', 'A + B', 'Rebuild after Week 4.'),
    R(6, 'F', '2 runs', '35 min', '35–40 min', '55 min', 55, '1–2 BB', 'A + B', 'Increase long run modestly.'),
    R(7, 'F', '2 runs', '35–40 min', '40 min', '60 min', 60, '1–2 BB', 'A + B', 'Continue easy aerobic work.'),
    R(8, 'F', '2 runs', '30 min', '30–35 min', '50 min', 50, '1–2 BB', 'A + B, reduced', 'Absorb training; no speed work.', 1),
    R(9, 'F', '2–3 runs if tolerated', '30–35 min', '35–40 min', '60 min', 60, '1–2 BB', 'A + B', 'Optional short third easy run only if stable.'),
    R(10, 'F', '2–3 runs', '35 min', '40 min', '65 min', 65, '1–2 BB', 'A + B', 'Build aerobic consistency.'),
    R(11, 'F', '2–3 runs', '35–40 min', '40 min', '70 min', 70, '1–2 BB', 'A + B', 'Continue gradual long-run growth.'),
    R(12, 'F', '2–3 runs', '30 min', '35 min', '55–60 min', 57, '1–2 BB', 'A + B, reduced', 'Recovery week.', 1),
    R(13, 'A', '3 runs if tolerated', '30–35 min easy', '35–40 min easy', '65 min', 65, '1–2 BB', 'A + B', 'Transition toward 3 running exposures.'),
    R(14, 'A', '3 runs', '35 min easy', '40 min easy', '70 min', 70, '1–2 BB', 'A + B', 'All running remains controlled.'),
    R(15, 'A', '3 runs', '35 min easy', '40–45 min easy', '75 min', 75, '1–2 BB', 'A + B', 'Increase long-run duration.'),
    R(16, 'A', '3 runs', '30 min easy', '35 min easy', '60 min', 60, '1–2 BB', 'A + B, reduced', 'Absorb load.', 1),
    R(17, 'A', '3 runs', '35 min easy', '40 min easy', '75–80 min', 77, '1–2 BB', 'A + B', 'Steady aerobic development.'),
    R(18, 'A', '3 runs', '35 min easy', '45 min easy', '85 min', 85, '1–2 BB', 'A + B', 'Long run moves toward ~12 km depending on pace.'),
    R(19, 'A', '3 runs', '35–40 min easy', '45 min easy', '90 min', 90, '1–2 BB', 'A + B', 'Maintain easy effort.'),
    R(20, 'A', '3 runs', '30 min easy', '35–40 min easy', '70 min', 70, '1–2 BB', 'A + B, reduced', 'Recovery week.', 1),
    R(21, 'A', '3 runs', '35 min easy', '40 min easy + 4–6 relaxed strides', '90 min', 90, '1–2 BB', 'A + B', 'Only introduce strides if symptoms and movement are stable.'),
    R(22, 'A', '3 runs', '35–40 min easy', '45 min controlled', '95 min', 95, '1–2 BB', 'A + B', 'Controlled quality may begin if tolerance is established.'),
    R(23, 'A', '3 runs', '40 min easy', '45 min controlled', '100 min', 100, '1–2 BB', 'A + B', 'Build toward ~14–15 km depending on pace.'),
    R(24, 'A', '3 runs', '30–35 min easy', '40 min easy', '75 min', 75, '1–2 BB', 'A + B, reduced', 'Recovery and symptom check.', 1),
    R(25, 'H', '3 runs', '35 min easy', '45 min controlled', '100–105 min', 102, '1–2 BB', 'A + B', 'Begin more race-specific work only if ready.'),
    R(26, 'H', '3 runs', '35–40 min easy', '45 min controlled', '110 min', 110, '1–2 BB', 'A + B', 'Practice fueling/hydration.'),
    R(27, 'H', '3 runs', '40 min easy', '50 min controlled', '115 min', 115, '1–2 BB', 'A + B', 'Long run toward ~16 km depending on pace.'),
    R(28, 'H', '3 runs', '30–35 min easy', '40 min easy', '85 min', 85, '1–2 BB', 'A + B, reduced', 'Recovery week.', 1),
    R(29, 'H', '3 runs', '40 min easy', '50 min with controlled race-specific segments', '120 min', 120, '1–2 BB', 'A + B', 'Race-specific pacing remains secondary to durability.'),
    R(30, 'H', '3 runs', '40 min easy', '50 min controlled', '125 min', 125, '1–2 BB', 'A + B', 'Long run toward ~17–18 km depending on pace.'),
    R(31, 'H', '3 runs', '35–40 min easy', '50 min controlled', '130 min', 130, 'Prefer 1 BB if fatigue rises', 'A + B', 'Peak endurance build; manage basketball carefully.'),
    R(32, 'H', '3 runs', '30–35 min easy', '40 min easy', '95 min', 95, '0–1 BB', 'A + B, reduced', 'Start reducing unnecessary fatigue.', 1),
    R(33, 'T', '3 runs', '35 min easy', '40 min with brief controlled work', '100 min', 100, '0–1 easy BB', 'A + B, reduced', 'Last substantial long-run stimulus; no hard basketball.'),
    R(34, 'T', '3 runs', '30–35 min easy', '35–40 min controlled', '75 min', 75, '0–1 light BB', 'A + B, reduced', 'Reduce total volume.'),
    R(35, 'T', '2–3 runs', '30 min easy', '30–35 min easy with a few relaxed pickups', '50–60 min', 55, 'Prefer no hard BB', 'Light A/B or mobility', 'Prioritize freshness.'),
    R(36, 'R', '2 short runs + race', '20–30 min easy', '15–20 min easy', null, 0, 'No hard BB', 'Mobility only / very light strength early week if desired', 'Arrive rested; race goal is to finish healthy.'),
  ];

  // Strength volume mode by week
  WEEKS.forEach((w) => {
    if (w.n === 36) w.smode = 'mobility';
    else if (w.n === 35) w.smode = 'light';
    else if (/reduced/i.test(w.str)) w.smode = 'reduced';
    else w.smode = 'full';
  });

  const STRENGTH_NOTES = [
    [1, 4, 'Bodyweight or light first, controlled reps (especially the lowering phase), no failure.'],
    [5, 12, 'Add dumbbell load or reps gradually, only when movement quality and symptoms stay stable.'],
    [13, 24, 'Keep progressing single-leg and calf loading; add slower/eccentric work as tolerated.'],
    [25, 31, 'Maintain strength. Don’t turn strength sessions into conditioning workouts.'],
    [32, 36, 'Reduce volume to stay fresh; keep the movements familiar.'],
  ];

  const RED_FLAGS = [
    ['pain', 'Rapid or significant pain'],
    ['limp', 'Limp / can’t walk normally'],
    ['swell', 'Swelling'],
    ['giving', 'Knee giving way'],
    ['weak', 'Significant weakness'],
    ['pop', 'Sudden Achilles pop or sharp pain'],
    ['worse', 'Pain progressively worsening'],
  ];

  /* ---------- Exercises (from "Weekly Training Plan — Phase 1") ---------- */
  // rx.s = sets, rx.r = reps/time text. fig = figure key (defaults to id)
  const E = (id, name, grp, s, r, area, cues, easier, harder, video, fig) =>
    ({ id, name, grp, rx: { s, r }, area, cues, easier, harder, video, fig: fig || id });

  const EX = {};
  [
    // Strength A — Knee + Calf Foundation
    E('splitsquat', 'Bulgarian split squat', 'A', 3, '8 reps / leg', 'Quads, glutes',
      ['Rear foot on a bench or step behind you, front foot far enough forward that the knee stays over the ankle.', 'Lower straight down under control, especially on the way down.', 'Keep your torso tall and your weight through the front heel.', 'Stop short of failure; stay at 2/10 knee discomfort or less.'],
      'Bodyweight, shallower range, or a lower rear foot.', 'Add dumbbells, or slow the lowering to 3 seconds.', 'bulgarian split squat form'),
    E('rdl', 'Dumbbell Romanian deadlift', 'A', 3, '8–10 reps', 'Hamstrings, glutes',
      ['Soft knees, dumbbells close to your legs.', 'Push your hips back; your back stays long and flat.', 'Lower until you feel the hamstrings stretch, usually just below the knees.', 'Squeeze your glutes to stand tall.'],
      'Lighter weights or a shorter range.', 'Heavier dumbbells, or a slower lowering phase.', 'dumbbell romanian deadlift form'),
    E('stepdown', 'Step-down', 'A', 2, '8 reps / leg', 'Quads, knee control',
      ['Stand on a low step on one leg.', 'Bend the standing knee slowly and lightly tap the other heel to the floor.', 'Knee tracks over your second toe; don’t let it cave inward.', 'Push back up without bouncing.'],
      'A lower step, or a smaller range.', 'A higher step, or a slower lowering phase.', 'step down exercise knee control'),
    E('calfdouble', 'Standing calf raise', 'A', 3, '12 reps', 'Calves, Achilles',
      ['Feet hip-width apart; rise onto the balls of your feet.', 'Pause a beat at the top.', 'Lower slowly, about 3 seconds.'],
      'Hold a wall for balance.', 'Hold dumbbells, or progress to single-leg.', 'standing calf raise form'),
    E('bkcalf', 'Bent-knee calf raise', 'A', 3, '12 reps', 'Deep calf (soleus), Achilles',
      ['Stand with your knees softly bent (about 30–45°) and keep that bend.', 'Rise onto your toes slowly, hold a beat, lower for 2–3 seconds.', 'Bending the knee shifts the work to the deeper calf muscle.'],
      'Hold a wall for balance.', 'Hold dumbbells, or slow the lowering.', 'bent knee calf raise soleus'),
    E('latwalk', 'Resistance-band lateral walk', 'A', 2, '10–15 steps / direction', 'Outer hips (glute medius)',
      ['Band just above the knees or around the ankles; shallow squat position.', 'Step sideways, keeping tension on the band and toes forward.', 'Don’t let the trailing foot drag in; keep the knees from caving in.', 'Take the same number of steps each way.'],
      'Lighter band.', 'Stronger band, or a slightly deeper squat.', 'resistance band lateral walk', 'bandwalk'),
    E('slbalance', 'Single-leg balance', 'A', 2, '30–45 s / leg', 'Ankle, hip and knee control',
      ['Stand on one leg with a soft knee and a level pelvis.', 'Eyes forward; hover the other foot just off the floor.', 'Keep the standing foot “tripod” steady: heel, big toe, little toe.'],
      'Lightly touch a wall.', 'Eyes closed, or stand on a folded towel.', 'single leg balance exercise'),

    // Strength B — Basketball Durability
    E('gobletsquat', 'Goblet squat', 'B', 3, '8–10 reps', 'Quads, glutes',
      ['Hold one dumbbell at your chest, feet about shoulder-width.', 'Sit down between your hips, ribs stacked over your pelvis.', 'Knees track in line with your toes and heels stay flat.', 'Stand up smoothly by pushing the floor away.'],
      'Bodyweight only, or squat to a box.', 'Add load, or take 3 seconds to lower.', 'goblet squat form'),
    E('revlunge', 'Reverse lunge', 'B', 3, '8 reps / leg', 'Quads, glutes',
      ['Step back and land on the ball of the foot.', 'Lower straight down; the front shin stays close to vertical.', 'Push through the front heel to return to standing.'],
      'Hold a support, shallower range.', 'Hold dumbbells.', 'reverse lunge form'),
    E('sldl', 'Single-leg Romanian deadlift', 'B', 2, '8 reps / leg', 'Hamstrings, glutes, balance',
      ['Slight bend in the standing knee.', 'Hinge at the hip, extending the other leg straight back in line with your torso.', 'Keep your hips level and your back flat.', 'Return by squeezing the glute of the standing leg.'],
      'Lightly touch a wall or chair, no weight.', 'Hold a dumbbell.', 'single leg romanian deadlift form'),
    E('slcalf', 'Single-leg calf raise', 'B', 2, '10 reps / leg', 'Calf, Achilles',
      ['Touch a wall lightly for balance.', 'Rise slowly onto the ball of the foot, pause a beat at the top.', 'Lower for about 3 seconds.', 'Only if the Achilles response is appropriate; otherwise stay with two-leg raises.'],
      'Two-leg version.', 'Hold a dumbbell, or add a slower lowering phase.', 'single leg calf raise form'),
    E('tibraise', 'Tibialis raises', 'B', 2, '15–20 reps', 'Front of the shin',
      ['Lean your back against a wall with feet about 30–40 cm forward, heels on the floor.', 'Lift your toes toward your shins as high as you can.', 'Lower slowly, keeping your knees straight and soft.'],
      'Feet closer to the wall.', 'Feet further from the wall.', 'tibialis raise wall'),
    E('monster', 'Resistance-band monster walk', 'B', 2, '10–15 steps', 'Glutes, hips',
      ['Band around the knees or ankles, shallow squat stance.', 'Walk diagonally forward, then diagonally back, keeping tension on the band.', 'Toes forward; don’t let the knees cave in.'],
      'Lighter band.', 'Stronger band.', 'resistance band monster walk', 'bandwalk'),
    E('sideplank', 'Side plank', 'B', 2, '20–30 s / side', 'Trunk, hips',
      ['Elbow under shoulder, feet stacked (or bottom knee down).', 'Lift your hips so ears, shoulders, hips and ankles line up.', 'Top arm reaches to the ceiling; breathe steadily.'],
      'Keep the bottom knee on the floor.', 'Hold longer, or lift the top leg.', 'side plank form'),

    // Optional mobility (suggested; the plan just says "Strength B / Mobility")
    E('ankle', 'Ankle rocks (knee-to-wall)', 'M', 2, '8 reps / side', 'Ankle range of motion',
      ['Front foot a hand-width or so from the wall, heel flat.', 'Drive the knee forward to touch the wall without the heel lifting.', 'Slide the foot back to make it harder.'],
      'Foot closer to the wall.', 'Foot further from the wall.', 'ankle rocks knee to wall mobility'),

    // Basketball warm-up (~10 min)
    E('genmove', 'General movement (~5 min)', 'W', 1, 'brisk walk/jog, side shuffle, backward jog', 'Whole body',
      ['Start with a brisk walk, then an easy jog.', 'Add side shuffles in both directions and a short backward jog.', 'Build heat gradually; nothing maximal yet.'],
      '', '', 'basketball warm up jog shuffle backpedal', 'runform'),
    E('ankle2', 'Ankle rocks', 'W', 1, '8 / side', 'Ankles', ['Knee to wall without the heel lifting.', 'Smooth and controlled.'], '', '', 'ankle rocks warm up', 'ankle'),
    E('calfwarm', 'Calf raises', 'W', 1, '10–12 reps', 'Calves, Achilles', ['Rise onto the balls of your feet, lower slowly.', 'Activation, not a max set.'], '', '', 'calf raise warm up', 'calfdouble'),
    E('legswing', 'Leg swings', 'W', 1, '10 / leg', 'Hips, hamstrings',
      ['Hold a wall or rail; stand tall.', 'Swing one leg forward and back with control.', 'Build the range gradually; don’t force it.'], '', '', 'leg swings warm up'),
    E('walklunge', 'Walking lunges', 'W', 1, '6 / leg', 'Quads, glutes, hips',
      ['Step forward and lower until both knees are about 90°.', 'Keep your torso tall and your front knee tracking over the toes.', 'Push through the front foot and step through.'], '', '', 'walking lunge form'),
    E('shuffle', 'Controlled lateral movement', 'W', 1, '2 × 10 m each way', 'Legs, hips',
      ['Low athletic stance: hips back, chest up.', 'Push off the trailing foot; don’t cross your feet.', 'Start at about half pace and build up.'], '', '', 'lateral shuffle warm up basketball'),
    E('buildup', 'Progressive acceleration / deceleration', 'W', 1, '3–4 × 10–15 m', 'Whole leg, coordination',
      ['Start easy and accelerate smoothly over about 10 m.', 'Slow down over three controlled steps.', 'Each rep is a little faster, staying short of top speed.', 'Avoid high-volume maximal jumping or repeated maximal cuts while the Achilles is symptomatic.'], '', '', 'acceleration deceleration drills basketball'),

    E('runform', 'Easy run form', 'R', 1, 'as planned', 'Whole body',
      ['Run by conversational effort; don’t force a pace.', 'Early on, around 7:00–7:45/km or slower can be right. Go by effort, not the watch.', 'Tall posture, light quick steps, landing under your body.', 'No intervals, tempo, time trials or hard hills in this phase.'],
      '', '', 'easy running form tips'),
  ].forEach((e) => (EX[e.id] = e));

  const SESSIONS = {
    A: ['splitsquat', 'rdl', 'stepdown', 'calfdouble', 'bkcalf', 'latwalk', 'slbalance'],
    B: ['gobletsquat', 'revlunge', 'sldl', 'slcalf', 'tibraise', 'monster', 'sideplank'],
    M: ['ankle'],
    W: ['genmove', 'ankle2', 'calfwarm', 'legswing', 'walklunge', 'shuffle', 'buildup'],
  };

  const GROUPS = [
    ['A', 'Strength A: Knee + calf foundation'],
    ['B', 'Strength B: Basketball durability'],
    ['M', 'Optional mobility'],
    ['W', 'Basketball warm-up (~10 min)'],
    ['R', 'Running'],
  ];

  window.PLAN = { RACE, START, PHASES, WEEKS, STRENGTH_NOTES, RED_FLAGS, EX, SESSIONS, GROUPS };
})();
