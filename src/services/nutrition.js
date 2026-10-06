// حسابات السعرات والماكروز (Mifflin-St Jeor). كلها تقديرات عامة.

export const ACTIVITY_LEVELS = [
  { id: "sedentary", emoji: "🛋️", factor: 1.2 },
  { id: "light", emoji: "🚶", factor: 1.375 },
  { id: "moderate", emoji: "🏃", factor: 1.55 },
  { id: "high", emoji: "🏋️", factor: 1.725 },
  { id: "athlete", emoji: "🔥", factor: 1.9 },
];

export const GOALS = [
  { id: "cut", emoji: "📉", adjust: -0.2, protein: 2.0 },
  { id: "bulk", emoji: "📈", adjust: 0.1, protein: 1.8 },
  { id: "maintain", emoji: "⚖️", adjust: 0, protein: 1.6 },
];

export function calculatePlan({ sex, age, height, weight, activity, goal }) {
  const act = ACTIVITY_LEVELS.find((a) => a.id === activity);
  const g = GOALS.find((x) => x.id === goal);

  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = sex === "male" ? base + 5 : base - 161;
  const tdee = bmr * act.factor;

  // حد أدنى للسعرات عشان ما تطلع أرقام غير آمنة
  const calories = Math.max(1200, Math.round(tdee * (1 + g.adjust)));

  const protein = Math.round(weight * g.protein);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, protein, fat, carbs };
}

// مفتاح اليوم بالتوقيت المحلي، مثل 2026-10-07
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
