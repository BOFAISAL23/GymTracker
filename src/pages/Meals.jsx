import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { FOODS } from "../services/foods";
import { dayKey } from "../services/nutrition";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅" },
  { id: "lunch", label: "Lunch", emoji: "☀️" },
  { id: "dinner", label: "Dinner", emoji: "🌙" },
  { id: "snack", label: "Snack", emoji: "🍎" },
];

const round1 = (n) => Math.round(n * 10) / 10;

function Meals() {
  const user = auth.currentUser;

  const [day, setDay] = useState(new Date());
  const [targets, setTargets] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState("consumed"); // consumed | remaining
  const [mode, setMode] = useState("search"); // search | custom

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState("1");
  const [mealType, setMealType] = useState("lunch");
  const [saving, setSaving] = useState(false);

  const [custom, setCustom] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const key = dayKey(day);
  const isToday = key === dayKey(new Date());

  // أهداف المستخدم
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists() && snap.data().calorieTarget) {
          const d = snap.data();
          setTargets({
            calories: d.calorieTarget,
            protein: d.proteinTarget,
            carbs: d.carbsTarget,
            fat: d.fatTarget,
          });
        }
      })
      .catch((e) => console.log(e));
  }, [user]);

  // وجبات اليوم المختار
  const loadMeals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDocs(
        query(
          collection(db, "meals"),
          where("userId", "==", user.uid),
          where("day", "==", key)
        )
      );
      const list = res.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
      setMeals(list);
    } catch (err) {
      console.log(err);
      setError(
        "Could not load meals. Make sure the Firestore rules include the meals collection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const totals = useMemo(
    () =>
      meals.reduce(
        (t, m) => ({
          calories: t.calories + (m.calories || 0),
          protein: t.protein + (m.protein || 0),
          carbs: t.carbs + (m.carbs || 0),
          fat: t.fat + (m.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [meals]
  );

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? FOODS.filter(
          (f) => f.ar.includes(q) || f.en.toLowerCase().includes(q)
        )
      : FOODS;
    return list.slice(0, 8);
  }, [search]);

  const preview = selected
    ? {
        calories: Math.round(selected.cal * Number(qty || 0)),
        protein: round1(selected.p * Number(qty || 0)),
        carbs: round1(selected.c * Number(qty || 0)),
        fat: round1(selected.f * Number(qty || 0)),
      }
    : null;

  const saveMeal = async (data) => {
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "meals"), {
        userId: user.uid,
        day: key,
        date: new Date().toISOString(),
        mealType,
        ...data,
      });
      await loadMeals();
      return true;
    } catch (err) {
      console.log(err);
      setError("Could not save the meal. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addFood = async () => {
    if (!selected || !(Number(qty) > 0)) {
      setError("Choose a food and a quantity greater than 0.");
      return;
    }
    const ok = await saveMeal({
      name: selected.ar,
      qty: Number(qty),
      unit: selected.unit,
      source: "database",
      ...preview,
    });
    if (ok) {
      setSelected(null);
      setQty("1");
      setSearch("");
    }
  };

  const addCustom = async (e) => {
    e.preventDefault();
    if (!custom.name.trim() || !(Number(custom.calories) >= 0)) {
      setError("Enter a name and calories.");
      return;
    }
    const ok = await saveMeal({
      name: custom.name.trim(),
      qty: 1,
      source: "custom",
      calories: Math.round(Number(custom.calories) || 0),
      protein: Number(custom.protein) || 0,
      carbs: Number(custom.carbs) || 0,
      fat: Number(custom.fat) || 0,
    });
    if (ok) setCustom({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  };

  const deleteMeal = async (id) => {
    try {
      await deleteDoc(doc(db, "meals", id));
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.log(err);
      setError("Could not delete the meal.");
    }
  };

  const moveDay = (delta) => {
    const next = new Date(day);
    next.setDate(next.getDate() + delta);
    if (next > new Date() && delta > 0) return;
    setDay(next);
  };

  const dayLabel = isToday
    ? "Today"
    : day.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

  // عرض القيمة: المستهلك أو المتبقي
  const show = (consumed, target) => {
    if (view === "consumed" || !target) return Math.round(consumed);
    return Math.round(target - consumed);
  };

  const pct = (consumed, target) =>
    target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const macroCards = [
    { label: "Protein", key: "protein", color: "bg-red-500" },
    { label: "Carbs", key: "carbs", color: "bg-blue-500" },
    { label: "Fat", key: "fat", color: "bg-green-500" },
  ];

  const inputClass =
    "w-full bg-slate-700 rounded-xl px-4 py-3 outline-none placeholder-gray-500 focus:ring-2 focus:ring-blue-500";

  const calOver = targets && totals.calories > targets.calories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <FaArrowLeft /> Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold">Meals</h1>
          <span className="w-24" />
        </div>

        {/* Day picker */}
        <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between mb-6">
          <button
            onClick={() => moveDay(-1)}
            aria-label="Previous day"
            className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600"
          >
            <FaChevronLeft />
          </button>
          <p className="font-semibold text-lg">{dayLabel}</p>
          <button
            onClick={() => moveDay(1)}
            disabled={isToday}
            aria-label="Next day"
            className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaChevronRight />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm"
          >
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🔥 Calories</h2>
            <div className="flex bg-slate-700 rounded-xl p-1 text-sm">
              {["consumed", "remaining"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-lg capitalize ${
                    view === v ? "bg-slate-900" : "text-gray-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <p className="text-4xl font-extrabold">
            <span className={view === "remaining" && calOver ? "text-red-400" : ""}>
              {targets ? Math.abs(show(totals.calories, targets.calories)) : Math.round(totals.calories)}
            </span>
            {targets && (
              <span className="text-base text-gray-400 font-normal">
                {view === "remaining"
                  ? calOver
                    ? " kcal over"
                    : " kcal left"
                  : ` / ${targets.calories} kcal`}
              </span>
            )}
          </p>

          {targets && (
            <div className="w-full bg-slate-700 rounded-full h-3 mt-4">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  calOver ? "bg-red-500" : "bg-orange-500"
                }`}
                style={{ width: `${pct(totals.calories, targets.calories)}%` }}
              />
            </div>
          )}

          {!targets && (
            <p className="text-gray-400 text-sm mt-3">
              Set your daily target from{" "}
              <Link to="/onboarding" className="text-blue-400">
                My Plan
              </Link>{" "}
              to see what is left.
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 mt-6">
            {macroCards.map((m) => (
              <div key={m.key} className="bg-slate-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs">{m.label}</p>
                <p className="text-xl font-bold">
                  {targets
                    ? Math.abs(show(totals[m.key], targets[m.key]))
                    : Math.round(totals[m.key])}
                  <span className="text-xs text-gray-400 font-normal">
                    {targets
                      ? view === "remaining"
                        ? show(totals[m.key], targets[m.key]) < 0
                          ? "g over"
                          : "g left"
                        : ` / ${targets[m.key]}g`
                      : "g"}
                  </span>
                </p>
                {targets && (
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                    <div
                      className={`${m.color} h-1.5 rounded-full`}
                      style={{ width: `${pct(totals[m.key], targets[m.key])}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add meal */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-bold">Add food</h2>
            <div className="flex bg-slate-700 rounded-xl p-1 text-sm">
              <button
                onClick={() => setMode("search")}
                className={`px-3 py-1 rounded-lg ${mode === "search" ? "bg-slate-900" : "text-gray-400"}`}
              >
                Search
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`px-3 py-1 rounded-lg ${mode === "custom" ? "bg-slate-900" : "text-gray-400"}`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Meal type */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {MEAL_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setMealType(t.id)}
                className={`rounded-xl py-2 text-sm border transition ${
                  mealType === t.id
                    ? "bg-blue-600/20 border-blue-500"
                    : "bg-slate-700 border-transparent hover:border-slate-500"
                }`}
              >
                <span className="block">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          {mode === "search" ? (
            <>
              <div className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3 mb-3 focus-within:ring-2 focus-within:ring-blue-500">
                <FaSearch className="text-gray-400" />
                <input
                  type="text"
                  placeholder="كبسة، شاورما، تمر... or chicken, rice"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelected(null);
                  }}
                  className="bg-transparent outline-none w-full placeholder-gray-500"
                />
              </div>

              {!selected && (
                <div className="space-y-2">
                  {filteredFoods.length === 0 && (
                    <p className="text-gray-400 text-sm">
                      No match. Try the Custom tab to add it yourself.
                    </p>
                  )}
                  {filteredFoods.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelected(f)}
                      className="w-full text-left bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <span>
                        <span className="font-semibold">{f.ar}</span>
                        <span className="block text-xs text-gray-400">
                          {f.en} · {f.unit}
                        </span>
                      </span>
                      <span className="text-sm text-gray-300">{f.cal} kcal</span>
                    </button>
                  ))}
                </div>
              )}

              {selected && preview && (
                <div className="bg-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-lg">{selected.ar}</p>
                      <p className="text-xs text-gray-400">
                        1 = {selected.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Change
                    </button>
                  </div>

                  <label className="block text-gray-400 text-sm mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full bg-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  />

                  <div className="grid grid-cols-4 gap-2 text-center mb-4">
                    <div>
                      <p className="text-xs text-gray-400">kcal</p>
                      <p className="font-bold">{preview.calories}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Protein</p>
                      <p className="font-bold">{preview.protein}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Carbs</p>
                      <p className="font-bold">{preview.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Fat</p>
                      <p className="font-bold">{preview.fat}g</p>
                    </div>
                  </div>

                  <button
                    onClick={addFood}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 py-3 rounded-xl font-semibold transition"
                  >
                    {saving ? "Saving..." : "Add to meal"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={addCustom} className="space-y-3">
              <input
                type="text"
                placeholder="Food name"
                value={custom.name}
                onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                required
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Calories"
                  value={custom.calories}
                  onChange={(e) => setCustom({ ...custom, calories: e.target.value })}
                  required
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Protein (g)"
                  value={custom.protein}
                  onChange={(e) => setCustom({ ...custom, protein: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Carbs (g)"
                  value={custom.carbs}
                  onChange={(e) => setCustom({ ...custom, carbs: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Fat (g)"
                  value={custom.fat}
                  onChange={(e) => setCustom({ ...custom, fat: e.target.value })}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 py-3 rounded-xl font-semibold transition"
              >
                {saving ? "Saving..." : "Add to meal"}
              </button>
            </form>
          )}

          <p className="text-gray-500 text-xs mt-4">
            Values are approximate estimates for a typical serving.
          </p>
        </div>

        {/* Meals list */}
        <h2 className="text-2xl font-bold mb-4">Meals ({meals.length})</h2>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : meals.length === 0 ? (
          <p className="text-gray-400">Nothing logged for this day yet.</p>
        ) : (
          <div className="space-y-4 pb-10">
            {MEAL_TYPES.map((t) => {
              const group = meals.filter((m) => m.mealType === t.id);
              if (group.length === 0) return null;
              const groupCal = group.reduce((s, m) => s + (m.calories || 0), 0);

              return (
                <div key={t.id} className="bg-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      {t.emoji} {t.label}
                    </h3>
                    <span className="text-sm text-gray-400">{groupCal} kcal</span>
                  </div>

                  <div className="space-y-2">
                    {group.map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {m.name}
                            {m.qty && m.qty !== 1 ? ` × ${m.qty}` : ""}
                          </p>
                          <p className="text-xs text-gray-400">
                            {m.calories} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                          </p>
                        </div>
                        <button
                          onClick={() => deleteMeal(m.id)}
                          aria-label="Delete meal"
                          className="text-gray-400 hover:text-red-400"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Meals;