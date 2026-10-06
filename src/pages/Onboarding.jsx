import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { ACTIVITY_LEVELS, GOALS, calculatePlan } from "../services/nutrition";
import { FaDumbbell, FaMars, FaVenus, FaArrowLeft, FaArrowRight } from "react-icons/fa";

const TOTAL_STEPS = 5;

function Onboarding() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [step, setStep] = useState(0);
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [activity, setActivity] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // تعبئة مسبقة من بياناتك المحفوظة (مهم عند تعديل الخطة)
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.age) setAge(String(d.age));
          if (d.height) setHeight(String(d.height));
          if (d.goalWeight) setGoalWeight(String(d.goalWeight));
          if (d.sex) setSex(d.sex);
          if (d.activity) setActivity(d.activity);
          if (d.goalType) setGoal(d.goalType);
        }

        // آخر وزن مسجل
        const res = await getDocs(
          query(collection(db, "progress"), where("userId", "==", user.uid))
        );
        const entries = res.docs.map((x) => x.data());
        if (entries.length > 0) {
          entries.sort((a, b) => new Date(b.date) - new Date(a.date));
          setWeight(String(entries[0].weight));
        }
      } catch (e) {
        console.log(e);
      }
    }

    load();
  }, [user]);

  const validate = () => {
    if (step === 0) {
      if (!sex) return "Please choose your sex.";
      if (Number(age) < 14 || Number(age) > 90) return "Enter an age between 14 and 90.";
    }
    if (step === 1) {
      if (Number(height) < 120 || Number(height) > 230) return "Height should be between 120 and 230 cm.";
      if (Number(weight) < 30 || Number(weight) > 300) return "Weight should be between 30 and 300 KG.";
      if (Number(goalWeight) < 30 || Number(goalWeight) > 300) return "Goal weight should be between 30 and 300 KG.";
    }
    if (step === 2 && !activity) return "Please choose your activity level.";
    if (step === 3 && !goal) return "Please choose your goal.";
    return "";
  };

  const next = () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const back = () => {
    setError("");
    setStep(step - 1);
  };

  const plan =
    step === 4
      ? calculatePlan({
          sex,
          age: Number(age),
          height: Number(height),
          weight: Number(weight),
          activity,
          goal,
        })
      : null;

  const finish = async () => {
    setSaving(true);
    setError("");

    try {
      const g = GOALS.find((x) => x.id === goal);

      await setDoc(
        doc(db, "users", user.uid),
        {
          sex,
          age: Number(age),
          height: Number(height),
          goalWeight: Number(goalWeight),
          goal: g.text,
          goalType: goal,
          activity,
          calorieTarget: plan.calories,
          proteinTarget: plan.protein,
          carbsTarget: plan.carbs,
          fatTarget: plan.fat,
          onboardingDone: true,
        },
        { merge: true }
      );

      // نضيف سجل وزن جديد إذا ما عنده سجلات، أو إذا غيّر وزنه عن آخر سجل
      const existing = await getDocs(
        query(collection(db, "progress"), where("userId", "==", user.uid))
      );

      const entries = existing.docs.map((x) => x.data());
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastWeight = entries.length > 0 ? Number(entries[0].weight) : null;

      if (lastWeight === null || lastWeight !== Number(weight)) {
        await addDoc(collection(db, "progress"), {
          userId: user.uid,
          weight: Number(weight),
          calories: 0,
          protein: 0,
          date: new Date().toISOString(),
        });
      }

      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError("Could not save your plan. Please try again.");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-slate-700 rounded-xl px-4 py-3 outline-none placeholder-gray-500 focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-gray-400 text-sm mb-2";
  const optionClass = (selected) =>
    `w-full text-left rounded-xl px-4 py-3 border transition ${
      selected
        ? "bg-blue-600/20 border-blue-500"
        : "bg-slate-700 border-transparent hover:border-slate-500"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-3 shadow-lg">
            <FaDumbbell className="text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold">Let's build your plan</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Step {step + 1} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-700 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 shadow-lg">
          {error && (
            <div
              role="alert"
              className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm"
            >
              {error}
            </div>
          )}

          {/* Step 1: sex + age */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold mb-5">About you</h2>

              <label className={labelClass}>Sex</label>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <button
                  type="button"
                  onClick={() => setSex("male")}
                  className={`${optionClass(sex === "male")} flex flex-col items-center gap-2 py-5`}
                >
                  <FaMars className="text-2xl" />
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setSex("female")}
                  className={`${optionClass(sex === "female")} flex flex-col items-center gap-2 py-5`}
                >
                  <FaVenus className="text-2xl" />
                  Female
                </button>
              </div>

              <label className={labelClass}>Age</label>
              <input
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* Step 2: body */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-5">Your body</h2>

              <label className={labelClass}>Height (cm)</label>
              <input
                type="number"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={`${inputClass} mb-5`}
              />

              <label className={labelClass}>Current weight (KG)</label>
              <input
                type="number"
                step="0.1"
                placeholder="85"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={`${inputClass} mb-5`}
              />

              <label className={labelClass}>Goal weight (KG)</label>
              <input
                type="number"
                step="0.1"
                placeholder="75"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* Step 3: activity */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-5">Daily activity</h2>
              <div className="space-y-3">
                {ACTIVITY_LEVELS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActivity(a.id)}
                    className={optionClass(activity === a.id)}
                  >
                    <span className="font-semibold">
                      {a.emoji} {a.label}
                    </span>
                    <span className="block text-sm text-gray-400">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: goal */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-5">Your goal</h2>
              <div className="space-y-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={optionClass(goal === g.id)}
                  >
                    <span className="font-semibold">
                      {g.emoji} {g.label}
                    </span>
                    <span className="block text-sm text-gray-400">{g.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: result */}
          {step === 4 && plan && (
            <div>
              <h2 className="text-xl font-bold mb-1">Your daily plan</h2>
              <p className="text-gray-400 text-sm mb-5">
                Based on your details, here is your daily target.
              </p>

              <div className="bg-blue-600/20 border border-blue-500 rounded-2xl p-6 text-center mb-5">
                <p className="text-gray-300 text-sm">Calories</p>
                <p className="text-5xl font-extrabold">{plan.calories}</p>
                <p className="text-gray-400 text-xs mt-1">kcal per day</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs">Protein</p>
                  <p className="text-xl font-bold">{plan.protein}g</p>
                </div>
                <div className="bg-slate-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs">Carbs</p>
                  <p className="text-xl font-bold">{plan.carbs}g</p>
                </div>
                <div className="bg-slate-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs">Fat</p>
                  <p className="text-xl font-bold">{plan.fat}g</p>
                </div>
              </div>

              <p className="text-gray-500 text-xs">
                Maintenance is about {plan.tdee} kcal. These are general estimates, not medical advice.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                disabled={saving}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <FaArrowLeft /> Back
              </button>
            ) : (
              <span />
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition"
              >
                Next <FaArrowRight />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition"
              >
                {saving ? "Saving..." : "Start tracking"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;