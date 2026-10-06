// تعديل الهدف حسب نتائجك الفعلية (وزنك)، مب حسب أيام التمرين.
// دالة نقية: تاخذ البيانات وترجع حالة + اقتراح. التطبيق نفسه يصير بزر من المستخدم.

const DAY = 86400000;
const STEP = { cut: 150, bulk: 150, maintain: 100 };
// المعدل الصحي لتغير الوزن بالأسبوع (% من وزن الجسم)
const RANGE = { cut: [-1.0, -0.25], bulk: [0.1, 0.5], maintain: [-0.25, 0.25] };
const MIN_KCAL = 1200;
const COOLDOWN_DAYS = 14;

// ميل خط الوزن بالكجم/أسبوع (انحدار خطي بسيط)
function weeklySlope(points) {
  const n = points.length;
  const t0 = points[0].t;
  const xs = points.map((p) => (p.t - t0) / (7 * DAY));
  const ys = points.map((p) => p.w);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// weights: [{w, t}] مرتبة، targets: {calories, protein, carbs, fat}
export function adaptSuggestion({ goalType, weights, loggedDays14, targets, lastActionAt, now = Date.now() }) {
  if (!targets || !targets.calories) return { status: "noTargets" };

  if (lastActionAt) {
    const since = (now - new Date(lastActionAt).getTime()) / DAY;
    if (since < COOLDOWN_DAYS) {
      return { status: "wait", daysLeft: Math.ceil(COOLDOWN_DAYS - since) };
    }
  }

  const recent = weights.filter((x) => x.t >= now - 28 * DAY);
  const span = recent.length >= 2 ? (recent[recent.length - 1].t - recent[0].t) / DAY : 0;
  if (recent.length < 2 || span < 10) return { status: "needWeights" };
  if (loggedDays14 < 5) return { status: "needLogs" };

  const type = RANGE[goalType] ? goalType : "maintain";
  const slope = weeklySlope(recent);
  const avgW = recent.reduce((s, x) => s + x.w, 0) / recent.length;
  const pct = (slope / avgW) * 100;
  const [lo, hi] = RANGE[type];
  const rate = Math.round(slope * 100) / 100;

  if (pct >= lo && pct <= hi) return { status: "onTrack", rate };

  // خارج المعدل: نرفع أو ننزل السعرات بخطوة صغيرة
  const delta = pct < lo ? STEP[type] : -STEP[type];
  const newCal = Math.max(MIN_KCAL, targets.calories + delta);
  if (newCal === targets.calories) return { status: "onTrack", rate };
  const realDelta = newCal - targets.calories;
  const newCarbs = Math.max(
    0,
    Math.round((newCal - (targets.protein || 0) * 4 - (targets.fat || 0) * 9) / 4)
  );
  return {
    status: "suggest",
    rate,
    delta: realDelta,
    newCal,
    newCarbs,
    // السبب: cutSlow = النزول بطيء/واقف، cutFast = النزول سريع زيادة
    reason:
      pct < lo
        ? type === "cut" ? "cutFast" : type === "bulk" ? "bulkSlow" : "lossMaintain"
        : type === "cut" ? "cutSlow" : type === "bulk" ? "bulkFast" : "gainMaintain",
  };
}
