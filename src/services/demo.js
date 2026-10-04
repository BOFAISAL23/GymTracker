import { signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { auth, db } from "./firebase";

const DAY = 24 * 60 * 60 * 1000;

// بيانات وهمية: وزن ينزل تدريجياً خلال ~5 أسابيع
const progressSamples = [
  { weight: 90.0, calories: 2600, protein: 120 },
  { weight: 89.2, calories: 2450, protein: 130 },
  { weight: 88.5, calories: 2400, protein: 135 },
  { weight: 87.9, calories: 2300, protein: 140 },
  { weight: 87.0, calories: 2350, protein: 145 },
  { weight: 86.4, calories: 2250, protein: 150 },
  { weight: 85.8, calories: 2200, protein: 150 },
  { weight: 85.1, calories: 2200, protein: 155 },
];

const workoutSamples = [
  { name: "Bench Press", sets: 4, reps: 10, weight: 60 },
  { name: "Squat", sets: 4, reps: 8, weight: 80 },
  { name: "Deadlift", sets: 3, reps: 5, weight: 100 },
  { name: "Shoulder Press", sets: 3, reps: 10, weight: 35 },
];

// كل زائر يحصل على حساب مجهول (Anonymous) خاص فيه بياناته التجريبية،
// فما أحد يخرب بيانات غيره، وما فيه باسورد مكشوف في الكود.
export async function startDemo() {
  const { user } = await signInAnonymously(auth);

  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  // إذا الحساب المجهول موجود وفيه بيانات، لا نكرر الإضافة
  if (existing.exists()) return;

  await setDoc(userRef, {
    name: "Demo User",
    age: "28",
    goal: "Lose weight",
    height: 175,
    goalWeight: 75,
    email: "demo@gymtracker.app",
    isDemo: true,
  });

  const now = Date.now();

  const progressWrites = progressSamples.map((p, i) =>
    addDoc(collection(db, "progress"), {
      userId: user.uid,
      ...p,
      date: new Date(
        now - (progressSamples.length - i) * 4 * DAY
      ).toISOString(),
    })
  );

  const workoutWrites = workoutSamples.map((w, i) =>
    addDoc(collection(db, "workouts"), {
      userId: user.uid,
      ...w,
      date: new Date(now - i * DAY).toISOString(),
    })
  );

  await Promise.all([...progressWrites, ...workoutWrites]);
}