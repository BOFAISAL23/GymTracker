import { useEffect, useState } from "react";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useLanguage } from "../i18n/LanguageContext";
import { MUSCLES, EXERCISES, exerciseImg, findExercise } from "../services/exercises";
import { C, Page, TopBar, Panel, SectionTitle, Btn, Field, inputClass, inputStyle } from "../design/ui";

// معرض التمارين: تختار العضلة وتشوف صورة كل تمرين
function ExercisePicker({ onPick, lang, t }) {
  const [muscle, setMuscle] = useState("all");
  const [q, setQ] = useState("");
  const [hover, setHover] = useState(null);

  const list = EXERCISES.filter((e) => {
    if (muscle !== "all" && e.muscle !== muscle) return false;
    const s = q.trim().toLowerCase();
    return !s || e.ar.includes(s) || e.en.toLowerCase().includes(s);
  });

  const chip = (active) => ({
    background: active ? C.chalk : "transparent",
    color: active ? C.rubber : C.chalk,
    border: `1px solid ${active ? C.chalk : C.line}`,
  });

  return (
    <div className="md:col-span-2 rounded p-4" style={{ background: C.rubber, border: `1px solid ${C.line}` }}>
      <input
        type="text"
        dir="auto"
        placeholder={t("workouts.searchLib")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={`${inputClass} text-start mb-3`}
        style={inputStyle}
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {[{ id: "all" }, ...MUSCLES].map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={muscle === m.id}
            onClick={() => setMuscle(m.id)}
            className="min-h-[40px] px-3 rounded text-sm"
            style={chip(muscle === m.id)}
          >
            {m.id === "all" ? t("workouts.allMuscles") : lang === "ar" ? m.ar : m.en}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-sm" style={{ color: C.dim }}>{t("workouts.noExercise")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pe-1">
          {list.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onPick(e)}
              onMouseEnter={() => setHover(e.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(e.id)}
              onBlur={() => setHover(null)}
              className="text-start rounded overflow-hidden focus-visible:outline focus-visible:outline-2"
              style={{ background: C.panel, border: `1px solid ${C.line}`, outlineColor: C.chalk }}
            >
              <img
                src={exerciseImg(e.id, hover === e.id && e.imgs > 1 ? 1 : 0)}
                alt=""
                loading="lazy"
                className="w-full aspect-[4/3] object-cover"
                style={{ background: "#fff" }}
              />
              <span className="block px-3 py-2 text-sm font-semibold">
                {lang === "ar" ? e.ar : e.en}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Workouts() {
  const { t, lang, formatDate } = useLanguage();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [showLib, setShowLib] = useState(false);
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const loadWorkouts = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const q = query(
        collection(db, "workouts"),
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);

      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));

      // الأحدث أولاً
      list.sort((a, b) => new Date(b.date) - new Date(a.date));

      setWorkouts(list);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const resetForm = () => {
    setName("");
    setExerciseId("");
    setShowLib(false);
    setSets("");
    setReps("");
    setWeight("");
    setEditingId(null);
  };

  const saveWorkout = async (e) => {
    e.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSaving(true);

    const data = {
      name: name.trim(),
      exerciseId: exerciseId || "",
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight),
    };

    try {
      if (editingId) {
        // Update
        await updateDoc(doc(db, "workouts", editingId), data);

        setWorkouts(
          workouts.map((w) =>
            w.id === editingId ? { ...w, ...data } : w
          )
        );
      } else {
        // Create
        const newDoc = {
          ...data,
          userId: currentUser.uid,
          date: new Date().toISOString(),
        };

        const ref = await addDoc(collection(db, "workouts"), newDoc);

        setWorkouts([{ id: ref.id, ...newDoc }, ...workouts]);
      }

      resetForm();
    } catch (error) {
      console.log(error);
      alert(t("common.genericError"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (w) => {
    setEditingId(w.id);
    setName(w.name);
    setExerciseId(w.exerciseId || "");
    setSets(w.sets);
    setReps(w.reps);
    setWeight(w.weight);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "workouts", deleteId));
      setWorkouts(workouts.filter((w) => w.id !== deleteId));

      // إذا كان المحذوف هو اللي نعدله، نفرّغ النموذج
      if (editingId === deleteId) resetForm();
    } catch (error) {
      console.log(error);
      alert(t("workouts.deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  const ic = `${inputClass} text-start`;
  const th = "text-start py-3 px-3 font-normal text-sm";

  return (
    <Page>
      <TopBar />

      <main className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-bold">{t("workouts.title")}</h1>
        <p className="mt-2 mb-8" style={{ color: C.dim }}>
          {t("workouts.subtitle")}
        </p>

        {/* Form */}
        <Panel className="p-6 mb-10">
          <form onSubmit={saveWorkout}>
            <h2 className="text-xl md:text-2xl font-bold mb-5">
              {editingId ? t("workouts.editTitle") : t("workouts.addTitle")}
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <Btn type="button" variant="ghost" onClick={() => setShowLib(!showLib)}>
                  {showLib ? t("workouts.hideLib") : t("workouts.pickLib")}
                </Btn>
                {exerciseId && findExercise(exerciseId) && (
                  <img
                    src={exerciseImg(exerciseId, 0)}
                    alt={name}
                    className="h-12 w-16 object-cover rounded"
                    style={{ background: "#fff" }}
                  />
                )}
              </div>

              {showLib && (
                <ExercisePicker
                  lang={lang}
                  t={t}
                  onPick={(e) => {
                    setName(lang === "ar" ? e.ar : e.en);
                    setExerciseId(e.id);
                    setShowLib(false);
                  }}
                />
              )}

              <Field label={t("workouts.exercise")} className="md:col-span-2">
                <input
                  type="text"
                  placeholder={t("workouts.exercisePlaceholder")}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setExerciseId("");
                  }}
                  required
                  className={ic}
                  style={inputStyle}
                />
              </Field>

              <Field label={t("workouts.sets")}>
                <input
                  type="number"
                  dir="ltr"
                  min="1"
                  placeholder="4"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  required
                  className={ic}
                  style={inputStyle}
                />
              </Field>

              <Field label={t("workouts.reps")}>
                <input
                  type="number"
                  dir="ltr"
                  min="1"
                  placeholder="10"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  required
                  className={ic}
                  style={inputStyle}
                />
              </Field>

              <Field label={t("workouts.weightKg")} className="md:col-span-2">
                <input
                  type="number"
                  dir="ltr"
                  min="0"
                  step="0.5"
                  placeholder="60"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  className={ic}
                  style={inputStyle}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <Btn type="submit" disabled={saving}>
                {saving
                  ? t("workouts.saving")
                  : editingId
                  ? t("workouts.saveChanges")
                  : t("workouts.addTitle")}
              </Btn>

              {editingId && (
                <Btn type="button" variant="ghost" onClick={resetForm}>
                  {t("common.cancel")}
                </Btn>
              )}
            </div>
          </form>
        </Panel>

        {/* List */}
        <SectionTitle>{t("workouts.myWorkouts")}</SectionTitle>

        {loading ? (
          <p style={{ color: C.dim }}>{t("common.loading")}</p>
        ) : workouts.length === 0 ? (
          <p style={{ color: C.dim }}>{t("workouts.empty")}</p>
        ) : (
          <Panel className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] whitespace-nowrap tabular-nums">
              <thead>
                <tr style={{ color: C.dim, borderBottom: `1px solid ${C.line}` }}>
                  <th className={th}>{t("workouts.colExercise")}</th>
                  <th className={th}>
                    {t("workouts.colSets")} × {t("workouts.colReps")}
                  </th>
                  <th className={th}>{t("workouts.colWeight")}</th>
                  <th className={th}>{t("workouts.colDate")}</th>
                  <th className={th}>
                    <span className="sr-only">{t("workouts.colAction")}</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {workouts.map((w) => (
                  <tr key={w.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td className="py-3 px-3 font-bold">
                      <span className="flex items-center gap-3">
                        {w.exerciseId && findExercise(w.exerciseId) && (
                          <img
                            src={exerciseImg(w.exerciseId, 0)}
                            alt=""
                            loading="lazy"
                            className="h-10 w-14 object-cover rounded shrink-0"
                            style={{ background: "#fff" }}
                          />
                        )}
                        {w.name}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span dir="ltr" className="inline-block">
                        {w.sets} × {w.reps}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold" style={{ color: C.blueText }}>
                      {w.weight} {t("common.kg")}
                    </td>
                    <td className="py-3 px-3" style={{ color: C.dim }}>
                      {formatDate(w.date, { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-5 justify-end">
                        <button
                          onClick={() => startEdit(w)}
                          className="underline underline-offset-4 min-h-[44px]"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => setDeleteId(w.id)}
                          className="underline underline-offset-4 min-h-[44px]"
                          style={{ color: C.redText }}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </main>

      {/* Delete confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6 z-50"
          style={{ background: "rgba(0,0,0,.7)" }}
        >
          <Panel className="p-7 w-full max-w-sm" role="dialog" aria-modal="true">
            <h3 className="text-2xl font-bold mb-2">{t("workouts.deleteTitle")}</h3>
            <p className="mb-6" style={{ color: C.dim }}>
              {t("workouts.deleteWarning")}
            </p>

            <div className="flex gap-3">
              <Btn variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>
                {t("common.cancel")}
              </Btn>
              <Btn variant="danger" className="flex-1" onClick={confirmDelete}>
                {t("common.delete")}
              </Btn>
            </div>
          </Panel>
        </div>
      )}
    </Page>
  );
}

export default Workouts;
