import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useLanguage } from "../i18n/LanguageContext";
import { auth, db } from "../services/firebase";
import { FOODS } from "../services/foods";
import { dayKey } from "../services/nutrition";
import { C, Page, TopBar, Btn, Panel, Plate } from "../design/ui";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaTrash,
  FaPen,
} from "react-icons/fa";

const MEAL_TYPES = [
  { id: "breakfast", labelKey: "meals.breakfast", emoji: "🌅" },
  { id: "lunch", labelKey: "meals.lunch", emoji: "☀️" },
  { id: "dinner", labelKey: "meals.dinner", emoji: "🌙" },
  { id: "snack", labelKey: "meals.snack", emoji: "🍎" },
];

const round1 = (n) => Math.round(n * 10) / 10;

function Meals() {
  const { t, lang, dir, formatDate } = useLanguage();
  const isRtl = dir === "rtl";
  const user = auth.currentUser;

  const [day, setDay] = useState(new Date());
  const [targets, setTargets] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editQty, setEditQty] = useState("");

  const [view, setView] = useState("consumed"); // consumed | remaining
  const [mode, setMode] = useState("search"); // search | custom

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState("1");
  const [qtyMode, setQtyMode] = useState("g"); // g = جرام | s = حصة
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
      setError(t("meals.errLoad"));
    } finally {
      setLoading(false);
    }
  };

  // آخر ما أكلت: نقرأ وجبات المستخدم السابقة (بدون ترتيب في السيرفر عشان ما نحتاج index)
  const loadHistory = async () => {
    try {
      const res = await getDocs(
        query(collection(db, "meals"), where("userId", "==", user.uid))
      );
      const list = res.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(list.slice(0, 200));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (user) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const itemSig = (m) => `${m.name}|${m.qty}|${m.unit || ""}`;
  const copyItem = (m) => ({
    name: m.name,
    ...(m.nameEn ? { nameEn: m.nameEn } : {}),
    qty: m.qty ?? 1,
    ...(m.unit ? { unit: m.unit } : {}),
    ...(m.unitEn ? { unitEn: m.unitEn } : {}),
    source: m.source || "database",
    calories: m.calories || 0,
    protein: m.protein || 0,
    carbs: m.carbs || 0,
    fat: m.fat || 0,
  });

  // آخر الأكلات (بدون تكرار)
  const recentItems = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const m of history) {
      const s = itemSig(m);
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(m);
      if (out.length >= 6) break;
    }
    return out;
  }, [history]);

  // وجباتي: نفس اليوم + نفس نوع الوجبة وفيها أكثر من صنف تنحفظ تلقائياً
  const combos = useMemo(() => {
    const groups = new Map();
    for (const m of history) {
      // نتجاهل اليوم المعروض: وإلا الوجبة اللي تضيفها تصير "وجبة محفوظة" وتتضاعف
      if (m.day === key) continue;
      const g = `${m.day}|${m.mealType}`;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(m);
    }
    const seen = new Set();
    const out = [];
    for (const items of groups.values()) {
      if (items.length < 2 || items.length > 8) continue;
      const sig = items.map(itemSig).sort().join("#");
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(items);
      if (out.length >= 4) break;
    }
    return out;
  }, [history, key]);

  const totals = useMemo(
    () =>
      meals.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + (m.protein || 0),
          carbs: acc.carbs + (m.carbs || 0),
          fat: acc.fat + (m.fat || 0),
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
    return list.slice(0, 12);
  }, [search]);

  // عدد الحصص: بالجرام نقسم على وزن الحصة
  const servings = selected
    ? qtyMode === "g"
      ? Number(qty || 0) / (selected.g || 100)
      : Number(qty || 0)
    : 0;

  const preview = selected
    ? {
        calories: Math.round(selected.cal * servings),
        protein: round1(selected.p * servings),
        carbs: round1(selected.c * servings),
        fat: round1(selected.f * servings),
      }
    : null;

  const pickFood = (f, mode = qtyMode) => {
    setSelected(f);
    setQtyMode(mode);
    setQty(f ? (mode === "g" ? "100" : "1") : "1");
  };

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
      loadHistory();
      return true;
    } catch (err) {
      console.log(err);
      setError(t("meals.errSave"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addFood = async () => {
    if (!selected || !(Number(qty) > 0)) {
      setError(t("meals.errChoose"));
      return;
    }
    const ok = await saveMeal({
      name: selected.ar,
      nameEn: selected.en,
      qty: Number(qty),
      unit: qtyMode === "g" ? "جم" : selected.unit,
      unitEn: qtyMode === "g" ? "g" : selected.unitEn,
      source: "database",
      ...preview,
    });
    if (ok) {
      pickFood(null);
      setSearch("");
    }
  };

  const addCustom = async (e) => {
    e.preventDefault();
    if (!custom.name.trim() || !(Number(custom.calories) >= 0)) {
      setError(t("meals.errCustom"));
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
      loadHistory();
    } catch (err) {
      console.log(err);
      setError(t("meals.errDelete"));
    }
  };

  // إضافة أصناف جاهزة (آخر ما أكلت / وجباتي) لنوع الوجبة المختار
  const addItems = async (items) => {
    setSaving(true);
    setError("");
    try {
      const date = new Date().toISOString();
      await Promise.all(
        items.map((it) =>
          addDoc(collection(db, "meals"), {
            userId: user.uid,
            day: key,
            date,
            mealType,
            ...copyItem(it),
          })
        )
      );
      await loadMeals();
      loadHistory();
    } catch (err) {
      console.log(err);
      setError(t("meals.errSave"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditId(m.id);
    setEditQty(String(m.qty ?? 1));
  };

  // تعديل الكمية: نعيد حساب كل القيم بنفس النسبة
  const saveEdit = async (m) => {
    const newQty = Number(editQty);
    const oldQty = Number(m.qty) || 1;
    if (!(newQty > 0)) return;
    const r = newQty / oldQty;
    const patch = {
      qty: newQty,
      calories: Math.round((m.calories || 0) * r),
      protein: round1((m.protein || 0) * r),
      carbs: round1((m.carbs || 0) * r),
      fat: round1((m.fat || 0) * r),
    };
    try {
      await updateDoc(doc(db, "meals", m.id), patch);
      setMeals((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
      setEditId(null);
      loadHistory();
    } catch (err) {
      console.log(err);
      setError(t("meals.errSave"));
    }
  };

  const moveDay = (delta) => {
    const next = new Date(day);
    next.setDate(next.getDate() + delta);
    if (next > new Date() && delta > 0) return;
    setDay(next);
  };

  const dayLabel = isToday
    ? t("meals.today")
    : formatDate(day, { weekday: "short", day: "numeric", month: "short" });

  // عرض القيمة: المستهلك أو المتبقي
  const show = (consumed, target) => {
    if (view === "consumed" || !target) return Math.round(consumed);
    return Math.round(target - consumed);
  };

  const pct = (consumed, target) =>
    target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const macroRows = [
    { label: t("meals.protein"), key: "protein", color: C.red },
    { label: t("meals.carbs"), key: "carbs", color: C.yellow },
    { label: t("meals.fat"), key: "fat", color: C.green },
  ];

  const foodName = (f) => (lang === "ar" ? f.ar : f.en);
  const foodAlt = (f) => (lang === "ar" ? f.en : f.ar);
  const foodUnit = (f) => (lang === "ar" ? f.unit : f.unitEn || f.unit);
  const savedName = (m) => (lang === "en" && m.nameEn ? m.nameEn : m.name);
  const savedUnit = (m) =>
    lang === "en" && m.unitEn ? m.unitEn : m.unit || "";

  const inputClass =
    "w-full min-h-[44px] rounded px-4 py-2.5 text-start placeholder:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1";
  const inputStyle = {
    background: C.rubber,
    border: `1px solid ${C.line}`,
    color: C.chalk,
    outlineColor: C.chalk,
  };

  const calOver = targets && totals.calories > targets.calories;

  const tabClass = "min-h-[40px] px-1 pb-1 border-b-2 transition text-sm md:text-base";
  const tabStyle = (active) => ({
    borderColor: active ? C.chalk : "transparent",
    color: active ? C.chalk : C.dim,
    fontWeight: active ? 600 : 400,
  });
  const navBtnClass =
    "min-w-[44px] min-h-[44px] grid place-items-center rounded transition hover:bg-[rgba(237,234,227,.06)] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const navBtnStyle = { border: `1px solid ${C.line}`, color: C.chalk, outlineColor: C.chalk };

  const calValue = targets
    ? Math.abs(show(totals.calories, targets.calories))
    : Math.round(totals.calories);
  const plateLabel = !targets
    ? t("meals.consumed")
    : view === "remaining"
    ? calOver
      ? t("meals.kcalOver")
      : t("meals.kcalLeft")
    : `${t("meals.consumed")} / ${targets.calories} ${t("common.kcal")}`;

  return (
    <Page>
      <TopBar />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-bold mb-6">{t("meals.title")}</h1>

        {/* Day picker */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => moveDay(-1)}
            aria-label={t("meals.prevDay")}
            className={navBtnClass}
            style={navBtnStyle}
          >
            {isRtl ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <p className="text-2xl font-semibold text-center">{dayLabel}</p>
          <button
            onClick={() => moveDay(1)}
            disabled={isToday}
            aria-label={t("meals.nextDay")}
            className={navBtnClass}
            style={navBtnStyle}
          >
            {isRtl ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="border-s-[3px] px-4 py-3 mb-6 text-sm rounded-md"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderInlineStartWidth: 3,
              borderInlineStartColor: C.red,
              color: C.chalk,
            }}
          >
            {error}
          </div>
        )}

        {/* Summary */}
        <Panel className="p-5 md:p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <h2 className="text-xl font-bold">{t("meals.calories")}</h2>
            <div className="flex items-center gap-5">
              {["consumed", "remaining"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={tabClass}
                  style={tabStyle(view === v)}
                >
                  {t(v === "consumed" ? "meals.consumed" : "meals.remaining")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="shrink-0">
              <Plate
                color={C.chalk}
                ink={C.rubber}
                size={150}
                value={calValue}
                unit={targets && view === "remaining" ? undefined : t("common.kcal")}
                label={plateLabel}
              />
            </div>

            <div className="w-full flex-1 space-y-5">
              {macroRows.map((m) => {
                const consumed = totals[m.key];
                const target = targets ? targets[m.key] : 0;
                const left = targets ? show(consumed, target) : 0;
                const over = targets && consumed > target;
                const valueText = !targets
                  ? `${Math.round(consumed)} ${t("common.g")}`
                  : view === "remaining"
                  ? `${Math.abs(left)} ${left < 0 ? t("meals.gOver") : t("meals.gLeft")}`
                  : `${Math.round(consumed)} / ${target} ${t("common.g")}`;
                return (
                  <div key={m.key}>
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <span style={{ color: C.dim }}>{m.label}</span>
                      <span
                        className="font-bold tabular-nums"
                        style={{ color: over ? C.redText : C.chalk }}
                      >
                        {valueText}
                      </span>
                    </div>
                    {targets && (
                      <div className="w-full rounded-full" style={{ height: 6, background: C.line }}>
                        <div
                          className="rounded-full transition-all duration-500"
                          style={{
                            height: 6,
                            background: m.color,
                            width: `${pct(consumed, target)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!targets && (
            <p className="text-sm mt-5" style={{ color: C.dim }}>
              {t("meals.setTargetPre")}{" "}
              <Link to="/onboarding" className="underline" style={{ color: C.chalk }}>
                {t("common.myPlan")}
              </Link>{" "}
              {t("meals.setTargetPost")}
            </p>
          )}
        </Panel>

        {/* Add meal */}
        <Panel className="p-5 md:p-6 mb-8">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-xl font-bold">{t("meals.addFood")}</h2>
            <div className="flex items-center gap-5">
              {[
                ["search", "meals.tabSearch"],
                ["custom", "meals.tabCustom"],
              ].map(([m, k]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={tabClass}
                  style={tabStyle(mode === m)}
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </div>

          {/* Meal type */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {MEAL_TYPES.map((mt) => {
              const active = mealType === mt.id;
              return (
                <button
                  key={mt.id}
                  onClick={() => setMealType(mt.id)}
                  aria-pressed={active}
                  className="min-h-[44px] rounded px-3 py-2 text-sm transition flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    border: `1px solid ${active ? C.chalk : C.line}`,
                    background: active ? C.chalk : "transparent",
                    color: active ? C.rubber : C.chalk,
                    fontWeight: active ? 600 : 400,
                    outlineColor: C.chalk,
                  }}
                >
                  <span aria-hidden="true">{mt.emoji}</span>
                  {t(mt.labelKey)}
                </button>
              );
            })}
          </div>

          {mode === "search" ? (
            <>
              <div className="relative mb-3">
                <FaSearch
                  className="absolute top-1/2 -translate-y-1/2 start-4 pointer-events-none"
                  style={{ color: C.dim }}
                />
                <input
                  type="text"
                  dir="auto"
                  placeholder={t("meals.searchPlaceholder")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelected(null);
                  }}
                  className={`${inputClass} ps-11`}
                  style={inputStyle}
                />
              </div>

              {!selected && !search.trim() && (combos.length > 0 || recentItems.length > 0) && (
                <div className="mb-4 space-y-4">
                  {combos.length > 0 && (
                    <div>
                      <p className="text-sm mb-2" style={{ color: C.dim }}>{t("meals.combos")}</p>
                      <div className="space-y-2">
                        {combos.map((items, i) => (
                          <button
                            key={i}
                            type="button"
                            disabled={saving}
                            onClick={() => addItems(items)}
                            className="w-full min-h-[44px] text-start rounded px-3 py-2 flex items-center justify-between gap-3 hover:bg-[rgba(237,234,227,.06)] focus-visible:outline focus-visible:outline-2"
                            style={{ border: `1px solid ${C.line}`, outlineColor: C.chalk }}
                          >
                            <span className="min-w-0 text-sm">
                              {items.map((x) => `${savedName(x)}${x.unit === "جم" ? ` ${x.qty}${t("common.g")}` : ""}`).join(" + ")}
                            </span>
                            <span className="text-sm tabular-nums shrink-0" style={{ color: C.dim }}>
                              {items.reduce((s, x) => s + (x.calories || 0), 0)} {t("common.kcal")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {recentItems.length > 0 && (
                    <div>
                      <p className="text-sm mb-2" style={{ color: C.dim }}>{t("meals.recent")}</p>
                      <div className="flex flex-wrap gap-2">
                        {recentItems.map((x) => (
                          <button
                            key={x.id}
                            type="button"
                            disabled={saving}
                            onClick={() => addItems([x])}
                            className="min-h-[40px] rounded px-3 text-sm hover:bg-[rgba(237,234,227,.06)] focus-visible:outline focus-visible:outline-2"
                            style={{ border: `1px solid ${C.line}`, outlineColor: C.chalk }}
                          >
                            {savedName(x)}
                            {x.unit === "جم" ? ` · ${x.qty} ${t("common.g")}` : x.qty && x.qty !== 1 ? ` × ${x.qty}` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selected && (
                <div style={{ borderTop: `1px solid ${C.line}` }}>
                  {filteredFoods.length === 0 && (
                    <p className="text-sm py-3" style={{ color: C.dim }}>
                      {t("meals.noMatch")}
                    </p>
                  )}
                  {filteredFoods.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => pickFood(f)}
                      className="w-full min-h-[48px] text-start px-2 py-3 flex items-center justify-between gap-3 transition hover:bg-[rgba(237,234,227,.06)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                      style={{ borderBottom: `1px solid ${C.line}`, outlineColor: C.chalk }}
                    >
                      <span className="min-w-0">
                        <span className="font-semibold">{foodName(f)}</span>
                        <span className="block text-xs" style={{ color: C.dim }}>
                          {foodAlt(f)} · {foodUnit(f)}
                        </span>
                      </span>
                      <span className="text-sm tabular-nums shrink-0" style={{ color: C.dim }}>
                        {f.cal} {t("common.kcal")}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selected && preview && (
                <div className="pt-1">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-semibold text-lg">{foodName(selected)}</p>
                      <p className="text-xs" style={{ color: C.dim }}>
                        {t("meals.servingHint", { g: selected.g || 100, unit: foodUnit(selected) })}
                      </p>
                    </div>
                    <button
                      onClick={() => pickFood(null)}
                      className="min-h-[40px] px-3 text-sm underline"
                      style={{ color: C.dim }}
                    >
                      {t("meals.change")}
                    </button>
                  </div>

                  <div className="flex gap-2 mb-4" role="group">
                    {["g", "s"].map((k) => (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={qtyMode === k}
                        onClick={() => {
                          setQtyMode(k);
                          setQty(k === "g" ? String(Math.round(servings * (selected.g || 100)) || 100) : String(round1(servings) || 1));
                        }}
                        className="flex-1 min-h-[40px] rounded text-sm font-semibold"
                        style={{
                          background: qtyMode === k ? C.chalk : "transparent",
                          color: qtyMode === k ? C.rubber : C.dim,
                          border: `1px solid ${qtyMode === k ? C.chalk : C.line}`,
                        }}
                      >
                        {k === "g" ? t("meals.byGrams") : t("meals.byServing")}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm mb-2" style={{ color: C.dim }}>
                    {qtyMode === "g" ? t("meals.weightG") : t("meals.quantity")}
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    min="0"
                    step={qtyMode === "g" ? "1" : "0.25"}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className={`${inputClass} mb-4`}
                    style={inputStyle}
                  />

                  <p
                    className="flex flex-wrap items-baseline gap-x-5 gap-y-1 py-3 mb-4 font-bold tabular-nums"
                    style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}
                  >
                    <span style={{ color: C.chalk }}>
                      {preview.calories} <span className="text-xs font-normal" style={{ color: C.dim }}>{t("common.kcal")}</span>
                    </span>
                    <span style={{ color: C.redText }}>
                      {preview.protein} <span className="text-xs font-normal">{t("common.g")}</span>
                    </span>
                    <span style={{ color: C.yellowText }}>
                      {preview.carbs} <span className="text-xs font-normal">{t("common.g")}</span>
                    </span>
                    <span style={{ color: C.greenText }}>
                      {preview.fat} <span className="text-xs font-normal">{t("common.g")}</span>
                    </span>
                  </p>

                  <Btn onClick={addFood} disabled={saving} className="w-full min-h-[44px]">
                    {saving ? t("meals.saving") : t("meals.addToMeal")}
                  </Btn>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={addCustom} className="space-y-3">
              <input
                type="text"
                placeholder={t("meals.foodName")}
                value={custom.name}
                onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                required
                className={inputClass}
                style={inputStyle}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  dir="ltr"
                  min="0"
                  placeholder={t("meals.calPh")}
                  value={custom.calories}
                  onChange={(e) => setCustom({ ...custom, calories: e.target.value })}
                  required
                  className={inputClass}
                  style={inputStyle}
                />
                <input
                  type="number"
                  dir="ltr"
                  min="0"
                  placeholder={t("meals.proteinPh")}
                  value={custom.protein}
                  onChange={(e) => setCustom({ ...custom, protein: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                />
                <input
                  type="number"
                  dir="ltr"
                  min="0"
                  placeholder={t("meals.carbsPh")}
                  value={custom.carbs}
                  onChange={(e) => setCustom({ ...custom, carbs: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                />
                <input
                  type="number"
                  dir="ltr"
                  min="0"
                  placeholder={t("meals.fatPh")}
                  value={custom.fat}
                  onChange={(e) => setCustom({ ...custom, fat: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <Btn type="submit" disabled={saving} className="w-full min-h-[44px]">
                {saving ? t("meals.saving") : t("meals.addToMeal")}
              </Btn>
            </form>
          )}

          <p className="text-xs mt-4" style={{ color: C.dim }}>
            {t("meals.approx")}
          </p>
        </Panel>

        {/* Meals list */}
        <h2 className="text-2xl font-bold mb-4">{t("meals.listTitle", { n: meals.length })}</h2>

        {loading ? (
          <p style={{ color: C.dim }}>{t("common.loading")}</p>
        ) : meals.length === 0 ? (
          <p style={{ color: C.dim }}>{t("meals.empty")}</p>
        ) : (
          <div className="space-y-8 pb-10">
            {MEAL_TYPES.map((mt) => {
              const group = meals.filter((m) => m.mealType === mt.id);
              if (group.length === 0) return null;
              const groupCal = group.reduce((s, m) => s + (m.calories || 0), 0);

              return (
                <div key={mt.id}>
                  <div
                    className="flex items-center justify-between gap-3 pb-2"
                    style={{ borderBottom: `1px solid ${C.chalk}` }}
                  >
                    <h3 className="font-semibold text-lg">
                      <span aria-hidden="true">{mt.emoji}</span> {t(mt.labelKey)}
                    </h3>
                    <span className="font-semibold tabular-nums">
                      {groupCal} {t("common.kcal")}
                    </span>
                  </div>

                  <div>
                    {group.map((m) => (
                      <div
                        key={m.id}
                        className="py-3 flex items-center justify-between gap-3"
                        style={{ borderBottom: `1px solid ${C.line}` }}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {savedName(m)}
                            {m.unit === "جم" ? ` · ${m.qty} ${t("common.g")}` : m.qty && m.qty !== 1 ? ` × ${m.qty}` : ""}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: C.dim }}>
                            {savedUnit(m) && m.unit !== "جم" ? `${savedUnit(m)} · ` : ""}
                            {m.calories} {t("common.kcal")} · {t("meals.pShort")} {m.protein} {t("common.g")} · {t("meals.cShort")} {m.carbs} {t("common.g")} · {t("meals.fShort")} {m.fat} {t("common.g")}
                          </p>
                        </div>
                        {editId === m.id ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              dir="ltr"
                              min="0"
                              step={m.unit === "جم" ? "1" : "0.25"}
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              aria-label={m.unit === "جم" ? t("meals.weightG") : t("meals.quantity")}
                              className="w-20 min-h-[40px] rounded px-2 text-center"
                              style={inputStyle}
                            />
                            <Btn onClick={() => saveEdit(m)} className="min-h-[40px] px-3">{t("common.save")}</Btn>
                            <Btn variant="ghost" onClick={() => setEditId(null)} className="min-h-[40px] px-3">{t("common.cancel")}</Btn>
                          </div>
                        ) : (
                        <>
                        <button
                          onClick={() => startEdit(m)}
                          aria-label={t("meals.editQty")}
                          className="shrink-0 min-w-[44px] min-h-[44px] grid place-items-center rounded transition hover:bg-[rgba(237,234,227,.06)] focus-visible:outline focus-visible:outline-2"
                          style={{ color: C.dim, outlineColor: C.chalk }}
                        >
                          <FaPen />
                        </button>
                        <button
                          onClick={() => deleteMeal(m.id)}
                          aria-label={t("meals.deleteMeal")}
                          className="shrink-0 min-w-[44px] min-h-[44px] grid place-items-center rounded transition hover:bg-[rgba(237,234,227,.06)] focus-visible:outline focus-visible:outline-2"
                          style={{ color: C.dim, outlineColor: C.chalk }}
                        >
                          <FaTrash />
                        </button>
                        </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </Page>
  );
}

export default Meals;
