// حسابات السعرات والماكروز (Mifflin-St Jeor). كلها تقديرات عامة.

export const ACTIVITY_LEVELS = [
  { id: "sedentary", emoji: "🛋️", label: "Sedentary", desc: "Desk job, little or no exercise", factor: 1.2 },
  { id: "light", emoji: "🚶", label: "Lightly active", desc: "Exercise 1-3 days a week", factor: 1.375 },
  { id: "moderate", emoji: "🏃", label: "Moderately active", desc: "Exercise 3-5 days a week", factor: 1.55 },
  { id: "high", emoji: "🏋️", label: "Very active", desc: "Hard exercise 6-7 days a week", factor: 1.725 },
  { id: "athlete", emoji: "🔥", label: "Athlete", desc: "Intense training or a physical job", factor: 1.9 },
];

export const GOALS = [
  { id: "cut", emoji: "📉", label: "Cut", desc: "Lose fat (about 20% fewer calories)", adjust: -0.2, protein: 2.0, text: "Lose weight" },
  { id: "bulk", emoji: "📈", label: "Bulk", desc: "Build muscle (about 10% more calories)", adjust: 0.1, protein: 1.8, text: "Build muscle" },
  { id: "maintain", emoji: "⚖️", label: "Maintain", desc: "Stay at your current weight", adjust: 0, protein: 1.6, text: "Maintain weight" },
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